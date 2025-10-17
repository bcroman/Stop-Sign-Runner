/*
* Objects for Destruction
*/
var destroylist = []; // Empty List at start

/*
* Define Canvas and World
*/
var WIDTH = 800;
var HEIGHT = 600;
var SCALE = 30;
var world = new b2World(
    new b2Vec2(0, 10),
    true
);

// Graphics Setup
const canvas = document.getElementById("b2dcan");
const ctx = canvas.getContext("2d");
var showDebug = false; // Debug Draw Toggle

// Load images
const images = {
    player: new Image(),
    car: new Image(),
    ground: new Image(),
    background: new Image()
};

// Set image sources
images.player.src = "assets/Player.png";
images.car.src = "assets/Car.png";
images.ground.src = "assets/Ground.png";
images.background.src = "assets/Background.png";

//World Variables
var CarSpeed = -6; // Car Speed
var animationFrameId;
var score = 0;
var highscore = parseInt(localStorage.getItem('Highscore'), 10) || 0; // Get High Score from Local Storage or set to 0
var gameOverText = "";
var gameRunning = false;

// Differrcult Values
var difficultly = "easy";
var difficultySettings = {
    easy: { carSpeed: -6, spawnRate: 3000 },
    medium: { carSpeed: -8, spawnRate: 2600 },
    hard: { carSpeed: -10, spawnRate: 2000 },
    possible: { carSpeed: -12, spawnRate: 1400 },
    impossible: { carSpeed: -14, spawnRate: 1200 }
};

/*
* World Objects
*/
// Static
var ground = defineNewStatic(0.1, 0, 0, (WIDTH / 2), HEIGHT - 15, (WIDTH / 2), 5, "ground");
var leftwall = defineNewStatic(1.0, 0.5, 0.2, 5, HEIGHT, 5, HEIGHT, "leftwall");
var rightwall = defineNewStatic(1.0, 0.5, 0.2, WIDTH - 5, HEIGHT, 5, HEIGHT, "rightwall");

// Dynamic
var carSpawner = setInterval(function () {
    Car = defineNewDynamic(1.0, 0.2, 0.8, 750, 540, 75, 30, "car");
    Car.GetBody().SetLinearVelocity(new b2Vec2(CarSpeed, 0));
    //console.log("Car Spawned");
}, 3000);

var Player = new PlayerCharacter(150, 540, 15);

/*
* Debug Draw
*/
var debugDraw = new b2DebugDraw();
debugDraw.SetSprite(document.getElementById("b2dcan").getContext("2d")
);
debugDraw.SetDrawScale(SCALE);
debugDraw.SetFillAlpha(0.3);
debugDraw.SetLineThickness(1.0);
debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
world.SetDebugDraw(debugDraw);

/*
* Update World Loop
*/
function update() {
    // Only run the game loop if the game is active
    if (!gameRunning) return;

    world.Step(1 / 60, 10, 10);

    world.ClearForces();

    // DRAW SECTION
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    if (showDebug) {
        world.DrawDebugData();
    }
    else {

        // Draw background
        if (images.background.complete) {
            ctx.drawImage(images.background, 0, 0, WIDTH, HEIGHT);
        } else {
            ctx.fillStyle = "#87ceeb";
            ctx.fillRect(0, 0, WIDTH, HEIGHT);
        }

        // Draw all Box2D bodies with sprites
        for (let body = world.GetBodyList(); body; body = body.GetNext()) {
            const userData = body.GetUserData();
            if (!userData) continue;

            const pos = body.GetPosition();
            const angle = body.GetAngle();
            const x = pos.x * SCALE;
            const y = pos.y * SCALE;

            switch (userData.id) {
                case "player":
                    drawImageCentered(images.player, x, y, 100, 100, angle);
                    break;
                case "car":
                    drawImageCentered(images.car, x, y, 150, 100, angle);
                    break;
                case "ground":
                    ctx.drawImage(images.ground, 0, HEIGHT, WIDTH, 50);
                    break;
            }
        }
    }

    Player.jumpUpdate();

    for (var i in destroylist) {
        world.DestroyBody(destroylist[i]);
    }
    destroylist.length = 0;

    // Request next frame
    if (gameRunning) {
        animationFrameId = window.requestAnimationFrame(update);
    }

}
animationFrameId = window.requestAnimationFrame(update);

// Helper function for drawing centered images
function drawImageCentered(img, x, y, w, h, angle) {
    if (!img.complete) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
}

