
//Aliases
// let Application = PIXI.Application,
//     Container = PIXI.Container,
//     loader = PIXI.Loader.shared,
//     resources = PIXI.Loader.shared.resources,
//     TextureCache = PIXI.utils.TextureCache,
//     Sprite = PIXI.Sprite,
//     Rectangle = PIXI.Rectangle;

// function criarBaralho() {
//     var baralhoTotal = []
//     var cores = ["r","g","y","b"]
//     var coringas = ["+4","cc"]
//     var especiais = ["+2", "jp","in"]
//     for (var i = 0; i < cores.length; i++) {
//         baralhoTotal.push(cores[i]+"0")
//         for (var j = 1; j < 10; j++) {
//             baralhoTotal.push(cores[i]+j.toString()) 
//             baralhoTotal.push(cores[i]+j.toString())
//         }
//         for (var j = 0; j < especiais.length; j++) {
//             baralhoTotal.push(cores[i]+especiais[j])
//             baralhoTotal.push(cores[i]+especiais[j])
//         }
//     }
//     for (var j = 0; j < 4; j++) {
//         baralhoTotal.push(coringas[0])
//         baralhoTotal.push(coringas[1])
//     }
//     return baralhoTotal
// }

// //Create a Pixi Application
// let app = new Application({ 
//     width: 256, 
//     height: 256,                       
//     type: 0,
//     antialias: true, 
//     transparent: false, 
//     resolution: 1,
//     view: document.getElementById('view'),
//   }
// );
// console.log(app )
// //Add the canvas that Pixi automatically created for you to the HTML document
// // document.body.appendChild(app.view);
// loader
//   .add("/sprites/cubo.png")
//   .add("/sprites/obra.png")
//   .load(setup);

// //Define any variables that are used in more than one function
// let cat;
// let obstac;
// var over;

// function setup() {

//   //Create the `cat` sprite 
//   cat = new Sprite(resources["/sprites/obra.png"].texture);
//   cat.y = 0;
//   cat.vx = 0;
//   cat.scale.set(0.7 , 1.2 );
//   app.stage.addChild(cat);

//   app.ticker.add(delta => gameLoop(delta));
// }

// function gameLoop(delta){

// }

// function hitTestRectangle(r1, r2) {

//   //Define the variables we'll need to calculate
//   let hit, combinedHalfWidths, combinedHalfHeights, vx, vy;

//   //hit will determine whether there's a collision
//   hit = false;

//   //Find the center points of each sprite
//   r1.centerX = r1.x + r1.width / 2;
//   r1.centerY = r1.y + r1.height / 2;
//   r2.centerX = r2.x + r2.width / 2;
//   r2.centerY = r2.y + r2.height / 2;

//   //Find the half-widths and half-heights of each sprite
//   r1.halfWidth = r1.width / 2;
//   r1.halfHeight = r1.height / 2;
//   r2.halfWidth = r2.width / 2;
//   r2.halfHeight = r2.height / 2;

//   //Calculate the distance vector between the sprites
//   vx = r1.centerX - r2.centerX;
//   vy = r1.centerY - r2.centerY;

//   //Figure out the combined half-widths and half-heights
//   combinedHalfWidths = r1.halfWidth + r2.halfWidth;
//   combinedHalfHeights = r1.halfHeight + r2.halfHeight;

//   //Check for a collision on the x axis
//   if (Math.abs(vx) < combinedHalfWidths) {

//     //A collision might be occurring. Check for a collision on the y axis
//     if (Math.abs(vy) < combinedHalfHeights) {

//       //There's definitely a collision happening
//       hit = true;
//     } else {

//       //There's no collision on the y axis
//       hit = false;
//     }
//   } else {

//     //There's no collision on the x axis
//     hit = false;
//   }

//   //`hit` will be either `true` or `false`
//   return hit;
// };

// function keyboard(value) {
//   let key = {};
//   key.value = value.toLowerCase();
//   key.isDown = false;
//   key.isUp = true;
//   key.press = undefined;
//   key.release = undefined;
//   //The `downHandler`
//   key.downHandler = event => {
//     if (event.key === key.value) {
//       if (key.isUp && key.press) key.press();
//       key.isDown = true;
//       key.isUp = false;
//       event.preventDefault();
//     }
//   };

