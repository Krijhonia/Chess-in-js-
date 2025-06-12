This chess game is made by Kunal Rijhonia

A complete, feature-rich chess game built with JavaScript that offers multiple game modes and advanced chess features.

## Features

### Game Modes
- **Local Play**: Play against a friend on the same device
- **AI Opponent**: Challenge a computer opponent with advanced AI
- **Online Play**: Play against other players in real-time

### Time Controls
- 1 minute (bullet)
- 3 minutes (blitz)
- 10 minutes (rapid)

### Chess Features
- Complete chess rules implementation
- Legal move validation
- Special moves:
  - Castling (both kingside and queenside)
  - En passant
  - Pawn promotion
- Game state tracking:
  - Check detection
  - Checkmate detection
  - Stalemate detection
  - Threefold repetition
  - Fifty-move rule
  - Insufficient material

### UI Features
- Interactive chess board
- Move history display
- Captured pieces display
- Turn indicator
- Timer display for both players
- Visual move validation
- Last move highlighting
- Game end animations with confetti

### AI Features
- Advanced evaluation function considering:
  - Material value
  - Center control
  - Piece development
  - King safety
  - Mobility
  - Pawn structure
  - Bishop pair bonus
  - Rook open file bonus
- Configurable difficulty levels
- Time-limited move calculation

### Online Features
- Real-time multiplayer
- Automatic opponent matching
- Move synchronization
- Disconnection handling

## Technical Details
- Built with vanilla JavaScript
- Uses Socket.IO for online play
- Responsive design
- Modern UI/UX
- Efficient move validation
- Optimized AI algorithm

## How to Play
1. Choose your game mode (Local, AI, or Online)
2. Select your preferred time control
3. Click "Start Game" to begin
4. Make moves by clicking on pieces and their destination squares
5. The game will automatically detect check, checkmate, and other game states

Enjoy the game!
