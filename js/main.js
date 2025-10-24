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
images.background.src = "assets/Background.png";

//World Variables
var animationFrameId;
var score = 0;
var highscore = parseInt(localStorage.getItem('Highscore'), 10) || 0; // Get High Score from Local Storage or set to 0
var gameOverText;
var gameRunning = false;

/*
* World Objects
*/
// Static
var ground = defineNewStatic(0.1, 0, 0, (WIDTH / 2), HEIGHT - 15, (WIDTH / 2), 5, "ground");
var leftwall = defineNewStatic(1.0, 0.5, 0.2, 5, HEIGHT, 5, HEIGHT, "leftwall");
var rightwall = defineNewStatic(1.0, 0.5, 0.2, WIDTH - 5, HEIGHT, 5, HEIGHT, "rightwall");

// Car Manager
var carManager = new CarManager();
carManager.startSpawner();

// Player Object
var Player = new PlayerCharacter(150, 540, 2);

// Renderer Object
var renderer = new Renderer("b2dcan", images, world, { width: WIDTH, height: HEIGHT, scale: SCALE });

/*
* Update World Loop
*/
function update() {
    // Only run the game loop if the game is active
    if (!gameRunning) return;

    world.Step(1 / 60, 10, 10);

    world.ClearForces();

    // DRAW SECTION
    renderer.setShowDebug(showDebug);
    renderer.draw();

    Player.jumpUpdate(); // Update Player Jump Frame

    // Destroy marked objects
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

/*
* Listeners
*/
var listener = new Box2D.Dynamics.b2ContactListener;
listener.BeginContact = function (contact) {
    // Get user data of the contacting bodies
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

        // Add to score (5 points per car dodged) Display updated score
        updateScore();

        carManager.updateDifficultyByScore(score);

        // Update High Score Displays
        document.getElementById("highscoreDisplay").innerText = "High Score: " + highscore;

        // Mark car for destruction
        if (a && a.id === "car") destroylist.push(contact.GetFixtureA().GetBody());
        if (b && b.id === "car") destroylist.push(contact.GetFixtureB().GetBody());
    }

    // Player touches car → game over
    if ((a && a.id === "car" && b && b.id === "player") ||
        (b && b.id === "car" && a && a.id === "player")) {
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
    carManager.stopSpawner();

    document.getElementById("gameOverTxt").textContent = gameOverText;
    document.getElementById("finalScoreDisplay").textContent = "Cars Dodged: " + score;
    document.getElementById("finalHighscoreDisplay").innerText = "High Score: " + highscore;
    document.getElementById("scoreDisplay").textContent = "";

    // Send High Score Value to Database
    fetch('./php/leaderboard/save_score.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: highscore })
    });

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
    // Restart Game Button
    document.getElementById("restartBtn").addEventListener("click", function () {
        startGame();
    });

    // Start Game Button
    document.getElementById("startBtn").addEventListener("click", function () {
        startGame();
    });

    // Load Leaderboard Page Button
    document.getElementById("leaderboardBtn").addEventListener("click", function () {
        // Stop the game and navigate to the leaderboard page
        cancelAnimationFrame(animationFrameId);
        gameRunning = false;
        carManager.stopSpawner();
        window.location.href = "./leaderboard.php";
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

    // Restart the car spawner via manager
    carManager.stopSpawner();
    carManager.setDifficulty("easy"); // reset difficulty defaults and restart spawner

    //Scores
    score = 0;

    // Hide Game Over, show canvas
    document.getElementById("StartGameScreen").style.display = "none";
    document.getElementById("GameOverScreen").style.display = "none";
    document.getElementById("b2dcan").style.display = "block";

    // Reset Score Display
    document.getElementById("scoreDisplay").textContent = "Cars Dodged: 0";
    document.getElementById("finalScoreDisplay").textContent = "";

    update(); // Restart game loop
}


//Function: Update Game Score & Display Values
function updateScore() {
    // Increase Score by 5 for each car dodged
    score = score + 5;
    console.log("Score: " + score);
    document.getElementById("scoreDisplay").innerText = "Car Dodged: " + score;

    // If Score greater than High Score, update High Score
    if (score > highscore) {
        highscore = score;
        gameOverText = "New High Score!";
        localStorage.setItem('Highscore', String(highscore)); // Update Local Storage
    } else {
        gameOverText = "Try Again to Beat the High Score!";
    }
}