const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages')
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder (public)
app.use(express.static(path.join(__dirname, 'public'))); //dirname get the root path 

const botName = 'ChatTime Bot'

// Run when client connects
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

        // Welcome current user
        socket.emit('message', formatMessage(botName, 'Welcome to ChatTime')); // Emit only to the user that connected

        // Broadcast when a user connects
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${username} has joined the chat`)); // Emit to everybody except the user that connected

        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });

    });

    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    // Runs when client disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if (user) {
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`));

            // Send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }
    });

    //io.emit() // emit to everybody. Is used for the chat messages
});

const PORT = process.env.PORT || 3000 ;


server.listen(PORT, () => console.log(`Server running on port ${PORT}`));