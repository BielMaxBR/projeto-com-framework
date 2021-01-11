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
    socket.emit('updateRooms', Object.keys(rooms))

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
            socket.broadcast.emit('updateRooms', Object.keys(rooms));
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
            
            totalUsers[username] = socket
            rooms[room][username] = username

            if (Object.keys(configRooms[room]["Players"]).length < configRooms[room]["LimitPlayers"] && configRooms[room]["Playing"] == false) {
                configRooms[room]["Ready"][username] = false
                configRooms[room]["Players"][username] = username
                configRooms[room]["PlayerCards"][username] = []
            }
            if (Object.keys(configRooms[room]["Players"]).length >= configRooms[room]["LimitPlayers"] || configRooms[room]["Playing"] == true) {
                configRooms[room]["Spectators"][username] = username
                requestData(totalUsers[username])
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

    socket.on('useCard', (carta)=>{
        configRooms[socket.room]["PlayerCards"][socket.username] = arrayRemove(configRooms[socket.room]["PlayerCards"][socket.username], carta)
        configRooms[socket.room]["TopCard"] = carta
        for (player in configRooms[socket.room]["Players"]) {
            requestData(totalUsers[player])
        }
        NextTurn(socket.room, false)
    })

    socket.on('buyCard', (numCards)=>{
        buyCards(socket.room, socket, numCards)
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
            socket.broadcast.to(socket.room).emit('updateUsers', Object.keys(rooms[socket.room]))
            socket.broadcast.to(socket.room).emit('updateChat', 'SERVER', socket.username + ' saiu dessa sala');
            if (Object.keys(rooms[socket.room]).length == 0) {
                delete rooms[socket.room]
                delete configRooms[socket.room]
                socket.broadcast.emit('updateRooms', Object.keys(rooms));
            }
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
        for (player in configRooms[room]["Players"]) {
            requestData(totalUsers[player])
        }
        NextTurn(room, true)
        // socket.emit('Start')
        // socket.broadcast.to(room).emit('Start')
    }

    function requestData(soquete) {
        data = {}
        data["Maos"] = {}
        for (var player in configRooms[soquete.room]["PlayerCards"]) {
            if (player == soquete.username) {
                data["minhaMao"] = configRooms[soquete.room]["PlayerCards"][player]
            }
            else {
                data["Maos"][player] = configRooms[soquete.room]["PlayerCards"][player].length
            }
        }
        
        data["TopCard"] = configRooms[soquete.room]["TopCard"]

        if (configRooms[soquete.room]["Players"][soquete.username]) {
            data["type"] = "Player"
        }
        
        if (configRooms[soquete.room]["Spectators"][soquete.username]) {
            data["type"] = "Spectator"
        }
        soquete.emit("Start", data)
    }

    function NextTurn(room, isInit) {
        var turnplus = 0
        if (!isInit) {
            var turnjmp = 1
            if (configRooms[room]["TopCard"].indexOf("jp") != -1) {
                turnjmp = 2
            }
            else if (configRooms[room]["TopCard"].indexOf("+2") != -1) {
                turnplus = 2
            }
            
            else if (configRooms[room]["TopCard"].indexOf("+4") != -1) {
                turnplus = 4
            }
            configRooms[room]["Turn"] = (configRooms[room]["Turn"]+(configRooms[room]["Direction"])*turnjmp)
            if (configRooms[room]["Turn"]<0) {configRooms[room]["Turn"] = Object.keys(configRooms[room]["Players"]).length-1}
            if (configRooms[room]["Turn"]>= Object.keys(configRooms[room]["Players"]).length) {configRooms[room]["Turn"] = 0}

        }
        var player = totalUsers[Object.keys(configRooms[room]["Players"])[configRooms[room]["Turn"]]]
        console.log("turno de: ", Object.keys(configRooms[room]["Players"])[configRooms[room]["Turn"]])  
        player.emit('myTurn')
        buyCards(player, turnplus)
    }

    function buyCards(PlayerSocket, num) {
        var numCards = num
        var player = PlayerSocket
        var room = player.room
        var username = player.username
        if (!configRooms[room]["Playing"] || num == 0) {return}
        console.log(username," ",configRooms[room]["PlayerCards"][username])
        while (numCards > 0) {
            var carta = configRooms[room]["Baralho"][getRandomInt(0,configRooms[room]["Baralho"].length)]
            configRooms[room]["PlayerCards"][username].push(carta)
            configRooms[room]["Baralho"].splice(configRooms[room]["Baralho"].indexOf(carta), 1);
            numCards--
        }

        for (playerIndex in configRooms[room]["Players"]) {
            totalUsers[playerIndex].emit('updateBuy', configRooms[room]["PlayerCards"][username].length, username)
        }
        socket.emit('NewCards',configRooms[room]["PlayerCards"][username])
        console.log(configRooms[room]["PlayerCards"][username])
        
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

function arrayRemove(arr, value) { 

    return arr.filter(function(ele){ 
        return ele != value; 
    });
}
server.listen(process.env.PORT || 3003)