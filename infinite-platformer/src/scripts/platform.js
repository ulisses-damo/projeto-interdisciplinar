class Platform {
    constructor(x, y, width, height, color = '#0000ff', id = null) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.id = id;
    }

    render(context) {
        const radius = 10; 
        context.fillStyle = this.color;

        context.beginPath();
        context.moveTo(this.x + radius, this.y);
        context.lineTo(this.x + this.width - radius, this.y);
        context.quadraticCurveTo(this.x + this.width, this.y, this.x + this.width, this.y + radius);
        context.lineTo(this.x + this.width, this.y + this.height - radius);
        context.quadraticCurveTo(this.x + this.width, this.y + this.height, this.x + this.width - radius, this.y + this.height);
        context.lineTo(this.x + radius, this.y + this.height);
        context.quadraticCurveTo(this.x, this.y + this.height, this.x, this.y + this.height - radius);
        context.lineTo(this.x, this.y + radius);
        context.quadraticCurveTo(this.x, this.y, this.x + radius, this.y);
        context.closePath();
        context.fill();
    }

    checkCollision(player) {
        return (
            player.x < this.x + this.width &&
            player.x + player.width > this.x &&
            player.y < this.y + this.height &&
            player.y + player.height > this.y
        );
    }
}