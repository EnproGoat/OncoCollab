import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { ClientToServerEvents, ServerToClientEvents } from './types';
import apiService from './services/api.service';

type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

const app = express();

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.use(cors({ origin: "*" }));

const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = 5000;

io.on('connection', (socket: AppSocket) => {
    console.log(`[CONNEXION] Nouvel utilisateur: ${socket.id}`);

    socket.on('join-room', async (roomId: string) => {
        socket.join(roomId);

        const activeUsers: string[] = [];
        const room = io.sockets.adapter.rooms.get(roomId);

        if (room) {
            room.forEach((socketId) => {
                if (socketId !== socket.id) {
                    activeUsers.push(socketId);
                }
            });
        }

        socket.emit('get-existing-users', activeUsers);

        const messages = await apiService.getMessagesForRoom(roomId);
        if (messages) {
            socket.emit('message-history', messages);
        }

        socket.broadcast.to(roomId).emit('user-joined', socket.id);
    });

    socket.on('disconnect', async (roomId: string) => {
        console.log(`[DECONNEXION] Utilisateur: ${socket.id}`);



        socket.broadcast.to(roomId).emit('user-left', socket.id);
    });

    socket.on('sending-offer', (offer, toId) => {
        console.log(`[SIGNALING] Offer reçue de ${socket.id} à destination de ${toId}`);

        socket.to(toId).emit('receiving-offer', offer, socket.id);
    });

    socket.on('sending-answer', (answer, toId) => {
        console.log(`[SIGNALING] reponse reçue de ${socket.id} à ${toId}`);

        socket.to(toId).emit('receiving-answer', answer, socket.id);
    });

    socket.on('sending-ice-candidate', (candidate, toId) => {
        console.log(`[SIGNALING] ICE Candidate reçu de ${socket.id} à destination de ${toId}`);

        socket.to(toId).emit('receiving-ice-candidate', candidate, socket.id);
    });

    socket.on('send-chat-message', async (content, roomId, senderId) => {
        console.log(`[CHAT] Message de ${senderId} dans room ${roomId}: ${content}`);

        await apiService.saveMessage(content, senderId, roomId);

        socket.broadcast.to(roomId).emit('receive-chat-message', content, senderId, new Date());
    });
}
);


httpServer.listen(PORT, 'localhost', () => {
    console.log(`Serveur de signalisation démarré sur https://localhost:${PORT}`);
});