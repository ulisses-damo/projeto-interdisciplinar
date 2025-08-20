const marioImg = new Image();
marioImg.src = '../assets/mario.png';

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 50;
        this.velocityX = 0;
        this.velocityY = 0;
        this.isJumping = false;
        this.facingLeft = false; 
    }

    update() {
        this.x += this.velocityX;

        if (this.x < 0) this.x = 0;
        if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;

        this.y += this.velocityY;

        if (this.velocityY > 10) this.velocityY = 10;
    }

    jump() {
        if (!this.isJumping) {
            this.velocityY = -15;
            this.isJumping = true;
        }
    }

    render(ctx) {
        ctx.save();
        if (this.facingLeft) {
            ctx.translate(this.x + this.width, this.y);
            ctx.scale(-1, 1);
            ctx.drawImage(marioImg, 0, 0, this.width, this.height);
        } else {
            ctx.drawImage(marioImg, this.x, this.y, this.width, this.height);
        }
        ctx.restore();
    }
}