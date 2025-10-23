class PlayerCharacter {
    constructor(x, y, r, objid = "player") {
        this.fixture = defineNewDynamicCircle(0.0, 0, 0, x, y, r, objid);
        this.GetBody = () => this.fixture.GetBody();
        this.GetBody().SetFixedRotation(true);

        this.onGround = false;
        this.jumpPressed = false;
        this.jumpStartTime = 0;

        this.jumpHeight = -9.4;
        this.maxHoldTime = 150;
        this.jumpBoost = -3;
    }

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

    releaseJump() {
        this.jumpPressed = false;
    }

    setOnGround(val) {
        this.onGround = !!val;
        if (this.onGround) this.jumpPressed = false;
    }

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