class Game {
    constructor(pieces, turn = 'white') {
        this.startNewGame(pieces, turn);
    }

    startNewGame(pieces, turn) {
        this._setPieces(pieces);
        this.turn = turn;
        this.clickedPiece = null;
        this.gameState = 'ongoing';
        this.moveHistory = [];
        this.redoStack = [];
        this.lastMove = null;
        this.gameStartTime = Date.now();
        this.isInCheck = false;
        this.winner = null;

        this._events = {
            pieceMove: [],
            kill: [],
            check: [],
            promotion: [],
            checkMate: [],
            turnChange: [],
            gameReset: [],
            castling: []
        };

        this.history = new History();
    }

    _setPieces(pieces) {
        // Deep copy pieces to avoid reference issues
        this.pieces = pieces.map(piece => ({ 
            rank: piece.rank, 
            position: piece.position, 
            color: piece.color, 
            name: piece.name, 
            ableToCastle: piece.ableToCastle,
            initialPosition: piece.initialPosition 
        }));

        // Create lookup maps for faster access
        this.playerPieces = {
            white: this.pieces.filter(piece => piece.color === 'white'),
            black: this.pieces.filter(piece => piece.color === 'black')
        };

        this.piecesByPosition = new Map();
        this.piecesByName = new Map();
        this.pieces.forEach(piece => {
            this.piecesByPosition.set(piece.position, piece);
            this.piecesByName.set(piece.name, piece);
        });
    }

    _removePiece(piece) {
        const index = this.pieces.indexOf(piece);
        if (index !== -1) {
            this.pieces.splice(index, 1);
            this.playerPieces[piece.color] = this.playerPieces[piece.color].filter(p => p !== piece);
            this.piecesByPosition.delete(piece.position);
            this.piecesByName.delete(piece.name);
        }
    }

    _addPiece(piece) {
        this.pieces.push(piece);
        this.playerPieces[piece.color].push(piece);
        this.piecesByPosition.set(piece.position, piece);
        this.piecesByName.set(piece.name, piece);
    }

    saveHistory() {
        this.history.save();
    }

    addToHistory(move) {
        this.history.add(move);
        this.moveHistory.push({
            ...move,
            timestamp: Date.now() - this.gameStartTime,
            turn: this.turn,
            notation: this._getMoveNotation(move)
        });
    }

    _getMoveNotation(move) {
        const piece = move.piece;
        const from = move.from;
        const to = move.to;
        const isCapture = this.piecesByPosition.has(to);
        
        let notation = '';
        
        // Handle castling
        if (move.castling) {
            notation = to - from > 0 ? 'O-O' : 'O-O-O';
        }
        else {
            // Add piece letter for non-pawns
            if (piece.rank !== 'pawn') {
                notation += piece.rank === 'knight' ? 'N' : piece.rank[0].toUpperCase();
            }
            
            // Add capture notation
            if (isCapture) {
                if (piece.rank === 'pawn') {
                    notation += String.fromCharCode(96 + (from % 10));
                }
                notation += 'x';
            }
            
            // Add destination square
            notation += String.fromCharCode(96 + (to % 10)) + Math.floor(to / 10);
            
            // Add check/checkmate symbol
            if (this.isInCheck) {
                notation += this.winner ? '#' : '+';
            }
        }

        console.log('Generated move notation:', notation);
        return notation;
    }

    clearEvents() {
        this._events = {};
    }

    undo() {
        const step = this.history.pop();
        if (!step) return false;

        for (const subStep of step) {
            const piece = subStep.piece;
            
            if (subStep.from !== 0) {
                // Moving piece back
                if (subStep.to === 0) {
                    this._addPiece(piece);
                } else {
                    if (subStep.castling) {
                        piece.ableToCastle = true;
                    }
                    this._updatePiecePosition(piece, subStep.from);
                }
                this.triggerEvent('pieceMove', subStep);
            } else {
                // Removing piece that was added
                this._removePiece(piece);
                this.triggerEvent('kill', piece);
            }

            if (subStep.from !== 0 && subStep.to !== 0 && (!subStep.castling || piece.rank === 'king')) {
                this.softChangeTurn();
            }
        }

        // Update game state after undo
        this.isInCheck = this.king_checked(this.turn);
        return true;
    }

    on(eventName, callback) {
        if (this._events[eventName] && typeof callback === 'function') {
            this._events[eventName].push(callback);
        }
    }

    triggerEvent(eventName, params) {
        if (this._events[eventName]) {
            this._events[eventName].forEach(callback => callback(params));
        }
    }

