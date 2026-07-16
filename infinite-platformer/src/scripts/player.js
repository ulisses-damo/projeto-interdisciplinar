
const PLAYER_SPRITES = {
    base: createSprite('./assets/LULI.png'),
    jump: createSprite('./assets/pulando.png'),
    fall: createSprite('./assets/caindo.png'),
    death: createSprite('./assets/morrendo.png'),
};

const PLAYER_ANIMATIONS = {
    idle: {
        sprite: 'base',
        frames: [{ x: 0, y: 0 }],
        frameDelay: 0,
        loop: false,
    },
    run: {
        sprite: 'base',
        frames: [
            { x: 0, y: 0 },
            { x: 64, y: 0 },
            { x: 0, y: 64 },
        ],
        frameDelay: 10,
        loop: true,
    },
    jump: {
        sprite: 'jump',
        frames: [
            { x: 0, y: 0 },
            { x: 0, y: 64 },
        ],
        frameDelay: 12,
        loop: true,
    },
    fall: {
        sprite: 'fall',
        frames: [
            { x: 0, y: 0 },
            { x: 0, y: 64 },
        ],
        frameDelay: 12,
        loop: true,
    },
    death: {
        sprite: 'death',
        frames: [
            { x: 0, y: 0 },
            { x: 64, y: 0 },
            { x: 0, y: 64 },
            { x: 64, y: 64 },
            { x: 0, y: 128 },
        ],
        frameDelay: 14,
        loop: false,
        holdFrames: 18,
    },
};


class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 64;
        this.height = 64;
        this.velocityX = 0;
        this.velocityY = 0;
        this.isJumping = false;
        this.facingLeft = false;
        this.isDying = false;
        
        this.frameWidth = 64; 
        this.frameHeight = 64; 
        this.animationState = 'idle';
        this.currentFrame = 0;
        this.frameCounter = 0;
        this.animationComplete = false;
        this.animationHoldCounter = 0;
    }


    jump() {
        if (!this.isJumping) {
            this.velocityY = -10;
            this.isJumping = true;
        }
    }

    setAnimationState(nextState) {
        if (this.animationState === nextState) {
            return;
        }

        this.animationState = nextState;
        this.currentFrame = 0;
        this.frameCounter = 0;
        this.animationComplete = false;
        this.animationHoldCounter = 0;
    }

    updateAnimation() {
        if (this.isDying) {
            this._advanceAnimation();
            return;
        }

        if (this.isJumping) {
            this.setAnimationState(this.velocityY <= 0 ? 'jump' : 'fall');
            this._advanceAnimation();
            return;
        }

        if (Math.abs(this.velocityX) > 0.1) {
            this.setAnimationState('run');
            this._advanceAnimation();
            return;
        }

        this.setAnimationState('idle');
    }

    startDeathAnimation() {
        if (this.isDying) {
            return;
        }

        this.isDying = true;
        this.isJumping = false;
        this.velocityX = 0;
        this.velocityY = 0;
        this.setAnimationState('death');
    }

    isDeathAnimationComplete() {
        return this.isDying && this.animationComplete;
    }

    _advanceAnimation() {
        const animation = PLAYER_ANIMATIONS[this.animationState];
        if (!animation || animation.frames.length <= 1) {
            return;
        }

        const lastFrameIndex = animation.frames.length - 1;

        if (!animation.loop && this.currentFrame === lastFrameIndex) {
            if (this.animationHoldCounter < (animation.holdFrames || 0)) {
                this.animationHoldCounter++;
            } else {
                this.animationComplete = true;
            }
            return;
        }

        this.frameCounter++;
        if (this.frameCounter < animation.frameDelay) {
            return;
        }

        this.frameCounter = 0;

        if (animation.loop) {
            this.currentFrame = (this.currentFrame + 1) % animation.frames.length;
            return;
        }

        this.currentFrame = Math.min(this.currentFrame + 1, lastFrameIndex);
    }

    render(ctx) {
        const animation = PLAYER_ANIMATIONS[this.animationState] || PLAYER_ANIMATIONS.idle;
        let sprite = PLAYER_SPRITES[animation.sprite];
        let frame = animation.frames[this.currentFrame] || animation.frames[0];

        if (!sprite || !sprite.loaded) {
            sprite = PLAYER_SPRITES.base;
            frame = PLAYER_ANIMATIONS.idle.frames[0];
        }

        if (!sprite || !sprite.loaded) {
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            return;
        }
        
        ctx.save();
        if (this.facingLeft) {
            ctx.translate(this.x + this.width, this.y);
            ctx.scale(-1, 1);
            ctx.drawImage(
                sprite.image,
                frame.x, frame.y,
                this.frameWidth, this.frameHeight,
                0, 0,
                this.width, this.height
            );
        } else {
            ctx.drawImage(
                sprite.image,
                frame.x, frame.y,
                this.frameWidth, this.frameHeight,
                this.x, this.y,
                this.width, this.height
            );
        }
        ctx.restore();
    }
}