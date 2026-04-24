// ===== GERENCIADOR DE POWER-UPS =====
// Spawna power-ups em plataformas (nível 3+)
// Tipos: shield (imunidade 2s), extraLife (sobrevive 1 hit), doubleJump (pulo duplo 5s)
// Apenas 1 power-up ativo por vez — novo substitui o anterior

const PowerUpManager = {
    // Power-ups no mundo (sobre plataformas)
    items: [],

    // Estado do poder ativo
    active: {
        type: null,      // 'shield' | 'extraLife' | 'doubleJump' | null
        timer: 0,        // Frames restantes (0 = sem timer, ex: extraLife)
        used: false,      // Para extraLife: já usou?
    },

    // Controle de spawn
    spawnTimer: 0,
    SPAWN_INTERVAL: 600,   // ~10 segundos entre tentativas de spawn
    SPAWN_CHANCE: 0.35,    // 35% de chance ao tentar spawnar
    MAX_ITEMS: 3,          // Máximo de itens no mundo ao mesmo tempo

    // Animação
    _animPhase: 0,

    // Tipos de power-up com configurações
    TYPES: {
        shield: {
            emoji: '🛡️',
            label: 'Escudo',
            color: '#3B82F6',
            glowColor: 'rgba(59, 130, 246, 0.5)',
            duration: 300, // 5 segundos a 60fps
        },
        extraLife: {
            emoji: '❤️',
            label: 'Vida Extra',
            color: '#EF4444',
            glowColor: 'rgba(239, 68, 68, 0.5)',
            duration: 0,   // Sem timer — dura até levar hit
        },
        doubleJump: {
            emoji: '⬆️',
            label: 'Pulo Duplo',
            color: '#10B981',
            glowColor: 'rgba(16, 185, 129, 0.5)',
            duration: 300,  // 5 segundos a 60fps
        },
    },

    reset() {
        this.items = [];
        this.active = { type: null, timer: 0, used: false };
        this.spawnTimer = 0;
        this._animPhase = 0;
        this._updateHUD();
    },

    // ===== UPDATE =====
    update(level, platforms, canvasWidth, cameraY, canvasHeight) {
        if (level < 3) return;

        this._animPhase += 0.05;
        const descending = LevelManager.isDescending(level);

        // --- Timer do poder ativo ---
        if (this.active.type && this.active.timer > 0) {
            this.active.timer--;
            if (this.active.timer <= 0) {
                this._deactivate();
            }
            this._updateHUD();
        }

        // --- Tentar spawnar novos power-ups ---
        this.spawnTimer++;
        if (this.spawnTimer >= this.SPAWN_INTERVAL) {
            this.spawnTimer = 0;
            if (this.items.length < this.MAX_ITEMS && Math.random() < this.SPAWN_CHANCE) {
                this._spawn(platforms, cameraY, canvasHeight);
            }
        }

        // --- Remover itens que saíram da tela por baixo ---
        for (let i = this.items.length - 1; i >= 0; i--) {
            const screenY = this.items[i].y - cameraY;
            if ((!descending && screenY > canvasHeight + 150) || (descending && screenY < -150)) {
                this.items.splice(i, 1);
            }
        }
    },

    // ===== COLETA — verificar se jogador pegou um item =====
    checkPickup(player) {
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            const dx = (item.x + 15) - (player.x + player.width / 2);
            const dy = (item.y + 15) - (player.y + player.height / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 40) {
                this._activate(item.type);
                this.items.splice(i, 1);
                return item.type;
            }
        }
        return null;
    },

    // ===== SHIELD: está ativo? =====
    hasShield() {
        return this.active.type === 'shield' && this.active.timer > 0;
    },

    // ===== EXTRA LIFE: consumir ao levar hit =====
    useExtraLife() {
        if (this.active.type === 'extraLife' && !this.active.used) {
            this.active.used = true;
            this._deactivate();
            return true;  // Sobreviveu
        }
        return false;
    },

    // ===== DOUBLE JUMP: está ativo? =====
    hasDoubleJump() {
        return this.active.type === 'doubleJump' && this.active.timer > 0;
    },

    // ===== RENDER — desenha itens no mundo =====
    render(ctx) {
        for (const item of this.items) {
            const config = this.TYPES[item.type];
            const bob = Math.sin(this._animPhase * 2 + item.x) * 4; // Flutuação
            const drawY = item.y + bob;

            ctx.save();

            // Glow pulsante
            const glowSize = 22 + Math.sin(this._animPhase * 3) * 5;
            const grad = ctx.createRadialGradient(
                item.x + 15, drawY + 15, 0,
                item.x + 15, drawY + 15, glowSize
            );
            grad.addColorStop(0, config.glowColor);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(item.x + 15, drawY + 15, glowSize, 0, Math.PI * 2);
            ctx.fill();

            // Caixa do item
            const boxSize = 30;
            ctx.fillStyle = config.color;
            ctx.globalAlpha = 0.85;
            ctx.beginPath();
            ctx.arc(item.x + 15, drawY + 15, boxSize / 2, 0, Math.PI * 2);
            ctx.fill();

            // Borda brilhante
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Brilho interno
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.ellipse(item.x + 12, drawY + 10, 8, 5, -0.4, 0, Math.PI * 2);
            ctx.fill();

            // Emoji
            ctx.globalAlpha = 1;
            ctx.font = '18px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(config.emoji, item.x + 15, drawY + 16);

            ctx.restore();
        }
    },

    // ===== RENDER do efeito visual no jogador =====
    renderPlayerEffect(ctx, player) {
        if (!this.active.type) return;

        ctx.save();
        const cx = player.x + player.width / 2;
        const cy = player.y + player.height / 2;

        if (this.active.type === 'shield') {
            // Bolha azul ao redor do jogador
            const pulse = Math.sin(this._animPhase * 4) * 3;
            const radius = 38 + pulse;
            ctx.globalAlpha = 0.25 + Math.sin(this._animPhase * 3) * 0.1;
            ctx.strokeStyle = '#3B82F6';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.stroke();

            ctx.globalAlpha = 0.08;
            ctx.fillStyle = '#60A5FA';
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.active.type === 'extraLife') {
            // Coraçõezinhos flutuantes
            ctx.globalAlpha = 0.5 + Math.sin(this._animPhase * 2) * 0.2;
            ctx.font = '14px serif';
            ctx.textAlign = 'center';
            const angle1 = this._animPhase * 1.5;
            const angle2 = angle1 + Math.PI;
            ctx.fillText('❤️', cx + Math.cos(angle1) * 30, cy - 25 + Math.sin(angle1) * 5);
            ctx.fillText('❤️', cx + Math.cos(angle2) * 30, cy - 25 + Math.sin(angle2) * 5);
        } else if (this.active.type === 'doubleJump') {
            // Setas verdes abaixo dos pés
            ctx.globalAlpha = 0.4 + Math.sin(this._animPhase * 5) * 0.2;
            ctx.font = '16px serif';
            ctx.textAlign = 'center';
            const offsetY = Math.sin(this._animPhase * 4) * 4;
            ctx.fillText('⬆️', cx - 10, player.y + player.height + 12 + offsetY);
            ctx.fillText('⬆️', cx + 10, player.y + player.height + 8 + offsetY);
        }

        ctx.restore();
    },

    // ===== PRIVADOS =====

    _spawn(platforms, cameraY, canvasHeight) {
        // Escolher uma plataforma visível e normal para colocar o item
        const visible = platforms.filter(p =>
            !p.isFalling &&
            p.type === 'normal' &&
            (p.y - cameraY) > 50 &&
            (p.y - cameraY) < canvasHeight - 80
        );

        if (visible.length === 0) return;

        const plat = visible[Math.floor(Math.random() * visible.length)];

        // Verificar se já tem item nessa plataforma
        for (const item of this.items) {
            if (Math.abs(item.x - plat.x) < 60 && Math.abs(item.y - plat.y) < 40) return;
        }

        // Sortear tipo
        const types = ['shield', 'extraLife', 'doubleJump'];
        const type = types[Math.floor(Math.random() * types.length)];

        this.items.push({
            x: plat.x + plat.width / 2 - 15,
            y: plat.y - 35,
            type: type,
        });
    },

    _activate(type) {
        const config = this.TYPES[type];
        this.active.type = type;
        this.active.timer = config.duration;
        this.active.used = false;
        this._updateHUD();
    },

    _deactivate() {
        this.active.type = null;
        this.active.timer = 0;
        this.active.used = false;
        this._updateHUD();
    },

    _updateHUD() {
        const el = document.getElementById('powerUpIndicator');
        if (!el) return;

        if (!this.active.type) {
            el.style.display = 'none';
            return;
        }

        const config = this.TYPES[this.active.type];
        el.style.display = 'flex';
        el.style.borderColor = config.color;
        el.style.boxShadow = `0 0 15px ${config.glowColor}, inset 0 0 8px ${config.glowColor}`;

        // Conteúdo
        let timeText = '';
        if (this.active.timer > 0) {
            const secs = Math.ceil(this.active.timer / 60);
            timeText = `<span class="powerup-timer">${secs}s</span>`;
        } else if (this.active.type === 'extraLife') {
            timeText = '<span class="powerup-timer">1×</span>';
        }

        el.innerHTML = `
            <span class="powerup-emoji">${config.emoji}</span>
            <span class="powerup-label">${config.label}</span>
            ${timeText}
        `;
    },
};