    softChangeTurn() {
        this.turn = this.turn === 'white' ? 'black' : 'white';
        this.triggerEvent('turnChange', this.turn);
    }

    changeTurn() {
        this.softChangeTurn();
        this.saveHistory();
    }

    getPiecesByColor(color) {
        return this.playerPieces[color];
    }

    getPlayerPositions(color) {
        return this.playerPieces[color].map(piece => piece.position);
    }

    filterPositions(positions) {
        return positions.filter(pos => {
            const x = pos % 10;
            return pos > 10 && pos < 89 && x !== 9 && x !== 0;
        });
    }

    unblockedPositions(piece, allowedPositions, checking = true) {
        const unblockedPositions = [];
        const myColor = piece.color;
        const otherColor = myColor === 'white' ? 'black' : 'white';
        const myPositions = new Set(this.getPlayerPositions(myColor));
        const otherPositions = new Set(this.getPlayerPositions(otherColor));

        if (piece.rank === 'pawn') {
            // Attack moves
            for (const move of allowedPositions[0]) {
                if (checking && this.myKingChecked(move)) continue;
                if (otherPositions.has(move)) unblockedPositions.push(move);
            }

            // Forward moves
            for (const move of allowedPositions[1]) {
                if (myPositions.has(move) || otherPositions.has(move)) continue;
                if (checking && this.myKingChecked(move, false)) continue;
                
                // For two-step moves, check if the intermediate square is blocked
                if (Math.abs(move - piece.position) === 20) {
                    const intermediateSquare = (move + piece.position) / 2;
                    if (myPositions.has(intermediateSquare) || otherPositions.has(intermediateSquare)) continue;
                }
                
                unblockedPositions.push(move);
            }
        } else {
            // Other pieces
            for (const moveGroup of allowedPositions) {
                for (const move of moveGroup) {
                    if (myPositions.has(move)) break;
                    if (checking && this.myKingChecked(move)) {
                        if (otherPositions.has(move)) break;
                        continue;
                    }
                    unblockedPositions.push(move);
                    if (otherPositions.has(move)) break;
                }
            }
        }

        return this.filterPositions(unblockedPositions);
    }

    getPieceAllowedMoves(pieceName) {
        console.log(`getPieceAllowedMoves called for: ${pieceName}`);
        const piece = this.getPieceByName(pieceName);
        console.log(`  Retrieved piece:`, piece);
        console.log(`  Current turn: ${this.turn}, Piece color: ${piece.color}`);

        if (!piece || this.turn !== piece.color) {
            console.log(`  Piece not found or not current player's turn. Returning empty array.`);
            return [];
        }

        let allowedMoves = getAllowedMoves(piece);
        console.log(`  Raw allowed moves from getAllowedMoves(piece.js):`, allowedMoves);

        // Filter out moves that would put own king in check
        const finalAllowedMoves = this.unblockedPositions(piece, allowedMoves, true);
        console.log(`  Final unblocked positions (after check validation):`, finalAllowedMoves);
        
        // Add castling moves for the king
        if (piece.rank === 'king') {
            const castlingMoves = this.getCastlingSquares(piece, allowedMoves);
            if (castlingMoves.length > 0) {
                console.log(`  Adding castling moves:`, castlingMoves);
                // Flatten the finalAllowedMoves array for easy concatenation
                let flatFinalMoves = [];
                if (Array.isArray(finalAllowedMoves[0])) { // Check if it's an array of arrays (e.g. pawn moves)
                    finalAllowedMoves.forEach(subArr => flatFinalMoves = flatFinalMoves.concat(subArr));
                } else {
                    flatFinalMoves = finalAllowedMoves;
                }
                return flatFinalMoves.concat(castlingMoves);
            }
        }

        return finalAllowedMoves;
    }

    getCastlingSquares(king, allowedMoves) {
        if (!king.ableToCastle || this.isInCheck) return allowedMoves;

        const rook1 = this.getPieceByName(king.color + 'Rook1');
        const rook2 = this.getPieceByName(king.color + 'Rook2');
        
        // Queenside castling
        if (rook1?.ableToCastle) {
            const castlingPosition = rook1.position + 2;
            if (this._canCastle(king, castlingPosition, -1)) {
                allowedMoves[1].push(castlingPosition);
            }
        }

        // Kingside castling
        if (rook2?.ableToCastle) {
            const castlingPosition = rook2.position - 1;
            if (this._canCastle(king, castlingPosition, 1)) {
                allowedMoves[0].push(castlingPosition);
            }
        }

        return allowedMoves;
    }

