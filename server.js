const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'chess.html'));
});

// Serve static files
app.use(express.static(path.join(__dirname), { index: 'chess.html' }));

// Store active games and waiting players
const activeGames = new Map();
const waitingPlayers = [];

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('findGame', () => {
        if (waitingPlayers.length > 0) {
            const opponent = waitingPlayers.shift();
            const gameId = Date.now().toString();
            
            // Create new game
            activeGames.set(gameId, {
                players: [opponent, socket.id],
                moves: [],
                chat: []
            });

            // Notify both players
            io.to(opponent).emit('gameFound', { gameId, color: 'white' });
            socket.emit('gameFound', { gameId, color: 'black' });
        } else {
            waitingPlayers.push(socket.id);
            socket.emit('waitingForOpponent');
        }
    });

    socket.on('makeMove', ({ gameId, move }) => {
        const game = activeGames.get(gameId);
        if (game) {
            game.moves.push(move);
            const opponent = game.players.find(id => id !== socket.id);
            io.to(opponent).emit('opponentMove', move);
        }
    });

    socket.on('sendMessage', ({ gameId, message }) => {
        const game = activeGames.get(gameId);
        if (game) {
            const chatMessage = {
                sender: socket.id,
                text: message,
                timestamp: new Date().toISOString()
            };
            game.chat.push(chatMessage);
            
            // Send message to both players
            game.players.forEach(playerId => {
                io.to(playerId).emit('chatMessage', {
                    ...chatMessage,
                    isSent: playerId === socket.id
                });
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        // Remove from waiting players if present
        const waitingIndex = waitingPlayers.indexOf(socket.id);
        if (waitingIndex !== -1) {
            waitingPlayers.splice(waitingIndex, 1);
        }

        // Handle disconnection from active games
        activeGames.forEach((game, gameId) => {
            if (game.players.includes(socket.id)) {
                const opponent = game.players.find(id => id !== socket.id);
                if (opponent) {
                    io.to(opponent).emit('opponentDisconnected');
                }
                activeGames.delete(gameId);
            }
        });
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 