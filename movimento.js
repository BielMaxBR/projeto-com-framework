//Aliases
let Application = PIXI.Application,
    Container = PIXI.Container,
    loader = PIXI.loader,
    resources = PIXI.loader.resources,
    TextureCache = PIXI.utils.TextureCache,
    Sprite = PIXI.Sprite,
    Rectangle = PIXI.Rectangle;

//Create a Pixi Application
let app = new Application({ 
    width: 256, 
    height: 256,                       
    antialias: true, 
    transparent: false, 
    resolution: 1
  }
);
// frio na barriga
//Add the canvas that Pixi automatically created for you to the HTML document
document.body.appendChild(app.view);

loader
  .add("/sprites/cubo.png")
  .add("/sprites/fundinho-1.png")
  .load(setup);

var player;
var fundo;
function setup() {
    console.log("iniciado")
    fundo = PIXI.Texture.from("/sprites/fundinho-1.png")
    
    const tilingSprite = new PIXI.TilingSprite(
        fundo,
        10000,
        10000,
    );
    tilingSprite.x -= 5000-8
    tilingSprite.y -= 5000-8

    app.stage.addChild(tilingSprite);

    player = new Sprite(resources["/sprites/cubo.png"].texture)
    player.x = 0
    player.y = 0
    player.v = 4
    player.dx = 0
    player.dy = 0
    app.stage.addChild(player)
    let L = keyboard("a"),
        U = keyboard("w"),
        R = keyboard("d"),
        D = keyboard("s");

    L.press = () => {
        player.dx = -1
    }
    R.press = () => {
        player.dx = 1
    }
    U.press = () => {
        player.dy = -1
    }
    D.press = () => {
        player.dy = 1
    }
    
    L.release = () => {

        if (!R.isDown) {
            player.dx = 0
            
        }
    }
    R.release = () => {
        if (!L.isDown) {
            player.dx = 0
        }
    }
    U.release = () => {
        if (!D.isDown) {
            player.dy = 0
        }
    }
    D.release = () => {
        if (!U.isDown) {
            player.dy = 0
        }
    }

    app.ticker.add(delta => gameLoop(delta));
}

function gameLoop(delta) {
    player.x += player.v * player.dx
    player.y += player.v * player.dy
    app.stage.pivot.x = player.x+16;
    app.stage.pivot.y = player.y+16;
    app.stage.position.x = app.renderer.width/2;
    app.stage.position.y = app.renderer.height/2;
    // player.y += 400 * delta
}

function keyboard(value) {
  let key = {};
  key.value = value.toLowerCase();
  key.isDown = false;
  key.isUp = true;
  key.press = undefined;
  key.release = undefined;
  //The `downHandler`
  key.downHandler = event => {
    if (event.key === key.value) {
      if (key.isUp && key.press) key.press();
      key.isDown = true;
      key.isUp = false;
      event.preventDefault();
    }
  };

  //The `upHandler`
  key.upHandler = event => {
    if (event.key === key.value) {
      if (key.isDown && key.release) key.release();
      key.isDown = false;
      key.isUp = true;
      event.preventDefault();
    }
  };

  //Attach event listeners
  const downListener = key.downHandler.bind(key);
  const upListener = key.upHandler.bind(key);
  
  window.addEventListener(
    "keydown", downListener, false
  );
  window.addEventListener(
    "keyup", upListener, false
  );
  
  // Detach event listeners
  key.unsubscribe = () => {
    window.removeEventListener("keydown", downListener);
    window.removeEventListener("keyup", upListener);
  };
  
  return key;
}