    _canCastle(king, castlingPosition, direction) {
        // Check if squares between king and rook are empty and safe
        const start = direction > 0 ? castlingPosition - 1 : king.position + 1;
        const end = direction > 0 ? king.position - 1 : castlingPosition;
        
        for (let pos = start; direction > 0 ? pos >= end : pos <= end; pos += direction) {
            if (this.piecesByPosition.has(pos) || this.myKingChecked(pos, true)) {
                return false;
            }
        }
        
        return true;
    }

    getPieceByName(piecename) {
        return this.piecesByName.get(piecename);
    }

    getPieceByPos(position) {
        return this.piecesByPosition.get(position);
    }

    setClickedPiece(piece) {
        this.clickedPiece = piece;
    }

    _updatePiecePosition(piece, newPosition) {
        this.piecesByPosition.delete(piece.position);
        piece.position = newPosition;
        this.piecesByPosition.set(newPosition, piece);
    }

    movePiece(piece, to, isOnlineOpponentMove = false) {
        // Basic validation and turn check
        if (!piece || this.turn !== piece.color) return false;

        const from = piece.position;
        const allowedMoves = this.getPieceAllowedMoves(piece.name);
        if (!allowedMoves.includes(to)) return false; // Validate move

        const capturedPiece = this.getPieceByPos(to);
        const isCastling = (piece.rank === 'king' && piece.ableToCastle && Math.abs(from - to) === 2); // Simplified check for castling

        // 1. Update internal game state *before* animation
        this._updatePiecePosition(piece, to); // This function should update piece.position and maps
        if (capturedPiece) {
            this.kill(capturedPiece); // This should remove captured piece from internal state
        }
        if (isCastling) {
            // Handle rook movement for castling internally
            const rookName = piece.color + 'Rook' + (to > from ? '2' : '1'); // Assuming standard rook names
            this.castleRook(rookName); // This should update rook's internal position
            piece.ableToCastle = false;
        }

        // Store move in history (needed for undo/redo)
        const move = {
            from: from,
            to: to,
            piece: piece,
            capturedPiece: capturedPiece,
            castling: isCastling,
            notation: this._getMoveNotation({ from, to, piece, castling: isCastling })
        };
        this.moveHistory.push(move);
        this.redoStack = []; // Clear redo stack on new move

        // 2. Animate the visual move
        const pieceElement = document.getElementById(piece.name);
        const toSquare = document.getElementById(to);

        console.log("movePiece - pieceElement:", pieceElement);
        console.log("movePiece - toSquare:", toSquare);

        if (pieceElement) {
            pieceElement.classList.add('moving');

            // Handle capture animation visually
            if (capturedPiece) {
                const capturedElement = document.getElementById(capturedPiece.name);
                if (capturedElement) {
                    capturedElement.classList.add('captured');
                    console.log("movePiece - capturedElement added 'captured' class:", capturedElement);
                    // Remove captured piece visually after animation
                    setTimeout(() => {
                        capturedElement.remove();
                        console.log("movePiece - capturedElement removed:", capturedElement);
                    }, 400); // Match capture animation duration
                }
            }

            setTimeout(() => {
                console.log("movePiece - Inside setTimeout. Appending piece.");
                console.log("movePiece - pieceElement.parentNode before removal:", pieceElement.parentNode);
                // Remove piece from its original parent node before appending to new square
                if (pieceElement.parentNode) {
                    pieceElement.parentNode.removeChild(pieceElement);
                    console.log("movePiece - pieceElement removed from old parent.");
                }
                toSquare.appendChild(pieceElement);
                console.log("movePiece - pieceElement appended to new square.");
                pieceElement.classList.remove('moving');

                // 3. Emit event after visual update (if not online opponent move)
                if (!isOnlineOpponentMove) {
                    this.triggerEvent('pieceMove', move); // Emit the full move object
                }

                // Handle pawn promotion visual update (if not online opponent move)
                if (piece.rank === 'pawn' && (to > 80 || to < 20) && !isOnlineOpponentMove) {
                     this.promote(piece);
                }

                // Change turn
                if (!isOnlineOpponentMove) {
                    this.changeTurn(); // Calls softChangeTurn and saveHistory
                } else {
                    this.softChangeTurn(); // For online moves, turn is changed by server
                }

                // Check for check/checkmate
                this.isInCheck = this.king_checked(this.turn);
                if (this.isInCheck) {
                    this.triggerEvent('check', this.turn);
                    if (this.king_dead(this.turn)) {
                        this.checkmate(piece.color);
                    }
                }
            }, 300); // Match movePiece animation duration
        }

        return true; // Indicate successful move
    }

