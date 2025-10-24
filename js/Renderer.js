// Class: Renderer to handle drawing the game state
class Renderer {
    constructor(canvasId, images, world, options = {}) {
        // Setup canvas and context
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext("2d");
        this.images = images;
        this.world = world;

        // Configuration options
        this.WIDTH = options.width || 800;
        this.HEIGHT = options.height || 600;
        this.SCALE = options.scale || 30;
        this.showDebug = false;

        // Debug draw setup (Box2D)
        this.debugDraw = new b2DebugDraw();
        this.debugDraw.SetSprite(this.ctx);
        this.debugDraw.SetDrawScale(this.SCALE);
        this.debugDraw.SetFillAlpha(0.3);
        this.debugDraw.SetLineThickness(1.0);
        this.debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
        this.world.SetDebugDraw(this.debugDraw);
    }

    // Function: Toggle debug drawing
    setShowDebug(flag) {
        this.showDebug = !!flag;
    }

    // Function: Draw the current game state    
    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.WIDTH, this.HEIGHT);

        // Enable Debug mode
        if (this.showDebug) {
            this.world.DrawDebugData();
            return;
        }

        // Draw Background
        if (this.images.background && this.images.background.complete) {
            ctx.drawImage(this.images.background, 0, 0, this.WIDTH, this.HEIGHT);
        } else {
            // Default sky blue background
            ctx.fillStyle = "#87ceeb";
            ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);
        }

        // Draw all Box2D bodies with sprites
        for (let body = this.world.GetBodyList(); body; body = body.GetNext()) {
            const userData = body.GetUserData();
            if (!userData) continue;

            const pos = body.GetPosition();
            const angle = body.GetAngle();
            const x = pos.x * this.SCALE;
            const y = pos.y * this.SCALE;

            // Draw based on object ID
            switch (userData.id) {
                case "player":
                    this.drawImageCentered(this.images.player, x, y, 100, 100, angle);
                    break;
                case "car":
                    this.drawImageCentered(this.images.car, x, y, 150, 100, angle);
                    break;
            }
        }
    }

    // Function: Draw an image centered of the given position with rotation
    drawImageCentered(img, x, y, w, h, angle) {
        if (!img || !img.complete) return;
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
        ctx.restore();
    }
}