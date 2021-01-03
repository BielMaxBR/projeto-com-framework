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

app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, 'front')))

console.log('pronto!')


io.sockets.on('connection', (socket) => {
    socket.emit('updateRooms', rooms)

    socket.on('createRoom', function(room) {
        if (rooms[room]) {
            socket.emit('updateChat', 'SERVER', 'essa sala já existe');
        }
        else {
            rooms[room] = {}
            configRooms[room] = {}
            configRooms[room]["LimitPlayers"] = 4
            configRooms[room]["Turn"] = 0
            configRooms[room]["Direction"] = 1
            configRooms[room]["Players"] = {}
            configRooms[room]["Spectators"] = {}
            configRooms[room]["PlayerCards"] = {}
            configRooms[room]["Ready"] = {}
            configRooms[room]["TopCard"] = ""
            configRooms[room]["Baralho"] = []
            configRooms[room]["Playing"] = false
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

            if (Object.keys(configRooms[room]["Players"]).length < configRooms[room]["LimitPlayers"] && configRooms[room]["Playing"] == false) {
                configRooms[room]["Ready"][username] = false
                configRooms[room]["Players"][username] = username
                configRooms[room]["PlayerCards"][username] = []
            }
            if (Object.keys(configRooms[room]["Players"]).length >= configRooms[room]["LimitPlayers"] || configRooms[room]["Playing"] == true) {
                configRooms[room]["Spectators"][username] = username
                socket.emit('Start')
                console.log(username, "é um espectador")
            }

            socket.join(room)
            socket.emit('updateChat', 'SERVER', 'você se conectou em '+room);
            socket.broadcast.to(room).emit('updateChat', 'SERVER', username + ' se conectou na sala');         
            socket.emit('updateUsers', Object.keys(rooms[room]))
            socket.broadcast.to(room).emit('updateUsers', Object.keys(rooms[room]))
            socket.emit('updateRooms', Object.keys(rooms))
            console.log(configRooms[room])
            console.log(Object.keys(totalUsers).length)
        }
    })

    socket.on('ready', () => {
        configRooms[socket.room]['Ready'][socket.username] = true
        checkReady(socket.room)
    })
    
    socket.on('requestData', ()=>{
        data = {}
        data["Maos"] = {}
        for (var player in configRooms[socket.room]["PlayerCards"]) {
            if (player == socket.username) {
                data["minhaMao"] = configRooms[socket.room]["PlayerCards"][player]
            }
            else {
                data["Maos"][player] = configRooms[socket.room]["PlayerCards"][player].length
            }
        }
        
        data["TopCard"] = configRooms[socket.room]["TopCard"]

        if (configRooms[socket.room]["Players"][socket.username]) {
            data["type"] = "Player"
        }
        
        if (configRooms[socket.room]["Spectators"][socket.username]) {
            data["type"] = "Spectator"
        }
        socket.emit("responceData", data)
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
        console.log("<"+socket.room+">"+"["+socket.username+"]"+": "+msg)
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
                delete configRooms[socket.room]["Ready"][socket.username]
                if (configRooms[socket.room]["playing"]) {
                    configRooms[socket.room]["Turn"] += configRooms[socket.room]["Direction"]
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

    function checkReady(room) {
        var isReady = true
        if (Object.keys(configRooms[room]["Players"]).length > 1) {

            for(var player in configRooms[room]["Ready"]) {
                if (configRooms[room]["Ready"][player] == false) {
                    isReady = false
                }
                console.log("==================",isReady, player)
            }
            if(isReady) {
                newGame(room)
            }
        }
    }

    function newGame(room) {
        configRooms[room]["Baralho"] = criarBaralho()
        for(var player in configRooms[room]["PlayerCards"]) {
            configRooms[room]["PlayerCards"][player] = []
            for (var i = 0; i < 7; i++) {
                var carta = configRooms[room]["Baralho"][getRandomInt(0,configRooms[room]["Baralho"].length)]
                configRooms[room]["PlayerCards"][player].push(carta)
                configRooms[room]["Baralho"].splice(configRooms[room]["Baralho"].indexOf(carta), 1);
            }
        }
        var carta = configRooms[room]["Baralho"][getRandomInt(0,configRooms[room]["Baralho"].length)]
        while (carta == "+4" || carta == "cc") {carta = configRooms[room]["Baralho"][getRandomInt(0,configRooms[room]["Baralho"].length)]}
        configRooms[room]["TopCard"] = carta
        configRooms[room]["Playing"] = true
        configRooms[room]["Baralho"].splice(configRooms[room]["Baralho"].indexOf(carta), 1);

        console.log(configRooms[room]["TopCard"],"\n",configRooms[room]["PlayerCards"],"\n",Object.keys(configRooms[room]["Baralho"]).length)
        socket.emit('Start')
        socket.broadcast.to(room).emit('Start')
    }

})

function criarBaralho() {
    var baralhoTotal = []
    var cores = ["r","g","y","b"]
    // cc é pra escolher uma cor
    var coringas = ["+4","cc"]
    // jp é pra pular uma pessoa
    // in é pra inverter a sequência
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

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}


server.listen(process.env.PORT || 3000)