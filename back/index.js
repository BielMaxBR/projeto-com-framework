const socketIo = require('socket.io')
const express = require('express')
const http = require('http')
const app = express()
const server = http.createServer(app)
const io = socketIo(server)

var sala = ""

app.get('/', (req, res) => {
    console.log('entrou')
    res.send('oi <script> function</script>')
    entrar('ddd')
    console.log('ddd')
})

function entrar(valor) {
    sala = valor
    app.get('/'+sala, (req, res) => {
        console.log('goku')
        res.send('oi '+sala+' <script> function</script>')
    })

}

server.listen(process.env.PORT || 3000)