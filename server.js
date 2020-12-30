var bodyParser = require('body-parser'); 
const socketIo = require('socket.io')
const express = require('express')
const path = require('path')
const http = require('http')
const app = express()
const server = http.createServer(app)
const io = socketIo(server)

var rooms = ['Lobby']
var users = {}
app.use(bodyParser.json())

app.use(express.static(path.join(__dirname, 'front')))

io.sockets.on('connection', (socket) => {
    console.log('entrou')
    socket.on('adduser', (username) => {
        socket.username = username
        socket.room = 'Lobby'
        users[username] = username
        socket.join('Lobby')
        socket.emit('updatechat', 'SERVER', 'you have connected to Lobby');
        socket.broadcast.to('Lobby').emit('updatechat', 'SERVER', username + ' has connected to this room');
        socket.emit('updateUsers', socket.username)
        socket.broadcast.to('Lobby').emit('updateUsers', socket.username)
        console.log(users)
    })

    socket.on('disconnect', function() {
        delete users[socket.username];
        io.sockets.emit('updateUsers', users);
        socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
        socket.leave(socket.room);
        console.log('saiu')
        console.log(users)
    });

})

server.listen(process.env.PORT || 3000)