/*
* Listeners
*/
var listener = new Box2D.Dynamics.b2ContactListener;
listener.BeginContact = function (contact) {
    //console.log("Begin Contact:" + contact.GetFixtureA().GetBody().GetUserData());
    var a = contact.GetFixtureA().GetBody().GetUserData();
    var b = contact.GetFixtureB().GetBody().GetUserData();

    // Hero touches ground → allow jump
    if ((a && a.id === "player" && b && b.id === "ground") ||
        (b && b.id === "player" && a && a.id === "ground")) {
        Player.setOnGround(true);
    }

    // Car touches wall → delete car
    if ((a && a.id === "car" && b && b.id === "leftwall") ||
        (b && b.id === "car" && a && a.id === "leftwall")) {

        // Add to score (1 points per car dodged) Display updated score
        score += 1;
        console.log("Score: " + score);
        document.getElementById("scoreDisplay").innerText = "Car Dodged: " + score;

        // update difficulty based on score 
        updateDifficulty();

        updateHighScore(); //Call High Score Update Function

        // Update High Score Displays
        document.getElementById("highscoreDisplay").innerText = "High Score: " + highscore;

        if (a && a.id === "car") destroylist.push(contact.GetFixtureA().GetBody());
        if (b && b.id === "car") destroylist.push(contact.GetFixtureB().GetBody());
    }

    // Hero touches car → Lose Game
    // Car touches wall → delete car
    if ((a && a.id === "car" && b && b.id === "player") ||
        (b && b.id === "car" && a && a.id === "player")) {
        //console.log("Game Over!");
        overScreen()
    }

}
listener.EndContact = function (contact) {
    //console.log("End Contact:" + contact.GetFixtureA().GetBody().GetUserData());
    var a = contact.GetFixtureA().GetBody().GetUserData();
    var b = contact.GetFixtureB().GetBody().GetUserData();

    // Hero leaves ground → disallow jump
    if ((a && a.id === "player" && b && b.id === "ground") ||
        (b && b.id === "player" && a && a.id === "ground")) {
        Player.setOnGround(false);
    }
}
listener.PostSolve = function (contact, impulse) {
    var fixa = contact.GetFixtureA().GetBody().GetUserData().id;
    var fixb = contact.GetFixtureB().GetBody().GetUserData().id;
    //console.log(fixa + " hits " + fixb + " with imp: " + impulse.normalImpulses[0]);
}
listener.PreSolve = function (contact, oldManifold) {
}
this.world.SetContactListener(listener);

/*
Keyboard Controls
*/
// Key Down -> W, Up Arrow, Space
$(document).keydown(function (e) {
    if ((e.keyCode == 87 || e.keyCode == 38 || e.keyCode == 32) && Player.onGround) {
        Player.jump();
    }
    if (e.keyCode === 68) { // D key
        showDebug = !showDebug;
        console.log("Debug mode:", showDebug ? "ON" : "OFF");
    }
});

// Key Up -> W, Up Arrow, Space
$(document).keyup(function (e) {
    if (e.keyCode == 87 || e.keyCode == 38 || e.keyCode == 32) {
        Player.releaseJump();
    }
});

/*
* Utility Functions & Objects
*/

// Static Object
function defineNewStatic(density, friction, restitution, x, y, width, height, objid) {
    var fixDef = new b2FixtureDef;
    fixDef.density = density;
    fixDef.friction = friction;
    fixDef.restitution = restitution;
    var bodyDef = new b2BodyDef;
    bodyDef.type = b2Body.b2_staticBody;
    bodyDef.position.x = x / SCALE;
    bodyDef.position.y = y / SCALE;
    fixDef.shape = new b2PolygonShape;
    fixDef.shape.SetAsBox(width / SCALE, height / SCALE);
    var thisobj = world.CreateBody(bodyDef).CreateFixture(fixDef);
    thisobj.GetBody().SetUserData({ id: objid })
    return thisobj;
}

// Dynamic Box Object
function defineNewDynamic(density, friction, restitution, x, y, width, height, objid) {
    var fixDef = new b2FixtureDef;
    fixDef.density = density;
    fixDef.friction = friction;
    fixDef.restitution = restitution;
    var bodyDef = new b2BodyDef;
    bodyDef.type = b2Body.b2_dynamicBody;
    bodyDef.position.x = x / SCALE;
    bodyDef.position.y = y / SCALE;
    fixDef.shape = new b2PolygonShape;
    fixDef.shape.SetAsBox(width / SCALE, height / SCALE);
    var thisobj = world.CreateBody(bodyDef).CreateFixture(fixDef);
    thisobj.GetBody().SetUserData({ id: objid })
    return thisobj;
}

// Dynamic Circle Object
function defineNewDynamicCircle(density, friction, restitution, x, y, r, objid) {
    var fixDef = new b2FixtureDef;
    fixDef.density = density;
    fixDef.friction = friction;
    fixDef.restitution = restitution;
    var bodyDef = new b2BodyDef;
    bodyDef.type = b2Body.b2_dynamicBody;
    bodyDef.position.x = x / SCALE;
    bodyDef.position.y = y / SCALE;
    fixDef.shape = new b2CircleShape(r / SCALE);
    var thisobj = world.CreateBody(bodyDef).CreateFixture(fixDef);
    thisobj.GetBody().SetUserData({ id: objid })
    return thisobj;
}