//   //The `upHandler`
//   key.upHandler = event => {
//     if (event.key === key.value) {
//       if (key.isDown && key.release) key.release();
//       key.isDown = false;
//       key.isUp = true;
//       event.preventDefault();
//     }
//   };

//   //Attach event listeners
//   const downListener = key.downHandler.bind(key);
//   const upListener = key.upHandler.bind(key);
  
//   window.addEventListener(
//     "keydown", downListener, false
//   );
//   window.addEventListener(
//     "keyup", upListener, false
//   );
  
//   // Detach event listeners
//   key.unsubscribe = () => {
//     window.removeEventListener("keydown", downListener);
//     window.removeEventListener("keyup", upListener);
//   };
  
//   return key;
// }

// function onClick(){
//     //obstac.y += 20
//     // console.log("click")
// }


// aqui comeca a loucura

setTimeout(()=>{
    var ctx = document.getElementById('view').getContext('2d')
    var img = image = document.getElementById('source');
    ctx.drawImage(img, 0, 0, 276, 256)
},100)

var socket = io.connect(location.href);
var usersOn = {}
var roomsOn = []
var connected = false

var myName
var myData = {}

var myTurn = false

socket.on('connect', function(){
    // socket.emit('adduser', prompt("What's your name: "));
    // console.log('entrei')
});

socket.on('updateUsers', (UserList) => {
    usersOn = UserList
    // console.log("Server")
})

socket.on('updateChat',(username, data) =>{
    var chat = document.getElementById('messages')
    
    chat.innerHTML +="<li>"+"["+username+"]"+": "+data+"<li>"
})

socket.on('updateRooms', (rooms) =>{
    var salas = document.getElementById('rooms')
    roomsOn = rooms
    salas.innerHTML = ''
    for ( sala in roomsOn ) {
        salas.innerHTML += '<li>'+roomsOn[sala]+"<button style=\"\" onclick=\"connect(myName.toString(),\'"+roomsOn[sala]+"\')\">Entrar</button>"+'</li>'
    }
})

socket.on('myTurn', ()=>{
    console.log('sou eu!')
    myTurn = true
})

socket.on('disconnect', () => {
    connected = false
})

socket.on('Start', (data)=>{
    console.log(data)
    myData = data
    // socket.emit("requestData")    
})

socket.on('updateBuy', (number, username) =>{
    if (username != myName) {
        myData["Maos"][username] = number
        console.log(myData)
    }
})

socket.on('NewCards', (novaMao) =>{
    myData["minhaMao"] = novaMao
    console.log(myData)
})

function createRoom(newRoom) {
    socket.emit('createRoom', newRoom)
}

function switchRoom(Room) {
    socket.emit('switchRoom', Room)
}

function connect(name, sala) {
    if (name) {
        connected = true
        socket.emit('addUser', name, sala)
    }
    else {
        console.log('insira um nome')
    }
}

function chat(msg) {
    if (connected) {
        socket.emit('message', msg)
    }
}

function test(ss) {
    if (connected) {
        socket.emit('test', ss)
    }
}

function ready() {
    if (connected) {
        socket.emit('ready')
    }
}

function useCard(id) {
    if (myTurn && myData["minhaMao"][id]) {
        var carta = myData["minhaMao"][id]
        myData["minhaMao"].splice(id, 1);
        myData["TopCard"] = carta
        socket.emit('useCard', carta)
    }
}

function buyCard() {
    socket.emit('buyCard', 1)
} 



document.getElementById('mytext').addEventListener('keyup', function(e){
    var key = e.code;
    if (key == "Enter" && this.value != "") {
        chat(this.value)
        this.value = ""
    }
});

document.getElementById('myname').addEventListener('keyup', function(){
    myName = this.value
});

document.getElementById('myroom').addEventListener('keyup', function(e){
    var key = e.code;
    if (key == "Enter") {
        createRoom(this.value)
        this.value = ""
    }
});