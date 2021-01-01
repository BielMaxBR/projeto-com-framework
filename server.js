const bodyParser = require('body-parser'); 
const socketIo = require('socket.io')
const express = require('express')
const path = require('path')
const http = require('http')
const app = express()
const server = http.createServer(app)
const io = socketIo(server)

var rooms = {}
var totalUsers = {}
var configRooms = {}
const baralhoTotal = criarBaralho()
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, 'front')))

console.log('pronto!')

function criarBaralho() {
    var baralhoTotal = []
    var cores = ["r","g","y","b"]
    var coringas = ["+4","cc"]
    var especiais = ["+2", "jp","in"]
    for (var i = 0; i < cores.length; i++) {
        baralhoTotal.push(cores[i]+"0")
        for (var j = 1; j < 10; j++) {
            baralhoTotal.push(cores[i]+j.toString()) 
            baralhoTotal.push(cores[i]+j.toString())
        }
        for (var j = 0; j < especiais.length; j++) {
            baralhoTotal.push(cores[i]+especiais[j])
            baralhoTotal.push(cores[i]+especiais[j])
        }
    }
    for (var j = 0; j < 4; j++) {
        baralhoTotal.push(coringas[0])
        baralhoTotal.push(coringas[1])
    }
    return baralhoTotal
}

io.sockets.on('connection', (socket) => {
    socket.emit('updateRooms', rooms)

    socket.on('createRoom', function(room) {
        if (rooms[room]) {
            socket.emit('updateChat', 'SERVER', 'essa sala já existe');
        }
        else {
            rooms[room] = {}
            configRooms[room] = {}
            configRooms[room]["numPlayers"] = 4
            configRooms[room]["turn"] = 0
            configRooms[room]["direction"] = 1
            configRooms[room]["Players"] = {}
            configRooms[room]["Spectators"] = {}
            configRooms[room]["PlayerCards"] = {}
            configRooms[room]["ready"] = {}
            configRooms[room]["theCard"] = "tipo"
            socket.emit('updateRooms', Object.keys(rooms));
        }
    });

    socket.on('addUser', (username, room) => {
        if (totalUsers[username]) {
            socket.emit('updateChat', 'SERVER', 'esse nome já existe');
            return
        }
        else {

            if (username === null) {return}
            if (rooms[room] == undefined) {socket.emit('updateChat', 'SERVER', 'essa sala não existe'); return}

            console.log(username+' entrou')
            
            socket.room = room
            socket.username = username
            
            totalUsers[username] = username
            rooms[room][username] = username

            if (Object.keys(configRooms[room]["Players"]).length < configRooms[room]["numPlayers"]) {
                configRooms[room]["ready"][username] = false
                configRooms[room]["Players"][username] = username
            }
            else if (Object.keys(configRooms[room]["Players"]).length >= configRooms[room]["numPlayers"]) {
                configRooms[room]["Spectators"][username] = username
            }

            console.log(configRooms[room])
            socket.join(room)
            socket.emit('updateChat', 'SERVER', 'você se conectou em '+room);
            socket.broadcast.to(room).emit('updateChat', 'SERVER', username + ' se conectou na sala');         
            socket.emit('updateUsers', Object.keys(rooms[room]))
            socket.broadcast.to(room).emit('updateUsers', Object.keys(rooms[room]))       
            socket.emit('updateRooms', Object.keys(rooms))       
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
            socket.broadcast.to(oldroom).emit('updateUsers', Object.keys(rooms[oldroom]))
            socket.broadcast.to(oldroom).emit('updateChat', 'SERVER', socket.username + ' saiu dessa sala');
            socket.room = newroom;
            socket.broadcast.to(newroom).emit('updateChat', 'SERVER', socket.username + ' se conectou na sala');
            rooms[newroom][socket.username] = socket.username
            socket.emit('updateUsers', Object.keys(rooms[newroom]))
            socket.broadcast.to(newroom).emit('updateUsers', Object.keys(rooms[newroom]))
            socket.emit('updateRooms', Object.keys(rooms))
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
            if (configRooms[socket.room]["Spectators"][socket.username]) { delete configRooms[socket.room]["Spectators"][socket.username] }
            if (configRooms[socket.room]["Players"][socket.username]) {
                delete configRooms[socket.room]["Players"][socket.username]
                delete configRooms[socket.room]["ready"][socket.username]
                if (configRooms[socket.room]["playing"]) {
                    configRooms[socket.room]["turn"] += configRooms[socket.room]["direction"]
                }
            }
            if (Object.keys(rooms[socket.room]).length == 0) {
                delete rooms[socket.room]
                delete configRooms[socket.room]
            }
            socket.broadcast.to(socket.room).emit('updateUsers', Object.keys(rooms[socket.room]))
            socket.broadcast.to(socket.room).emit('updateChat', 'SERVER', socket.username + ' saiu dessa sala');
            socket.leave(socket.room);
            console.log(socket.username+' saiu')
            console.log(Object.keys(totalUsers).length)
        }
        else {
            return
        }
    });

})

server.listen(process.env.PORT || 3000)