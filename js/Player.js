// Class: Create Player object and handle jump logic
class PlayerCharacter {
    // Constructor: Initialize player with position, radius, and object ID
    constructor(x, y, r, objid = "player") {
        this.fixture = defineNewDynamicCircle(0.0, 0, 0, x, y, r, objid);
        this.GetBody = () => this.fixture.GetBody();
        this.GetBody().SetFixedRotation(true);

        // Jump-related properties
        this.onGround = false;
        this.jumpPressed = false;
        this.jumpStartTime = 0;

        // Jump parameters
        this.jumpHeight = -9.4;
        this.maxHoldTime = 150;
        this.jumpBoost = -3;
    }

    // Function: Initiate a jump
    jump() {
        if (!this.onGround) return;
        const body = this.GetBody();
        const v = body.GetLinearVelocity();
        v.y = 0;
        body.SetLinearVelocity(v);
        body.SetLinearVelocity(new b2Vec2(v.x, this.jumpHeight));
        this.onGround = false;
        this.jumpPressed = true;
        this.jumpStartTime = Date.now();
    }

    // Function: Release the jump key
    releaseJump() {
        this.jumpPressed = false;
    }

    // Function: Set whether the player is on the ground
    setOnGround(val) {
        this.onGround = !!val;
        if (this.onGround) this.jumpPressed = false;
    }

    // Function: Update jump logic each frame
    jumpUpdate() {
        // hold-jump boost while key held
        if (this.jumpPressed && (Date.now() - this.jumpStartTime) < this.maxHoldTime) {
            const body = this.GetBody();
            const vel = body.GetLinearVelocity();
            if (vel.y < 0) body.ApplyForce(new b2Vec2(0, this.jumpBoost), body.GetWorldCenter());
        }

        // faster fall
        const vel = this.GetBody().GetLinearVelocity();
        if (vel.y > 0) {
            this.GetBody().ApplyForce(new b2Vec2(0, 40), this.GetBody().GetWorldCenter());
        }
    }
}