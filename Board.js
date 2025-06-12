const startBoard = (game, options = { playAgainst: 'human', aiColor: 'black', aiLevel: 'medium', timeControl: 600, handleOnlineMove: null }) => {
    // Initialize game state and UI elements
    const aiPlayer = options.playAgainst === 'ai' ? ai(options.aiColor) : null;
    const board = document.getElementById('board');
    const squares = board.querySelectorAll('.square');
    const whiteSematary = document.getElementById('whiteSematary');
    const blackSematary = document.getElementById('blackSematary');
    const turnSign = document.getElementById('turn');
    const whiteTimer = document.getElementById('whiteTimer');
    const blackTimer = document.getElementById('blackTimer');
    
    let clickedPieceName = null;
    let gameState = 'white_turn';
    let timerInterval;
    let whiteTime = options.timeControl; // Use timeControl from options
    let blackTime = options.timeControl; // Use timeControl from options
    let lastClickedSquare = null;

    // Timer functions
    const updateTimerDisplay = () => {
        whiteTimer.textContent = formatTime(whiteTime);
        blackTimer.textContent = formatTime(blackTime);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    const startTimer = () => {
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            if (game.turn === 'white') {
                whiteTime--;
                if (whiteTime <= 0) {
                    game.timeOut('white');
                }
            } else {
                blackTime--;
                if (blackTime <= 0) {
                    game.timeOut('black');
                }
            }
            updateTimerDisplay();
        }, 1000);
    };

    const handleTimeout = (color) => {
        clearInterval(timerInterval);
        game.emit('checkMate', color === 'white' ? 'black' : 'white');
    };

    const resetTimers = () => {
        clearInterval(timerInterval);
        whiteTime = options.timeControl; // Reset to selected time control
        blackTime = options.timeControl; // Reset to selected time control
        updateTimerDisplay();
    };

    // Board setup functions
    const resetBoard = () => {
        // Clear semataries
        whiteSematary.querySelectorAll('div').forEach(div => div.innerHTML = '');
        blackSematary.querySelectorAll('div').forEach(div => div.innerHTML = '');
        
        // Reset timers
        resetTimers();
        
        // Clear board
        squares.forEach(square => {
            square.innerHTML = '';
            square.classList.remove('allowed', 'clicked-square', 'last-move');
        });

        // Place pieces
        game.pieces.forEach(piece => {
            const square = document.getElementById(piece.position);
            if (square) {
                square.innerHTML = `<img class="piece ${piece.rank}" id="${piece.name}" src="img/${piece.color}-${piece.rank}.webp">`;
            }
        });

        // Hide end scene
        document.getElementById('endscene').classList.remove('show');
        
        // Reset game state
        gameState = 'white_turn';
        clickedPieceName = null;
        lastClickedSquare = null;
        updateTurnDisplay();
    };

    // Game state management
    const setGameState = (state) => {
        gameState = state;
        updateTurnDisplay();
    };

    const updateTurnDisplay = () => {
        if (gameState === 'ai_thinking') {
            turnSign.innerHTML = `${options.aiColor.charAt(0).toUpperCase() + 
                options.aiColor.slice(1)}'s Turn (AI thinking...)`;
        } else if (gameState === 'checkmate') {
            turnSign.innerHTML = "Game Over";
        } else {
            turnSign.innerHTML = gameState === 'white_turn' ? 
                "White's Turn" : "Black's Turn";
        }
    };

    // Square highlighting functions
    const setAllowedSquares = (pieceImg) => {
        clearSquares();
        
        clickedPieceName = pieceImg.id;
        const allowedMoves = game.getPieceAllowedMoves(clickedPieceName);
        
        if (allowedMoves && allowedMoves.length > 0) {
            const clickedSquare = pieceImg.parentNode;
            clickedSquare.classList.add('clicked-square');
            lastClickedSquare = clickedSquare;

            allowedMoves.forEach(allowedMove => {
                const square = document.getElementById(allowedMove);
                if (square) {
                    square.classList.add('allowed');
                }
            });
            return true;
        }
        
        clickedPieceName = null;
        return false;
    };

    const clearSquares = () => {
        board.querySelectorAll('.allowed').forEach(square => 
            square.classList.remove('allowed'));
        if (lastClickedSquare) {
            lastClickedSquare.classList.remove('clicked-square');
            lastClickedSquare = null;
        }
    };

    const setLastMoveSquares = (from, to) => {
        board.querySelectorAll('.last-move').forEach(square => 
            square.classList.remove('last-move'));
        from.classList.add('last-move');
        to.classList.add('last-move');
    };

    // Piece movement logic
    const movePiece = (square) => {
        console.log("movePiece called on square:", square.id);
        if (gameState === 'ai_thinking' || gameState === 'checkmate') {
            console.log("Game state prevents move.", gameState);
            return;
        }

        const position = parseInt(square.getAttribute('id'), 10);
        const existedPiece = game.getPieceByPos(position);

        if (existedPiece && existedPiece.color === game.turn) {
            console.log("Clicked on a piece of the current player's color:", existedPiece.name);
            const pieceImg = document.getElementById(existedPiece.name);
            if (pieceImg) {
                setAllowedSquares(pieceImg);
            }
            return;
        }

        if (clickedPieceName) {
            const pieceToMove = game.getPieceByName(clickedPieceName);
            console.log("Attempting to move piece:", pieceToMove.name, "from:", pieceToMove.position, "to:", position);
            if (!pieceToMove) {
                console.error("Piece to move not found:", clickedPieceName);
                return;
            }

            const fromPosition = pieceToMove.position;
            const success = game.movePiece(pieceToMove, position);
            console.log("game.movePiece returned:", success);
            if (success) {
                clearSquares();
                
                // If online game, send move to server
                if (options.playAgainst === 'online' && options.handleOnlineMove) {
                    options.handleOnlineMove(pieceToMove.name, fromPosition, position);
                }

                clickedPieceName = null;
                
                if (options.playAgainst === 'ai' && game.turn === options.aiColor) {
                    setGameState('ai_thinking');
                    aiPlayer.play(game.pieces, aiMove => {
                        const aiMovedPiece = game.getPieceByName(aiMove.move.pieceName);
                        if (aiMovedPiece) {
                            game.movePiece(aiMovedPiece, aiMove.move.position);
                        }
                    });
                }
            } else {
                console.log("Move was not successful. Clearing selections.");
                clearSquares(); // Clear selection if move not successful
            }
        } else {
            console.log("No piece clicked to move. Clearing selections.");
            clearSquares();
        }
    };

    // Event listeners
    squares.forEach(square => {
        square.addEventListener("click", function() {
            movePiece(this);
        });
        
        square.addEventListener("dragover", function(event) {
            event.preventDefault();
        });
        
        square.addEventListener("drop", function() {
            movePiece(this);
        });

        // Add touch event listeners for mobile
        square.addEventListener("touchstart", function(event) {
            event.preventDefault();
            movePiece(this);
        });
    });

    // Piece drag and drop
    const setupPieceDragAndDrop = () => {
        document.querySelectorAll('img.piece').forEach(pieceImg => {
            pieceImg.setAttribute('draggable', true);
            
            pieceImg.addEventListener("dragstart", function(event) {
                if (gameState === 'ai_thinking' || gameState === 'checkmate') {
                    event.preventDefault();
                    return;
                }
                event.dataTransfer.setData("text", event.target.id);
                setAllowedSquares(event.target);
            });

            pieceImg.addEventListener("click", function(event) {
                if (gameState === 'ai_thinking' || gameState === 'checkmate') return;
                event.stopPropagation();
                setAllowedSquares(event.target);
            });

            // Add touch event listeners for mobile
            pieceImg.addEventListener("touchstart", function(event) {
                if (gameState === 'ai_thinking' || gameState === 'checkmate') return;
                event.stopPropagation();
                setAllowedSquares(event.target);
            });
        });
    };

    // Game event handlers
    game.on('pieceMove', move => {
        const from = document.getElementById(move.from);
        const to = document.getElementById(move.piece.position);
        if (from && to) {
            const pieceImg = document.getElementById(move.piece.name);
            if (pieceImg) {
                setLastMoveSquares(from, to);
            }
        }
    });

    game.on('turnChange', turn => {
        setGameState(turn + '_turn');
        startTimer();
    });

    game.on('promotion', queen => {
        const square = document.getElementById(queen.position);
        if (square) {
            square.innerHTML = `<img class="piece queen" id="${queen.name}" src="img/${queen.color}-queen.webp">`;
            setupPieceDragAndDrop();
        }
    });

    game.on('kill', piece => {
        const pieceImg = document.getElementById(piece.name);
        if (pieceImg) {
            pieceImg.remove();
            const sematary = piece.color === 'white' ? 
                blackSematary : whiteSematary;
            const pieceDiv = sematary.querySelector(`.${piece.rank}`);
            if (pieceDiv) {
                const img = document.createElement('img');
                img.src = `img/${piece.color}-${piece.rank}.webp`;
                img.classList.add('captured-piece');
                pieceDiv.appendChild(img);
            }
        }
    });

    game.on('check', () => {
        // Handle check UI - e.g., highlight king or show message
    });

    game.on('checkMate', ({ winner }) => {
        clearInterval(timerInterval);
        setGameState('checkmate');
        const winningSign = document.querySelector('#endscene .winning-sign');
        winningSign.textContent = `${winner.charAt(0).toUpperCase() + winner.slice(1)} wins by Checkmate!`;
        document.getElementById('endscene').classList.add('show');
        game.createConfetti();
    });

    game.on('timeOut', ({ winner }) => {
        clearInterval(timerInterval);
        setGameState('timeout');
        const winningSign = document.querySelector('#endscene .winning-sign');
        winningSign.textContent = `${winner.charAt(0).toUpperCase() + winner.slice(1)} wins by Time!`;
        document.getElementById('endscene').classList.add('show');
        game.createConfetti();
    });

    game.on('staleMate', () => {
        clearInterval(timerInterval);
        setGameState('stalemate');
        const winningSign = document.querySelector('#endscene .winning-sign');
        winningSign.textContent = "Stalemate! It's a Draw.";
        document.getElementById('endscene').classList.add('show');
    });

    game.on('insufficientMaterial', () => {
        clearInterval(timerInterval);
        setGameState('insufficient_material');
        const winningSign = document.querySelector('#endscene .winning-sign');
        winningSign.textContent = "Draw by Insufficient Material!";
        document.getElementById('endscene').classList.add('show');
    });

    game.on('threefoldRepetition', () => {
        clearInterval(timerInterval);
        setGameState('threefold_repetition');
        const winningSign = document.querySelector('#endscene .winning-sign');
        winningSign.textContent = "Draw by Threefold Repetition!";
        document.getElementById('endscene').classList.add('show');
    });

    game.on('fiftyMoveRule', () => {
        clearInterval(timerInterval);
        setGameState('fifty_move_rule');
        const winningSign = document.querySelector('#endscene .winning-sign');
        winningSign.textContent = "Draw by Fifty-move Rule!";
        document.getElementById('endscene').classList.add('show');
    });

    // Initial setup
    resetBoard();
    setupPieceDragAndDrop();
};