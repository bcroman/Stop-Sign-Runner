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

//World Gravity
var OnGround = false;

/*
* World Objects
*/
// Static
var ground = defineNewStatic(1.0, 0.5, 0.2, (WIDTH / 2), HEIGHT, (WIDTH / 2), 5, "ground");
var leftwall = defineNewStatic(1.0, 0.5, 0.2, 5, HEIGHT, 5, HEIGHT, "leftwall");
var rightwall = defineNewStatic(1.0, 0.5, 0.2, WIDTH - 5, HEIGHT, 5, HEIGHT, "rightwall");

// Dynamic
var Car = defineNewDynamicCircle(1.0, 0.2, 0.8, 700, 550, 30, "car");

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
    world.Step(
        1 / 60, // framerate
        10, // velocity iterations
        10 // position iterations
    );
    world.DrawDebugData();
    world.ClearForces();
    for (var i in destroylist) {
        world.DestroyBody(destroylist[i]);
    }
    destroylist.length = 0;
    window.requestAnimationFrame(update);
}
window.requestAnimationFrame(update);

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
        console.log("Player Jump");
        dojump();
    } else{
        console.log("Space: " + e.keyCode);
    }
});

// Key Up -> W, Up Arrow, Space
$(document).keyup(function (e) {
    if (e.keyCode == 87 || e.keyCode == 38 | e.keyCode == 32) {
        console.log("Player Fall");
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