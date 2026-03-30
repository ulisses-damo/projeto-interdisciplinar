class Platform {
    constructor(x, y, width, height, color = '#0000ff', id = null, type = 'normal') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.id = id;
        
        // Sistema de plataformas que desmoronam
        this.type = type; // 'normal' ou 'crumbling'
        this.crumbleStarted = false;
        this.crumbleTimer = 0;
        this.crumbleMaxTime = 60; // ~1 segundo a 60fps para começar a cair
        this.isFalling = false;
        this.fallSpeed = 0;
        this.shakeAmount = 0;
        this.originalX = x;
        this.crumbleOpacity = 1;
    }

    startCrumble() {
        if (this.type !== 'crumbling' || this.crumbleStarted) return;
        this.crumbleStarted = true;
        this.crumbleTimer = 0;
        this.originalX = this.x;
    }

    updateCrumble() {
        if (!this.crumbleStarted || this.type !== 'crumbling') return;
        
        this.crumbleTimer++;
        
        if (!this.isFalling) {
            // Fase de tremor - a plataforma treme cada vez mais
            const progress = this.crumbleTimer / this.crumbleMaxTime;
            this.shakeAmount = progress * 4; // Tremor aumenta
            this.x = this.originalX + (Math.random() - 0.5) * this.shakeAmount * 2;
            
            // Piscar - ficar mais transparente
            this.crumbleOpacity = 1 - progress * 0.3;
            
            if (this.crumbleTimer >= this.crumbleMaxTime) {
                // Começar a cair!
                this.isFalling = true;
                this.fallSpeed = 1;
                this.x = this.originalX; // Restaurar posição X
            }
        } else {
            // Fase de queda
            this.fallSpeed += 0.5;
            this.y += this.fallSpeed;
            this.crumbleOpacity -= 0.02;
            if (this.crumbleOpacity < 0) this.crumbleOpacity = 0;
        }
    }

    resetCrumble() {
        this.crumbleStarted = false;
        this.crumbleTimer = 0;
        this.isFalling = false;
        this.fallSpeed = 0;
        this.shakeAmount = 0;
        this.crumbleOpacity = 1;
        this.originalX = this.x;
    }

    render(context) {
        const radius = 10;

        context.save();
        
        // Aplicar opacidade para plataformas desmoronando
        if (this.type === 'crumbling') {
            context.globalAlpha = this.crumbleOpacity;
        }

        // Sombra para profundidade
        context.shadowColor = 'rgba(0, 0, 0, 0.45)';
        context.shadowBlur = 8;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 3;

        // Corpo da plataforma
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

        // Borda
        context.shadowColor = 'transparent';
        context.shadowBlur = 0;
        context.shadowOffsetY = 0;
        context.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        context.lineWidth = 1.5;
        context.stroke();

        // Brilho no topo (efeito 3D)
        context.fillStyle = 'rgba(255, 255, 255, 0.15)';
        context.beginPath();
        context.moveTo(this.x + radius, this.y);
        context.lineTo(this.x + this.width - radius, this.y);
        context.quadraticCurveTo(this.x + this.width, this.y, this.x + this.width, this.y + radius);
        context.lineTo(this.x + this.width, this.y + this.height * 0.4);
        context.lineTo(this.x, this.y + this.height * 0.4);
        context.lineTo(this.x, this.y + radius);
        context.quadraticCurveTo(this.x, this.y, this.x + radius, this.y);
        context.closePath();
        context.fill();

        // Indicador visual para plataformas que desmoronam (rachaduras)
        if (this.type === 'crumbling') {
            context.strokeStyle = 'rgba(255, 100, 50, 0.6)';
            context.lineWidth = 1;
            
            // Rachaduras decorativas
            context.beginPath();
            context.moveTo(this.x + this.width * 0.2, this.y);
            context.lineTo(this.x + this.width * 0.35, this.y + this.height);
            context.stroke();
            
            context.beginPath();
            context.moveTo(this.x + this.width * 0.6, this.y);
            context.lineTo(this.x + this.width * 0.5, this.y + this.height * 0.6);
            context.lineTo(this.x + this.width * 0.7, this.y + this.height);
            context.stroke();
            
            context.beginPath();
            context.moveTo(this.x + this.width * 0.85, this.y + this.height * 0.2);
            context.lineTo(this.x + this.width * 0.75, this.y + this.height);
            context.stroke();
        }

        context.restore();
    }

    checkCollision(player) {
        return (
            player.x < this.x + this.width &&
            player.x + player.width > this.x &&
            player.y + player.height > this.y &&
            player.y < this.y + this.height
        );
    }
}