    highlightSquare(square, type = 'move') {
        const squareElement = document.querySelector(`[data-square="${square}"]`);
        if (squareElement) {
            squareElement.classList.add('highlight');
            if (type === 'check') {
                squareElement.classList.add('check');
            }
        }
    }

    removeHighlight(square) {
        const squareElement = document.querySelector(`[data-square="${square}"]`);
        if (squareElement) {
            squareElement.classList.remove('highlight', 'check');
        }
    }

    flipBoard() {
        const board = document.getElementById('board');
        board.classList.add('flipping');
        setTimeout(() => {
            board.classList.remove('flipping');
        }, 600);
    }

    updateTimerDisplay() {
        const whiteTimer = document.getElementById('whiteTimer');
        const blackTimer = document.getElementById('blackTimer');
        
        if (whiteTimer && blackTimer) {
            whiteTimer.textContent = this.formatTime(this.whiteTime);
            blackTimer.textContent = this.formatTime(this.blackTime);
            
            // Add low time animation
            if (this.whiteTime <= 30) {
                whiteTimer.classList.add('low-time');
            } else {
                whiteTimer.classList.remove('low-time');
            }
            
            if (this.blackTime <= 30) {
                blackTimer.classList.add('low-time');
            } else {
                blackTimer.classList.remove('low-time');
            }
        }
    }

    showVictory(winner) {
        const board = document.getElementById('board');
        board.classList.add('victory');
        
        // Add confetti effect
        this.createConfetti();
        
        // Show victory message with animation
        const endScene = document.getElementById('endscene');
        const winningSign = document.querySelector('.winning-sign');
        
        if (endScene && winningSign) {
            winningSign.textContent = `${winner} wins!`;
            endScene.classList.add('show');
        }
    }

    kill(piece) {
        this._removePiece(piece);
        this.addToHistory({ from: piece.position, to: 0, piece: piece });
        this.triggerEvent('kill', piece);
    }

    castleRook(rookName) {
        const rook = this.getPieceByName(rookName);
        if (!rook) return;

        const prevPosition = rook.position;
        const newPosition = rookName.includes('Rook2') ? prevPosition - 2 : prevPosition + 3;

        this._updatePiecePosition(rook, newPosition);
        const move = { from: prevPosition, to: newPosition, piece: rook, castling: true };
        this.triggerEvent('pieceMove', move);
        this.addToHistory(move);
        this.triggerEvent('castling', { rook, from: prevPosition, to: newPosition });
    }

    promote(pawn) {
        const oldName = pawn.name;
        pawn.name = pawn.name.replace('Pawn', 'Queen');
        pawn.rank = 'queen';
        
        // Update piece maps
        this.piecesByName.delete(oldName);
        this.piecesByName.set(pawn.name, pawn);
        
        this.addToHistory({ from: 0, to: pawn.position, piece: pawn });
        this.triggerEvent('promotion', pawn);
    }

    myKingChecked(pos, kill = true) {
        const piece = this.clickedPiece;
        if (!piece) return false;

        const originalPosition = piece.position;
        const otherPiece = this.getPieceByPos(pos);
        const shouldKillOtherPiece = kill && otherPiece && otherPiece.rank !== 'king';
        
        // Temporarily move piece
        this._updatePiecePosition(piece, pos);
        if (shouldKillOtherPiece) {
            this._removePiece(otherPiece);
        }
        
        const isChecked = this.king_checked(piece.color);
        
        // Restore position
        this._updatePiecePosition(piece, originalPosition);
        if (shouldKillOtherPiece) {
            this._addPiece(otherPiece);
        }
        
        return isChecked;
    }

    king_dead(color) {
        const pieces = this.getPiecesByColor(color);
        const originalPiece = this.clickedPiece;
        
        for (const piece of pieces) {
            this.setClickedPiece(piece);
            const allowedMoves = this.unblockedPositions(piece, getAllowedMoves(piece), true);
            if (allowedMoves.length) {
                this.setClickedPiece(originalPiece);
                return false;
            }
        }
        
        this.setClickedPiece(originalPiece);
        return true;
    }

    king_checked(color) {
        const originalPiece = this.clickedPiece;
        const king = this.getPieceByName(color + 'King');
        if (!king) return false; // King not found (e.g., in test scenarios)

        // Temporarily move the king out of the way for check calculation
        const originalKingPosition = king.position;
        this._updatePiecePosition(king, 0); // Move king to a temporary invalid position

        // Check if any opponent piece can attack the king's original position
        const opponentColor = color === 'white' ? 'black' : 'white';
        const opponentPieces = this.getPiecesByColor(opponentColor);

        for (const opponentPiece of opponentPieces) {
            // For check calculation, use unblockedPositions with checking = false
            const moves = this.unblockedPositions(opponentPiece, getAllowedMoves(opponentPiece), false);
            if (moves.includes(originalKingPosition)) {
                this._updatePiecePosition(king, originalKingPosition); // Restore king position
                return true;
            }
        }
        
        this._updatePiecePosition(king, originalKingPosition); // Restore king position
        return false;
    }

