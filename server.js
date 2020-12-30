var bodyParser = require('body-parser'); 
const socketIo = require('socket.io')
const express = require('express')
const path = require('path')
const http = require('http')
const app = express()
const server = http.createServer(app)
const io = socketIo(server)

var rooms = {'Lobby':{}}
var totalUsers = {}
app.use(bodyParser.json())

app.use(express.static(path.join(__dirname, 'front')))

io.sockets.on('connection', (socket) => {
    socket.emit('updateRooms', rooms)
    socket.on('addUser', (username) => {
        if (totalUsers[username]) {
            socket.emit('updateChat', 'SERVER', 'esse nome já existe');
        }
        else {
            console.log(username+' entrou')
            if (username === null) {return}
            socket.username = username
            socket.room = 'Lobby'
            totalUsers[username] = username
            rooms['Lobby'][username] = username
            socket.join('Lobby')
            socket.emit('updateChat', 'SERVER', 'you have connected to Lobby');
            socket.broadcast.to('Lobby').emit('updateChat', 'SERVER', username + ' has connected to this room');
            socket.emit('updateUsers', rooms['Lobby'])
            socket.broadcast.to('Lobby').emit('updateUsers', rooms['Lobby'])
            socket.emit('updateRooms', rooms)
            console.log(Object.keys(totalUsers).length)
        }
    })

    socket.on('createRoom', function(room) {
        if (rooms[room]) {
            socket.emit('updateChat', 'SERVER', 'essa sala já existe');
        }
        else {
            rooms[room] = {}
            socket.emit('updateRooms', rooms, socket.room);
        }
    });
    
    socket.on('switchRoom', function(newroom) {
        if (socket.room) {
            var oldroom;
            oldroom = socket.room;
            socket.leave(socket.room);
            socket.join(newroom);
            delete rooms[oldroom][socket.username]
            socket.emit('updateChat', 'SERVER', 'you have connected to ' + newroom);
            socket.broadcast.to(oldroom).emit('updateUsers', rooms[oldroom])
            socket.broadcast.to(oldroom).emit('updateChat', 'SERVER', socket.username + ' has left this room');
            socket.room = newroom;
            socket.broadcast.to(newroom).emit('updateChat', 'SERVER', socket.username + ' has joined this room');
            rooms[newroom][socket.username] = socket.username
            socket.emit('updateUsers', rooms[newroom])
            socket.broadcast.to(newroom).emit('updateUsers', rooms[newroom])
            socket.emit('updateRooms', rooms, newroom)
        }
    });
    socket.on('message', (msg)=>{
        socket.emit('updateChat', socket.username, msg)
        socket.broadcast.to(socket.room).emit('updateChat', socket.username, msg)
    })
    socket.on('disconnect', function() {
        if (socket.room) {
            delete totalUsers[socket.username]
            delete rooms[socket.room][socket.username]
            // io.sockets.emit('updateUsers', users, true);
            socket.broadcast.to(socket.room).emit('updateUsers', socket.username, true)
            socket.broadcast.emit('updateChat', 'SERVER', socket.username + ' has disconnected');
            socket.leave(socket.room);
            console.log('saiu')
            console.log(Object.keys(totalUsers).length)
        }
        else {
            return
        }
    });

})

server.listen(process.env.PORT || 3000)