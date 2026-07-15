// ===== GERENCIADOR DO CHEFE =====
// Chefe fixo no topo da arena do nível 5: flutua, arremessa meteoros
// e recebe dano dos arremessos do jogador (BossItemManager)

const BossManager = {
    x: 400,
    baseY: 150,
    y: 150,
    width: 150,
    height: 130,

    hp: 8,
    maxHp: 8,
    phase: 1,

    hoverPhase: 0,
    attackTimer: 0,
    hitFlashTimer: 0,

    defeated: false,
    defeatAnimTimer: 0,
    DEFEAT_ANIM_DURATION: 90,

    meteors: [],

    // Fases de dificuldade — quanto menor o HP, mais agressivo o ataque
    PHASES: {
        1: { attackInterval: 110, meteorSpeed: 3.0, maxMeteors: 3 },
        2: { attackInterval: 80,  meteorSpeed: 3.8, maxMeteors: 4 },
        3: { attackInterval: 55,  meteorSpeed: 4.6, maxMeteors: 6 },
    },

    reset() {
        this.hp = this.maxHp;
        this.phase = 1;
        this.hoverPhase = 0;
        this.attackTimer = 0;
        this.hitFlashTimer = 0;
        this.defeated = false;
        this.defeatAnimTimer = 0;
        this.meteors = [];
        this._updateHUD();
    },

    _config() {
        return this.PHASES[this.phase];
    },

    _updatePhase() {
        const nextPhase = this.hp <= 2 ? 3 : (this.hp <= 5 ? 2 : 1);
        this.phase = nextPhase;
    },

    update(canvasWidth, canvasHeight) {
        this.hoverPhase += 0.035;
        this.y = this.baseY + Math.sin(this.hoverPhase) * 12;

        if (this.hitFlashTimer > 0) this.hitFlashTimer--;

        if (this.defeated) {
            this.defeatAnimTimer++;
            return;
        }

        const config = this._config();

        // --- Arremesso de meteoros ---
        this.attackTimer++;
        if (this.attackTimer >= config.attackInterval) {
            this.attackTimer = 0;
            if (this.meteors.length < config.maxMeteors) {
                this._spawnMeteor(config, canvasWidth);
            }
        }

        // --- Mover meteoros ---
        for (let i = this.meteors.length - 1; i >= 0; i--) {
            const meteor = this.meteors[i];
            meteor.y += meteor.speed;
            meteor.trail.push({ x: meteor.x, y: meteor.y - meteor.size });
            if (meteor.trail.length > 6) meteor.trail.shift();
            meteor.glowPhase += 0.12;

            if (meteor.y - meteor.size > canvasHeight + 40) {
                this.meteors.splice(i, 1);
            }
        }
    },

    _spawnMeteor(config, canvasWidth) {
        const margin = 40;
        const x = margin + Math.random() * (canvasWidth - margin * 2);

        this.meteors.push({
            x,
            y: this.y + this.height / 2,
            size: 10 + Math.random() * 5,
            speed: config.meteorSpeed + (Math.random() - 0.5) * 0.6,
            glowPhase: Math.random() * Math.PI * 2,
            trail: [],
        });
    },

    // ===== DANO AO JOGADOR =====
    checkCollision(player) {
        if (this.defeated) return false;

        for (const meteor of this.meteors) {
            const dx = meteor.x - (player.x + player.width / 2);
            const dy = meteor.y - (player.y + player.height / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 28 + meteor.size) {
                return true;
            }
        }
        return false;
    },

    // Remove meteoros que colidiram, pra dar feedback visual ao sobreviver (shield/vida extra)
    clearNearbyMeteors(player) {
        this.meteors = this.meteors.filter(meteor => {
            const dx = meteor.x - (player.x + player.width / 2);
            const dy = meteor.y - (player.y + player.height / 2);
            return Math.sqrt(dx * dx + dy * dy) >= 28 + meteor.size;
        });
    },

    // ===== DANO AO CHEFE =====
    takeDamage(amount = 1) {
        if (this.defeated) return;

        this.hp = Math.max(0, this.hp - amount);
        this.hitFlashTimer = 12;
        this._updatePhase();
        this._updateHUD();

        if (this.hp <= 0) {
            this.defeated = true;
            this.defeatAnimTimer = 0;
        }
    },

    isDefeated() {
        return this.defeated && this.defeatAnimTimer >= this.DEFEAT_ANIM_DURATION;
    },

    // ===== RENDER =====
    render(ctx) {
        this._renderMeteors(ctx);

        ctx.save();

        if (this.defeated) {
            const progress = Math.min(this.defeatAnimTimer / this.DEFEAT_ANIM_DURATION, 1);
            ctx.globalAlpha = 1 - progress;
            ctx.translate(this.x, this.y);
            ctx.scale(1 - progress * 0.6, 1 - progress * 0.6);
            ctx.translate(-this.x, -this.y);
        }

        this._renderBody(ctx);

        if (this.hitFlashTimer > 0) {
            ctx.globalAlpha = (this.hitFlashTimer / 12) * 0.6;
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, this.width * 0.45, this.height * 0.45, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    },

    _renderBody(ctx) {
        const cx = this.x;
        const cy = this.y;
        const w = this.width;
        const h = this.height;
        const tilt = Math.sin(this.hoverPhase * 0.6) * 0.05;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(tilt);

        // Aura roxa
        const auraGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.75);
        auraGrad.addColorStop(0, 'rgba(168, 85, 247, 0.35)');
        auraGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, w * 0.75, h * 0.75, 0, 0, Math.PI * 2);
        ctx.fill();

        // Corpo — asteroide irregular
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 14;
        ctx.shadowOffsetY = 6;

        const bodyGrad = ctx.createRadialGradient(-w * 0.15, -h * 0.2, 0, 0, 0, w * 0.55);
        bodyGrad.addColorStop(0, '#a855f7');
        bodyGrad.addColorStop(0.55, '#6b21a8');
        bodyGrad.addColorStop(1, '#1e0040');

        const points = [
            { x: -w * 0.3, y: -h * 0.5 },
            { x: w * 0.15, y: -h * 0.48 },
            { x: w * 0.42, y: -h * 0.15 },
            { x: w * 0.48, y: h * 0.2 },
            { x: w * 0.2, y: h * 0.5 },
            { x: -w * 0.2, y: h * 0.48 },
            { x: -w * 0.46, y: h * 0.18 },
            { x: -w * 0.42, y: -h * 0.18 },
        ];

        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
        ctx.closePath();
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(244, 114, 182, 0.55)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Rachaduras/crateras
        ctx.strokeStyle = 'rgba(30, 0, 64, 0.6)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-w * 0.1, -h * 0.3);
        ctx.lineTo(w * 0.05, -h * 0.05);
        ctx.lineTo(-w * 0.02, h * 0.2);
        ctx.stroke();

        // Olhos brilhantes
        const eyeGlow = 0.7 + Math.sin(this.hoverPhase * 3) * 0.3;
        ctx.globalAlpha = eyeGlow;
        ctx.fillStyle = '#F472B6';
        ctx.shadowColor = '#F472B6';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.ellipse(-w * 0.14, -h * 0.02, 10, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(w * 0.16, -h * 0.02, 10, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    },

    _renderMeteors(ctx) {
        ctx.save();
        for (const meteor of this.meteors) {
            for (let t = 0; t < meteor.trail.length; t++) {
                const tr = meteor.trail[t];
                const progress = t / meteor.trail.length;
                ctx.globalAlpha = progress * 0.35;
                ctx.fillStyle = '#a855f7';
                ctx.beginPath();
                ctx.arc(tr.x, tr.y, meteor.size * progress * 0.6, 0, Math.PI * 2);
                ctx.fill();
            }

            const glowSize = meteor.size * 2.2 + Math.sin(meteor.glowPhase) * 2;
            const grad = ctx.createRadialGradient(meteor.x, meteor.y, 0, meteor.x, meteor.y, glowSize);
            grad.addColorStop(0, 'rgba(168, 85, 247, 0.45)');
            grad.addColorStop(1, 'rgba(168, 85, 247, 0)');
            ctx.globalAlpha = 0.85;
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(meteor.x, meteor.y, glowSize, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = 1;
            const rockGrad = ctx.createRadialGradient(
                meteor.x - meteor.size * 0.3, meteor.y - meteor.size * 0.3, 0,
                meteor.x, meteor.y, meteor.size
            );
            rockGrad.addColorStop(0, '#e9d5ff');
            rockGrad.addColorStop(0.5, '#a855f7');
            rockGrad.addColorStop(1, '#4c1d75');
            ctx.fillStyle = rockGrad;
            ctx.beginPath();
            ctx.arc(meteor.x, meteor.y, meteor.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    },

    _updateHUD() {
        const fill = document.getElementById('bossHealthFill');
        if (fill) {
            const pct = Math.max(0, (this.hp / this.maxHp) * 100);
            fill.style.width = `${pct}%`;
        }
    },
};
