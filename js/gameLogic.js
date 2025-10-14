/*
* Box2DWeb Definitions
*/
var b2Vec2 = Box2D.Common.Math.b2Vec2;
var b2BodyDef = Box2D.Dynamics.b2BodyDef;
var b2Body = Box2D.Dynamics.b2Body;
var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
var b2Fixture = Box2D.Dynamics.b2Fixture;
var b2World = Box2D.Dynamics.b2World;
var b2MassData = Box2D.Collision.Shapes.b2MassData;
var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
var b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;

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
    new b2Vec2(0, 9.81),
    true
);

//World Variables
var OnGround = false;
var CarSpeed = -9; // Car Speed
var animationFrameId;
var score = 0;
var highscore = parseInt(localStorage.getItem('Highscore'), 10) || 0; // Get High Score from Local Storage or set to 0

/*
* World Objects
*/
// Static
var ground = defineNewStatic(1.0, 0.5, 0.2, (WIDTH / 2), HEIGHT, (WIDTH / 2), 5, "ground");
var leftwall = defineNewStatic(1.0, 0.5, 0.2, 5, HEIGHT, 5, HEIGHT, "leftwall");
var rightwall = defineNewStatic(1.0, 0.5, 0.2, WIDTH - 5, HEIGHT, 5, HEIGHT, "rightwall");

// Dynamic
var carSpawner = setInterval(function () {
    var Car = defineNewDynamicCircle(1.0, 0.2, 0.8, 750, 550, 30, "car");
    Car.GetBody().SetLinearVelocity(new b2Vec2(CarSpeed, 0));
    //console.log("Car Spawned");
}, 2300);

var Player = defineNewDynamicCircle(1.0, 0.2, 0, 100, 550, 15, "player");
Player.GetBody().SetFixedRotation(true);

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
    world.Step(1 / 60, 10, 10);
    world.DrawDebugData();
    world.ClearForces();

    for (var i in destroylist) {
        world.DestroyBody(destroylist[i]);
    }
    destroylist.length = 0;

    animationFrameId = window.requestAnimationFrame(update);
}
animationFrameId = window.requestAnimationFrame(update);

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
        OnGround = true;
    }

    // Car touches wall → delete car
    if ((a && a.id === "car" && b && b.id === "leftwall" ) ||
        (b && b.id === "car" && a && a.id === "leftwall" )) {

        // Add to score (5 points per car dodged) Display updated score
        score += 1;
        console.log("Score: " + score);
        document.getElementById("scoreDisplay").innerText = "Car Dodged: " + score;

        updateHighScore(); //Call High Score Update Function

        // Update High Score Displays
        document.getElementById("highscoreDisplay").innerText = "High Score: " + highscore;

        if (a && a.id === "car") destroylist.push(contact.GetFixtureA().GetBody());
        if (b && b.id === "car") destroylist.push(contact.GetFixtureB().GetBody());
    }

    // Hero touches car → Lose Game
    // Car touches wall → delete car
    if ((a && a.id === "car" && b && b.id === "player" ) ||
        (b && b.id === "car" && a && a.id === "player" )) {
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
        OnGround = false;
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
    if (e.keyCode == 87 || e.keyCode == 38 | e.keyCode == 32) {
        //console.log("Player Jump");
        dojump(); //Call Jump Function
    }
});

// Key Up -> W, Up Arrow, Space
$(document).keyup(function (e) {
    if (e.keyCode == 87 || e.keyCode == 38 | e.keyCode == 32) {
        //console.log("Player Fall");
    } 
});

/*
* Utility Functions & Objects
*/

// Jump Function
function dojump() {
    if (OnGround) {   // jump only if touching ground
        var body = Player.GetBody();

        // optional: clear vertical velocity so jump is consistent
        var v = body.GetLinearVelocity();
        v.y = 0;
        body.SetLinearVelocity(v);

        body.ApplyImpulse(new b2Vec2(0, -7), body.GetWorldCenter());
        
    }
    OnGround = false;  // player is now in air
}

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
    document.getElementById("finalScoreDisplay").textContent = "Cars Dodged: " + score;
    document.getElementById("finalHighscoreDisplay").innerText = "High Score: " + highscore;
    document.getElementById("scoreDisplay").textContent = "";

    document.getElementById("GameOverScreen").style.display = "flex";
    document.getElementById("b2dcan").style.display = "none";
    cancelAnimationFrame(animationFrameId);
}

// On Load DOM
window.addEventListener("DOMContentLoaded", function() {

    // Hide everything first
    document.getElementById("b2dcan").style.display = "none";
    document.getElementById("GameOverScreen").style.display = "none";
    document.getElementById("StartGameScreen").style.display = "flex";
    document.getElementById("highscoreDisplay").innerText = "High Score: " + highscore;

    //Button Functions
    document.getElementById("restartBtn").addEventListener("click", function() {
        startGame();
    });

    document.getElementById("startBtn").addEventListener("click", function() {
        startGame();
    });

    startScreen(); // Show start screen
});

// Reset Game Function
function startGame() {
    // Stop the animation loop
    cancelAnimationFrame(animationFrameId);

    //Distory All Bodies
    for (var body = world.GetBodyList(); body; body = body.GetNext()) {
        world.DestroyBody(body);
    }

    // Clear destruction list
    destroylist.length = 0;

    // Recreate Objects
    ground = defineNewStatic(1.0, 0.5, 0.2, (WIDTH / 2), HEIGHT, (WIDTH / 2), 5, "ground");
    leftwall = defineNewStatic(1.0, 0.5, 0.2, 5, HEIGHT, 5, HEIGHT, "leftwall");
    rightwall = defineNewStatic(1.0, 0.5, 0.2, WIDTH - 5, HEIGHT, 5, HEIGHT, "rightwall");

    Player = defineNewDynamicCircle(1.0, 0.2, 0, 100, 550, 15, "player");
    Player.GetBody().SetFixedRotation(true);

    // Restart the car spawner
    clearInterval(carSpawner);
    carSpawner = setInterval(function () {
        var Car = defineNewDynamicCircle(1.0, 0.2, 0.8, 750, 550, 30, "car");
        Car.GetBody().SetLinearVelocity(new b2Vec2(CarSpeed, 0));
    }, 2300);

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

//Update High Score Value Function
function updateHighScore() {
    if (score > highscore) {
        highscore = score;
        localStorage.setItem('Highscore', String(highscore)); // Update Local Storage
    }
}