// ===== GERENCIADOR DE GOTAS DE LAVA =====
// Gotas de lava caem do céu em níveis normais e sobem do chão em níveis descendentes
// Causa game over ao atingir o jogador

const LavaManager = {
    drops: [],
    spawnTimer: 0,

    // Configuração por nível
    CONFIG: {
        3: { spawnInterval: 50, speed: 3.0, size: 10, maxDrops: 8 },
        4: { spawnInterval: 60, speed: 2.5, size: 11, maxDrops: 10},
        5: { spawnInterval: 50, speed: 3.5, size: 12, maxDrops: 18 },
    },

    reset() {
        this.drops = [];
        this.spawnTimer = 0;
    },

    // Retorna config do nível ou null se lava não está ativa
    _getConfig(level) {
        if (level < 3 || level === 4) return null;
        return this.CONFIG[Math.min(level, 5)];
    },

    _getDirection(level) {
        return LevelManager.isDescending(level) ? -1 : 1;
    },

    // Atualiza: spawna e move gotas
    update(level, canvasWidth, canvasHeight, cameraY) {
        const config = this._getConfig(level);
        if (!config) return;
        const direction = this._getDirection(level);

        // --- Spawn ---
        this.spawnTimer++;
        if (this.spawnTimer >= config.spawnInterval && this.drops.length < config.maxDrops) {
            this.spawnTimer = 0;
            this._spawnDrop(config, canvasWidth, canvasHeight, cameraY, direction);
        }

        // --- Mover gotas ---
        for (let i = this.drops.length - 1; i >= 0; i--) {
            const drop = this.drops[i];
            drop.y += drop.speed * drop.direction;
            drop.trail.push({ x: drop.x, y: drop.y - drop.size * drop.direction, alpha: 0.6 });
            if (drop.trail.length > 6) drop.trail.shift();

            // Animação de brilho
            drop.glowPhase += 0.1;

            // Remover se saiu para fora da tela na direção do movimento
            const screenY = drop.y - cameraY;
            if ((drop.direction > 0 && screenY > canvasHeight + 100) || (drop.direction < 0 && screenY < -100)) {
                this.drops.splice(i, 1);
            }
        }
    },

    _spawnDrop(config, canvasWidth, canvasHeight, cameraY, direction) {
        const margin = 30;
        const x = margin + Math.random() * (canvasWidth - margin * 2);

        const y = direction > 0
            ? cameraY - 20 - Math.random() * 60
            : cameraY + canvasHeight + 20 + Math.random() * 60;

        this.drops.push({
            x: x,
            y: y,
            speed: config.speed + (Math.random() - 0.5) * 0.8,
            size: config.size + Math.random() * 4,
            glowPhase: Math.random() * Math.PI * 2,
            direction,
            trail: [],
        });
    },

    // Verifica colisão de todas as gotas com o jogador
    checkCollision(player) {
        for (const drop of this.drops) {
            const dx = (drop.x) - (player.x + player.width / 2);
            const dy = (drop.y) - (player.y + player.height / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Raio do jogador ~28px (metade do sprite), raio da gota = drop.size
            if (dist < 28 + drop.size) {
                return true;
            }
        }
        return false;
    },

    // Renderiza todas as gotas
    render(ctx, canvasHeight, cameraY) {
        if (this.drops.length === 0) return;

        ctx.save();

        for (const drop of this.drops) {
            // --- Trail (rastro de fogo) ---
            for (let t = 0; t < drop.trail.length; t++) {
                const tr = drop.trail[t];
                const progress = t / drop.trail.length;
                const trailSize = drop.size * progress * 0.6;

                ctx.globalAlpha = progress * 0.3;
                ctx.fillStyle = '#FF4500';
                ctx.beginPath();
                ctx.arc(tr.x, tr.y, trailSize, 0, Math.PI * 2);
                ctx.fill();
            }

            // --- Brilho externo (glow) ---
            const glowSize = drop.size * 2.5 + Math.sin(drop.glowPhase) * 3;
            const gradient = ctx.createRadialGradient(
                drop.x, drop.y, 0,
                drop.x, drop.y, glowSize
            );
            gradient.addColorStop(0, 'rgba(255, 100, 0, 0.4)');
            gradient.addColorStop(0.5, 'rgba(255, 50, 0, 0.15)');
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

            ctx.globalAlpha = 0.8;
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(drop.x, drop.y, glowSize, 0, Math.PI * 2);
            ctx.fill();

            // --- Gota principal (formato de lágrima) ---
            ctx.globalAlpha = 1;
            const s = drop.size;

            ctx.save();
            ctx.translate(drop.x, drop.y);
            ctx.scale(1, drop.direction);

            const dropGrad = ctx.createRadialGradient(
                -s * 0.2, -s * 0.3, 0,
                0, 0, s * 1.2
            );
            dropGrad.addColorStop(0, '#FFDD00');
            dropGrad.addColorStop(0.3, '#FF8C00');
            dropGrad.addColorStop(0.7, '#FF4500');
            dropGrad.addColorStop(1, '#CC0000');

            ctx.fillStyle = dropGrad;
            ctx.beginPath();
            ctx.moveTo(0, -s * 1.4);
            ctx.bezierCurveTo(
                -s * 0.8, -s * 0.2,
                -s, s * 0.5,
                0, s
            );
            ctx.bezierCurveTo(
                s, s * 0.5,
                s * 0.8, -s * 0.2,
                0, -s * 1.4
            );
            ctx.closePath();
            ctx.fill();

            // --- Brilho interno ---
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = '#FFEE88';
            ctx.beginPath();
            ctx.ellipse(-s * 0.15, -s * 0.2, s * 0.25, s * 0.35, -0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        ctx.restore();
    },
};