    checkmate(winnerColor) {
        this.winner = winnerColor;
        this.gameState = 'checkmate';
        this.showVictory(winnerColor);
        this.triggerEvent('checkMate', winnerColor);
    }

    createConfetti() {
        const confettiCount = 200;
        const confettiColors = ['#f00', '#0f0', '#00f', '#ff0', '#0ff', '#f0f'];

        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.classList.add('confetti');
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.top = Math.random() * 100 + 'vh';
            confetti.style.backgroundColor = confettiColors[Math.floor(Math.random() * confettiColors.length)];
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
            confetti.style.animationDelay = Math.random() * 2 + 's';
            document.body.appendChild(confetti);

            confetti.addEventListener('animationend', () => {
                confetti.remove();
            });
        }

        // Show victory crown
        const victoryCrown = document.createElement('img');
        victoryCrown.src = 'img/crown.png';
        victoryCrown.classList.add('victory-crown');
        document.body.appendChild(victoryCrown);

        victoryCrown.addEventListener('animationend', () => {
            victoryCrown.remove();
        });
    }

    timeOut(loserColor) {
        this.winner = loserColor === 'white' ? 'black' : 'white';
        this.gameState = 'timeout';
        this.showVictory(this.winner);
        this.triggerEvent('timeOut', loserColor);
    }

    getGameStatus() {
        return {
            turn: this.turn,
            gameState: this.gameState,
            isInCheck: this.isInCheck,
            winner: this.winner,
            moveHistory: this.moveHistory.map(move => move.notation) // Return notations
        };
    }

    fullReset() {
        this.startNewGame(this.pieces, 'white');
        this.triggerEvent('gameReset');
    }

    undoMove() {
        if (this.moveHistory.length === 0) return null;

        const lastMove = this.moveHistory.pop();
        this.redoStack.push(lastMove);

        // Get the last move's details
        const { from, to, piece, capturedPiece } = lastMove;

        // Move the piece back to its original position
        const pieceElement = document.querySelector(`[data-square="${to}"] img`);
        if (pieceElement) {
            const fromSquare = document.querySelector(`[data-square="${from}"]`);
            fromSquare.appendChild(pieceElement);
        }

        // Restore captured piece if any
        if (capturedPiece) {
            const toSquare = document.querySelector(`[data-square="${to}"]`);
            const capturedPieceElement = document.createElement('img');
            capturedPieceElement.src = capturedPiece.src;
            capturedPieceElement.className = 'piece';
            capturedPieceElement.dataset.piece = capturedPiece.type;
            toSquare.appendChild(capturedPieceElement);
        }

        // Update game state
        this.turn = this.turn === 'white' ? 'black' : 'white';
        this.updateTurnDisplay();
        this.triggerEvent('turnChange');
        this.triggerEvent('moveUndone', lastMove);

        return lastMove;
    }

    redoMove() {
        if (this.redoStack.length === 0) return null;

        const moveToRedo = this.redoStack.pop();
        this.moveHistory.push(moveToRedo);

        // Get the move details
        const { from, to, piece, capturedPiece } = moveToRedo;

        // Move the piece to its new position
        const pieceElement = document.querySelector(`[data-square="${from}"] img`);
        if (pieceElement) {
            const toSquare = document.querySelector(`[data-square="${to}"]`);
            toSquare.appendChild(pieceElement);
        }

        // Remove captured piece if any
        if (capturedPiece) {
            const capturedPieceElement = document.querySelector(`[data-square="${to}"] img:not([data-piece="${piece.type}"])`);
            if (capturedPieceElement) {
                capturedPieceElement.remove();
            }
        }

        // Update game state
        this.turn = this.turn === 'white' ? 'black' : 'white';
        this.updateTurnDisplay();
        this.triggerEvent('turnChange');
        this.triggerEvent('moveRedone', moveToRedo);

        return moveToRedo;
    }

    makeMove(piece, from, to) {
        // Store the move in history
        const move = {
            from,
            to,
            piece,
            capturedPiece: this.getPieceByPos(to),
            timestamp: new Date().toISOString()
        };

        this.moveHistory.push(move);
        this.redoStack = []; // Clear redo stack when a new move is made

        // ... rest of the existing makeMove logic ...
    }
}