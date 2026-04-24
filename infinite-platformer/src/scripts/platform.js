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

    isTriangle() {
        return this.type === 'triangle-left' || this.type === 'triangle-right';
    }

    isSlippery() {
        return this.isTriangle();
    }

    getSlideVelocity() {
        if (!this.isTriangle()) return 0;
        return this.type === 'triangle-left' ? 1.35 : -1.35;
    }

    getSurfaceYAt(worldX) {
        if (!this.isTriangle()) return this.y;

        const localX = clamp(worldX - this.x, 0, this.width);
        const progress = localX / this.width;

        if (this.type === 'triangle-left') {
            return this.y + progress * this.height;
        }

        return this.y + (1 - progress) * this.height;
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
        context.save();

        // Plataformas que desmoronam → visual de NUVEM
        if (this.type === 'crumbling') {
            context.globalAlpha = this.crumbleOpacity;
            this._renderCloud(context);
            context.restore();
            return;
        }

        if (this.isTriangle()) {
            this._renderTriangle(context);
            context.restore();
            return;
        }

        // === Plataforma normal ===
        const radius = 10;

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

        context.restore();
    }

    // Renderiza plataforma como NUVEM fofa
    _renderCloud(context) {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const w = this.width;
        const h = this.height;

        // Sombra suave da nuvem
        context.shadowColor = 'rgba(0, 0, 0, 0.15)';
        context.shadowBlur = 10;
        context.shadowOffsetY = 4;

        // Cor da nuvem (branca/azulada, escurece ao desmoronar)
        const progress = this.crumbleStarted ? Math.min(this.crumbleTimer / this.crumbleMaxTime, 1) : 0;
        const r = Math.round(235 + progress * 20);  // fica mais cinza
        const g = Math.round(240 - progress * 60);
        const b = Math.round(255 - progress * 80);
        const cloudColor = `rgb(${r}, ${g}, ${b})`;

        // Bolhas da nuvem — círculos sobrepostos
        const puffs = [
            { rx: -w * 0.32, ry: h * 0.05, rw: w * 0.22, rh: h * 0.7 },
            { rx: -w * 0.15, ry: -h * 0.25, rw: w * 0.26, rh: h * 0.85 },
            { rx: w * 0.02,  ry: -h * 0.35, rw: w * 0.28, rh: h * 0.9 },
            { rx: w * 0.18,  ry: -h * 0.2, rw: w * 0.24, rh: h * 0.8 },
            { rx: w * 0.33,  ry: h * 0.05, rw: w * 0.2,  rh: h * 0.65 },
        ];

        // Base plana da nuvem (elipse achatada)
        context.fillStyle = cloudColor;
        context.beginPath();
        context.ellipse(cx, cy + h * 0.15, w * 0.48, h * 0.45, 0, 0, Math.PI * 2);
        context.fill();

        // Desenhar cada "puff"
        for (const p of puffs) {
            context.fillStyle = cloudColor;
            context.beginPath();
            context.ellipse(cx + p.rx, cy + p.ry, p.rw, p.rh, 0, 0, Math.PI * 2);
            context.fill();
        }

        // Brilho no topo das puffs
        context.shadowColor = 'transparent';
        context.shadowBlur = 0;
        context.fillStyle = 'rgba(255, 255, 255, 0.45)';
        for (const p of puffs) {
            context.beginPath();
            context.ellipse(
                cx + p.rx, cy + p.ry - p.rh * 0.25,
                p.rw * 0.7, p.rh * 0.4,
                0, 0, Math.PI * 2
            );
            context.fill();
        }

        // Contorno sutil
        context.strokeStyle = 'rgba(180, 200, 230, 0.35)';
        context.lineWidth = 1;
        context.beginPath();
        context.ellipse(cx, cy + h * 0.15, w * 0.48, h * 0.45, 0, 0, Math.PI * 2);
        context.stroke();
    }

    _renderTriangle(context) {
        const points = this.type === 'triangle-left'
            ? [
                { x: this.x, y: this.y },
                { x: this.x + this.width, y: this.y + this.height },
                { x: this.x, y: this.y + this.height },
            ]
            : [
                { x: this.x + this.width, y: this.y },
                { x: this.x + this.width, y: this.y + this.height },
                { x: this.x, y: this.y + this.height },
            ];

        context.shadowColor = 'rgba(0, 0, 0, 0.38)';
        context.shadowBlur = 10;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 4;

        const gradient = context.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
        gradient.addColorStop(0.25, this.color);
        gradient.addColorStop(1, 'rgba(15, 23, 42, 0.88)');

        context.fillStyle = gradient;
        context.beginPath();
        context.moveTo(points[0].x, points[0].y);
        context.lineTo(points[1].x, points[1].y);
        context.lineTo(points[2].x, points[2].y);
        context.closePath();
        context.fill();

        context.shadowColor = 'transparent';
        context.shadowBlur = 0;
        context.shadowOffsetY = 0;
        context.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        context.lineWidth = 1.5;
        context.stroke();

        context.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        context.lineWidth = 3;
        context.beginPath();
        if (this.type === 'triangle-left') {
            context.moveTo(this.x + this.width * 0.18, this.y + this.height * 0.3);
            context.lineTo(this.x + this.width * 0.82, this.y + this.height * 0.85);
        } else {
            context.moveTo(this.x + this.width * 0.82, this.y + this.height * 0.3);
            context.lineTo(this.x + this.width * 0.18, this.y + this.height * 0.85);
        }
        context.stroke();

        context.fillStyle = 'rgba(255, 255, 255, 0.22)';
        context.beginPath();
        if (this.type === 'triangle-left') {
            context.moveTo(this.x, this.y);
            context.lineTo(this.x + this.width * 0.45, this.y + this.height * 0.45);
            context.lineTo(this.x, this.y + this.height * 0.45);
        } else {
            context.moveTo(this.x + this.width, this.y);
            context.lineTo(this.x + this.width, this.y + this.height * 0.45);
            context.lineTo(this.x + this.width * 0.55, this.y + this.height * 0.45);
        }
        context.closePath();
        context.fill();
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
