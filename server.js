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
var configRooms = {}
app.use(bodyParser.json())

app.use(express.static(path.join(__dirname, 'front')))
console.log('pronto!')
io.sockets.on('connection', (socket) => {
    socket.emit('updateRooms', rooms)

    socket.on('createRoom', function(room, numPlayers = 2) {
        if (rooms[room]) {
            socket.emit('updateChat', 'SERVER', 'essa sala já existe');
        }
        else {
            rooms[room] = {}
            configRooms[room] = {}
            configRooms[room]["numPlayers"] = numPlayers
            console.log(rooms[room])

            socket.emit('updateRooms', rooms, socket.room);
        }
    });

    socket.on('addUser', (username, room) => {
        if (totalUsers[username]) {
            socket.emit('updateChat', 'SERVER', 'esse nome já existe');
            return
        }
        else {
            console.log(username+' entrou')
            if (username === null) {return}
            if (rooms[room] == undefined) {socket.emit('updateChat', 'SERVER', 'essa sala não existe'); return}
            socket.username = username
            socket.room = room
            totalUsers[username] = username
            console.log(rooms[room])
            // rooms[room]["shinra"] = "shinra"
            socket.join(room)
            socket.emit('updateChat', 'SERVER', 'você se conectou em '+room);
            socket.broadcast.to(room).emit('updateChat', 'SERVER', username + ' se conectou na sala');
            socket.emit('updateUsers', rooms[room])
            socket.broadcast.to(room).emit('updateUsers', rooms[room])
            socket.emit('updateRooms', rooms)
            console.log(Object.keys(totalUsers).length)
        }
    })
    
    socket.on('switchRoom', function(newroom) {
        if (socket.room) {
            var oldroom;
            oldroom = socket.room;
            socket.leave(socket.room);
            socket.join(newroom);
            delete rooms[oldroom][socket.username]
            socket.emit('updateChat', 'SERVER', 'você se conectou em ' + newroom);
            socket.broadcast.to(oldroom).emit('updateUsers', rooms[oldroom])
            socket.broadcast.to(oldroom).emit('updateChat', 'SERVER', socket.username + ' saiu dessa sala');
            socket.room = newroom;
            socket.broadcast.to(newroom).emit('updateChat', 'SERVER', socket.username + ' se conectou na sala');
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

    socket.on('test', (rr)=>{socket.emit('test', rooms[rr])})

    socket.on('disconnect', function() {
        if (socket.room) {
            delete totalUsers[socket.username]
            delete rooms[socket.room][socket.username]
            // io.sockets.emit('updateUsers', users, true);
            socket.broadcast.to(socket.room).emit('updateUsers', socket.username, true)
            socket.broadcast.emit('updateChat', 'SERVER', socket.username + ' saiu dessa sala');
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