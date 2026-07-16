// ===== GERENCIADOR DO CHEFE =====
// Chefe da arena do nível 5: flutua, se desloca horizontalmente,
// avisa (telegraph) e arremessa rajadas de meteoros, recebendo dano
// dos arremessos do jogador (BossItemManager)

const BOSS_SPRITES = {
    base: createSprite('./assets/chefe_meteoro.png'),
};

const BOSS_ANIMATIONS = {
    idle:   { sprite: 'base', frames: [{ x: 0, y: 0 }, { x: 96, y: 0 }], frameDelay: 22, loop: true },
    attack: { sprite: 'base', frames: [{ x: 0, y: 96 }, { x: 96, y: 96 }], frameDelay: 20, loop: false },
};

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

    // --- Movimento horizontal e máquina de estado de ataque ---
    horizontalPhase: 0,
    state: 'idle',              // 'idle' | 'telegraph'
    telegraphTimer: 0,
    pendingBurstPositions: [],  // x's decididos no início do telegraph (avisados ao jogador)
    burstSpawnQueue: [],        // fila de x's ainda não spawnados nesta rajada
    burstTimer: 0,
    facingLeft: false,
    _prevX: 400,
    _canvasWidth: 800,
    _canvasHeight: 600,

    // --- Animação do sprite ---
    animationState: 'idle',
    currentFrame: 0,
    frameCounter: 0,

    // Fases de dificuldade — quanto menor o HP, mais agressivo o ataque
    PHASES: {
        1: { attackInterval: 130, telegraphDuration: 40, meteorSpeed: 3.0, maxMeteors: 3, burstSize: 1, burstGap: 0,  moveRange: 60,  moveFreq: 0.012 },
        2: { attackInterval: 100, telegraphDuration: 34, meteorSpeed: 3.6, maxMeteors: 5, burstSize: 2, burstGap: 10, moveRange: 150, moveFreq: 0.018 },
        3: { attackInterval: 85,  telegraphDuration: 26, meteorSpeed: 4.3, maxMeteors: 7, burstSize: 3, burstGap: 8,  moveRange: 230, moveFreq: 0.024 },
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

        this.x = 400;
        this.horizontalPhase = 0;
        this.state = 'idle';
        this.telegraphTimer = 0;
        this.pendingBurstPositions = [];
        this.burstSpawnQueue = [];
        this.burstTimer = 0;
        this.facingLeft = false;
        this._prevX = 400;

        this.animationState = 'idle';
        this.currentFrame = 0;
        this.frameCounter = 0;

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
        this._canvasWidth = canvasWidth;
        this._canvasHeight = canvasHeight;

        this.hoverPhase += 0.035;
        this.y = this.baseY + Math.sin(this.hoverPhase) * 12;

        if (this.hitFlashTimer > 0) this.hitFlashTimer--;

        if (this.defeated) {
            this.defeatAnimTimer++;
            return;
        }

        const config = this._config();

        // --- Movimento horizontal (vai e volta em torno do centro) ---
        this._prevX = this.x;
        this.horizontalPhase += config.moveFreq;
        this.x = canvasWidth / 2 + Math.sin(this.horizontalPhase) * config.moveRange;
        this.facingLeft = this.x < this._prevX;

        // --- Máquina de estado de ataque: idle -> telegraph -> rajada ---
        if (this.state === 'idle') {
            this.attackTimer++;
            const triggerAt = config.attackInterval - config.telegraphDuration;
            if (this.attackTimer >= triggerAt && this.meteors.length < config.maxMeteors) {
                this.state = 'telegraph';
                this.telegraphTimer = 0;
                this.pendingBurstPositions = this._generateBurstPositions(config.burstSize, canvasWidth);
            }
        } else {
            this.telegraphTimer++;
            if (this.telegraphTimer >= config.telegraphDuration) {
                this.state = 'idle';
                this.attackTimer = 0;
                this.burstSpawnQueue = this.pendingBurstPositions;
                this.pendingBurstPositions = [];
                this.burstTimer = config.burstGap;
            }
        }

        // --- Consumir fila de rajada (com stagger entre cada meteoro) ---
        if (this.burstSpawnQueue.length > 0) {
            this.burstTimer++;
            if (this.burstTimer >= config.burstGap && this.meteors.length < config.maxMeteors) {
                this.burstTimer = 0;
                this._spawnMeteor(config, this.burstSpawnQueue.shift());
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

        this._updateAnimation();
    },

    // Divide o canvas em `count` faixas e sorteia cada meteoro nos 50% centrais
    // da própria faixa — evita clusters coladas na borda entre faixas vizinhas.
    _generateBurstPositions(count, canvasWidth) {
        const margin = 50;
        const usable = canvasWidth - margin * 2;
        const segment = usable / count;
        const positions = [];

        for (let i = 0; i < count; i++) {
            const segStart = margin + i * segment;
            positions.push(segStart + segment * 0.25 + Math.random() * segment * 0.5);
        }

        return positions;
    },

    _spawnMeteor(config, x) {
        const targetX = typeof x === 'number' ? x : (40 + Math.random() * (this._canvasWidth - 80));

        this.meteors.push({
            x: targetX,
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

    // ===== ANIMAÇÃO DO SPRITE =====
    _updateAnimation() {
        const targetState = this.state === 'telegraph' ? 'attack' : 'idle';
        if (this.animationState !== targetState) {
            this.animationState = targetState;
            this.currentFrame = 0;
            this.frameCounter = 0;
        }

        const anim = BOSS_ANIMATIONS[this.animationState];

        // Sincroniza a animação de ataque pra terminar junto com o telegraph da fase atual
        const frameDelay = this.animationState === 'attack'
            ? Math.max(4, Math.floor(this._config().telegraphDuration / anim.frames.length))
            : anim.frameDelay;

        if (!anim.loop && this.currentFrame === anim.frames.length - 1) return;

        this.frameCounter++;
        if (this.frameCounter < frameDelay) return;
        this.frameCounter = 0;

        this.currentFrame = anim.loop
            ? (this.currentFrame + 1) % anim.frames.length
            : Math.min(this.currentFrame + 1, anim.frames.length - 1);
    },

    // ===== RENDER =====
    render(ctx) {
        this._renderTelegraph(ctx);
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

    // Feixe translúcido avisando onde os meteoros da rajada vão cair
    _renderTelegraph(ctx) {
        if (this.state !== 'telegraph' || this.pendingBurstPositions.length === 0) return;

        const config = this._config();
        const alpha = Math.min(1, this.telegraphTimer / config.telegraphDuration) * 0.55;
        const canvasHeight = this._canvasHeight;

        ctx.save();
        for (const x of this.pendingBurstPositions) {
            const grad = ctx.createLinearGradient(x, 0, x, canvasHeight);
            grad.addColorStop(0, `rgba(244, 114, 182, ${alpha})`);
            grad.addColorStop(1, 'rgba(244, 114, 182, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(x - 14, 0, 28, canvasHeight);
        }
        ctx.restore();
    },

    // Sprite em pixel art (com fallback pro corpo vetorial se a imagem não carregou)
    _renderBody(ctx) {
        const sprite = BOSS_SPRITES.base;
        if (!sprite || !sprite.loaded) {
            this._renderBodyVector(ctx);
            return;
        }

        const cx = this.x;
        const cy = this.y;
        const w = this.width;
        const h = this.height;
        const tilt = Math.sin(this.hoverPhase * 0.6) * 0.05;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(tilt);
        if (this.facingLeft) ctx.scale(-1, 1);

        // Aura roxa (mantida como efeito de canvas por baixo do sprite)
        const auraGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.75);
        auraGrad.addColorStop(0, 'rgba(168, 85, 247, 0.35)');
        auraGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, w * 0.75, h * 0.75, 0, 0, Math.PI * 2);
        ctx.fill();

        const anim = BOSS_ANIMATIONS[this.animationState] || BOSS_ANIMATIONS.idle;
        const frame = anim.frames[this.currentFrame] || anim.frames[0];
        const frameSize = 96;

        ctx.drawImage(
            sprite.image,
            frame.x, frame.y, frameSize, frameSize,
            -w / 2, -h / 2, w, h
        );

        ctx.restore();
    },

    // Corpo vetorial original — usado como fallback enquanto o sprite carrega
    _renderBodyVector(ctx) {
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