/*
Game Functions
*/
//Start Screen Function
function startScreen() {
    document.getElementById("scoreDisplay").textContent = "";
    document.getElementById("StartGameScreen").style.display = "flex";
    document.getElementById("b2dcan").style.display = "none";
    cancelAnimationFrame(animationFrameId);
}

//Game Over Screen Function
function overScreen() {
    // Stop Game Runninbg in Background
    gameRunning = false;
    cancelAnimationFrame(animationFrameId);
    clearInterval(carSpawner);

    document.getElementById("gameOverTxt").textContent = gameOverText;
    document.getElementById("finalScoreDisplay").textContent = "Cars Dodged: " + score;
    document.getElementById("finalHighscoreDisplay").innerText = "High Score: " + highscore;
    document.getElementById("scoreDisplay").textContent = "";

    document.getElementById("GameOverScreen").style.display = "flex";
    document.getElementById("b2dcan").style.display = "none";
}

// On Load DOM
window.addEventListener("DOMContentLoaded", function () {

    // Hide everything first
    document.getElementById("b2dcan").style.display = "none";
    document.getElementById("GameOverScreen").style.display = "none";
    document.getElementById("StartGameScreen").style.display = "flex";
    document.getElementById("highscoreDisplay").innerText = "High Score: " + highscore;

    //Button Functions
    document.getElementById("restartBtn").addEventListener("click", function () {
        startGame();
    });

    document.getElementById("startBtn").addEventListener("click", function () {
        startGame();
    });

    startScreen(); // Show start screen
});

// Reset Game Function
function startGame() {
    // Stop the animation loop
    cancelAnimationFrame(animationFrameId);

    gameRunning = true; // Set game as running

    //Distory All Bodies
    for (var body = world.GetBodyList(); body; body = body.GetNext()) {
        world.DestroyBody(body);
    }

    // Clear destruction list
    destroylist.length = 0;

    // Recreate Objects
    ground = defineNewStatic(0.1, 0, 0, (WIDTH / 2), HEIGHT - 15, (WIDTH / 2), 5, "ground");
    leftwall = defineNewStatic(1.0, 0.5, 0.2, 5, HEIGHT, 5, HEIGHT, "leftwall");
    rightwall = defineNewStatic(1.0, 0.5, 0.2, WIDTH - 5, HEIGHT, 5, HEIGHT, "rightwall");

    Player = new PlayerCharacter(150, 540, 15);

    // Restart the car spawner
    clearInterval(carSpawner);
    carSpawner = setInterval(function () {
        Car = defineNewDynamic(1.0, 0.2, 0.8, 750, 540, 75, 30, "car");
        Car.GetBody().SetLinearVelocity(new b2Vec2(CarSpeed, 0));
    }, 2300);

    //Scores
    score = 0;

    // Reset Difficulty
    difficulty = "easy";
    applyDifficultySettings();

    // Hide Game Over, show canvas
    document.getElementById("StartGameScreen").style.display = "none";
    document.getElementById("GameOverScreen").style.display = "none";
    document.getElementById("b2dcan").style.display = "block";

    // Reset Score Display
    document.getElementById("scoreDisplay").textContent = "Cars Dodged: 0";
    document.getElementById("finalScoreDisplay").textContent = "";

    update(); // Restart game loop
}

//Update High Score Value Function
function updateHighScore() {
    // Check if current score is greater than highscore
    if (score > highscore) {
        highscore = score;  // Update High Score Variable
        gameOverText = "New High Score!"; // PR Score Message
        localStorage.setItem('Highscore', String(highscore)); // Update Local Storage
    } else {
        gameOverText = "Try Again to Beat the High Score!"; // Reset Game Over Text
    }
}

// Change Differicutly Function
function updateDifficulty() {
    let newDifficulty = difficulty;

    if (score >= 100) {
        newDifficulty = "impossible";
    } else if (score >= 75) {
        newDifficulty = "possible";
    } else if (score >= 50) {
        newDifficulty = "hard";
    } else if (score >= 25) {
        newDifficulty = "medium";
    } else {
        newDifficulty = "easy";
    }

    // Only change if the difficulty tier is different
    if (newDifficulty !== difficulty) {
        difficulty = newDifficulty;
        applyDifficultySettings();
    }
}

//Update Game Changes
function applyDifficultySettings() {
    // Update global speed
    CarSpeed = difficultySettings[difficulty].carSpeed;

    // Reset car spawn interval
    clearInterval(carSpawner);
    carSpawner = setInterval(function () {
        Car = defineNewDynamic(1.0, 0.2, 0.8, 750, 540, 75, 30, "car");
        Car.GetBody().SetLinearVelocity(new b2Vec2(CarSpeed, 0));
    }, difficultySettings[difficulty].spawnRate);

    console.log("Difficulty changed to:", difficulty);
    document.getElementById("difficultyDisplay").textContent =
        "Difficulty: " + difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}