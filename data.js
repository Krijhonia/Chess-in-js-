const pieces = [
    // White pieces
    { rank: 'rook', position: 11, color: 'white', name: 'whiteRook1', ableToCastle: true, initialPosition: 11 },
    { rank: 'knight', position: 12, color: 'white', name: 'whiteKnight1', initialPosition: 12 },
    { rank: 'bishop', position: 13, color: 'white', name: 'whiteBishop1', initialPosition: 13 },
    { rank: 'queen', position: 14, color: 'white', name: 'whiteQueen', initialPosition: 14 },
    { rank: 'king', position: 15, color: 'white', name: 'whiteKing', ableToCastle: true, initialPosition: 15 },
    { rank: 'bishop', position: 16, color: 'white', name: 'whiteBishop2', initialPosition: 16 },
    { rank: 'knight', position: 17, color: 'white', name: 'whiteKnight2', initialPosition: 17 },
    { rank: 'rook', position: 18, color: 'white', name: 'whiteRook2', ableToCastle: true, initialPosition: 18 },
    { rank: 'pawn', position: 21, color: 'white', name: 'whitePawn1', initialPosition: 21 },
    { rank: 'pawn', position: 22, color: 'white', name: 'whitePawn2', initialPosition: 22 },
    { rank: 'pawn', position: 23, color: 'white', name: 'whitePawn3', initialPosition: 23 },
    { rank: 'pawn', position: 24, color: 'white', name: 'whitePawn4', initialPosition: 24 },
    { rank: 'pawn', position: 25, color: 'white', name: 'whitePawn5', initialPosition: 25 },
    { rank: 'pawn', position: 26, color: 'white', name: 'whitePawn6', initialPosition: 26 },
    { rank: 'pawn', position: 27, color: 'white', name: 'whitePawn7', initialPosition: 27 },
    { rank: 'pawn', position: 28, color: 'white', name: 'whitePawn8', initialPosition: 28 },

    // Black pieces
    { rank: 'rook', position: 81, color: 'black', name: 'blackRook1', ableToCastle: true, initialPosition: 81 },
    { rank: 'knight', position: 82, color: 'black', name: 'blackKnight1', initialPosition: 82 },
    { rank: 'bishop', position: 83, color: 'black', name: 'blackBishop1', initialPosition: 83 },
    { rank: 'queen', position: 84, color: 'black', name: 'blackQueen', initialPosition: 84 },
    { rank: 'king', position: 85, color: 'black', name: 'blackKing', ableToCastle: true, initialPosition: 85 },
    { rank: 'bishop', position: 86, color: 'black', name: 'blackBishop2', initialPosition: 86 },
    { rank: 'knight', position: 87, color: 'black', name: 'blackKnight2', initialPosition: 87 },
    { rank: 'rook', position: 88, color: 'black', name: 'blackRook2', ableToCastle: true, initialPosition: 88 },
    { rank: 'pawn', position: 71, color: 'black', name: 'blackPawn1', initialPosition: 71 },
    { rank: 'pawn', position: 72, color: 'black', name: 'blackPawn2', initialPosition: 72 },
    { rank: 'pawn', position: 73, color: 'black', name: 'blackPawn3', initialPosition: 73 },
    { rank: 'pawn', position: 74, color: 'black', name: 'blackPawn4', initialPosition: 74 },
    { rank: 'pawn', position: 75, color: 'black', name: 'blackPawn5', initialPosition: 75 },
    { rank: 'pawn', position: 76, color: 'black', name: 'blackPawn6', initialPosition: 76 },
    { rank: 'pawn', position: 77, color: 'black', name: 'blackPawn7', initialPosition: 77 },
    { rank: 'pawn', position: 78, color: 'black', name: 'blackPawn8', initialPosition: 78 }
]; 

window.pieces = pieces; 