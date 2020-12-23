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

//Add the canvas that Pixi automatically created for you to the HTML document
document.body.appendChild(app.view);

loader
  .add("/sprites/cubo.png")
  .load(setup);

//Define any variables that are used in more than one function
let cat;
let obstac;

function setup() {

  //Create the `cat` sprite 
  cat = new Sprite(resources["/sprites/cubo.png"].texture);
  cat.y = 96; 
  cat.vx = 0;
  app.stage.addChild(cat);
  obstac = new Sprite(resources["/sprites/cubo.png"].texture);
  obstac.y = 96
  obstac.x = 60
  obstac.vx = 0
  app.stage.addChild(obstac)
     //Capture the keyboard arrow keys
    let left = keyboard("ArrowLeft"),
        up = keyboard("ArrowUp"),
        right = keyboard("d"),
        down = keyboard("ArrowDown");
  //Start the game loop 

    //Left arrow key `press` method
  right.press = () => {
    //Change the cat's velocity when the key is pressed
    cat.vx = 1;
    cat.vy = 0;
    console.log("dddddd")
  };

  right.release = () => {
      cat.vx = 0
  }

  app.ticker.add(delta => gameLoop(delta));
}

function gameLoop(delta){
    //cat.vx = 0
    //obstac.vx = 0
    cat.x += cat.vx;
    obstac.x += obstac.vx;
    if (cat.x > 256) {
        cat.x = -32
    }
    if (obstac.x > 256) {
        obstac.x = -32
    }
    if (hitTestRectangle(obstac, cat)) {
        console.log("tum")
        obstac.vx = cat.vx
    }
    else {
        obstac.vx = 0
    }
  //Optionally use the `delta` value
  //cat.x += 1 + delta;
}

function hitTestRectangle(r1, r2) {

  //Define the variables we'll need to calculate
  let hit, combinedHalfWidths, combinedHalfHeights, vx, vy;

  //hit will determine whether there's a collision
  hit = false;

  //Find the center points of each sprite
  r1.centerX = r1.x + r1.width / 2;
  r1.centerY = r1.y + r1.height / 2;
  r2.centerX = r2.x + r2.width / 2;
  r2.centerY = r2.y + r2.height / 2;

  //Find the half-widths and half-heights of each sprite
  r1.halfWidth = r1.width / 2;
  r1.halfHeight = r1.height / 2;
  r2.halfWidth = r2.width / 2;
  r2.halfHeight = r2.height / 2;

  //Calculate the distance vector between the sprites
  vx = r1.centerX - r2.centerX;
  vy = r1.centerY - r2.centerY;

  //Figure out the combined half-widths and half-heights
  combinedHalfWidths = r1.halfWidth + r2.halfWidth;
  combinedHalfHeights = r1.halfHeight + r2.halfHeight;

  //Check for a collision on the x axis
  if (Math.abs(vx) < combinedHalfWidths) {

    //A collision might be occurring. Check for a collision on the y axis
    if (Math.abs(vy) < combinedHalfHeights) {

      //There's definitely a collision happening
      hit = true;
    } else {

      //There's no collision on the y axis
      hit = false;
    }
  } else {

    //There's no collision on the x axis
    hit = false;
  }

  //`hit` will be either `true` or `false`
  return hit;
};

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