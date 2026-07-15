// ===== ITENS DE ATAQUE CONTRA O CHEFE =====
// Itens caem do céu — o jogador coleta (1 por vez) e arremessa contra o chefe

const BossItemManager = {
    skyItems: [],
    projectiles: [],
    carrying: false,

    spawnTimer: 0,
    SPAWN_INTERVAL: 130,
    MAX_SKY_ITEMS: 2,
    ITEM_LIFETIME: 420, // ~7s a 60fps antes de desaparecer sem ser coletado
    FALL_SPEED: 1.4,
    THROW_SPEED: -9,
    PICKUP_RADIUS: 40,
    HIT_RADIUS: 75,

    _animPhase: 0,

    reset() {
        this.skyItems = [];
        this.projectiles = [];
        this.carrying = false;
        this.spawnTimer = 0;
        this._animPhase = 0;
        this._updateHUD();
    },

    update(canvasWidth, canvasHeight) {
        this._animPhase += 0.08;

        // --- Spawn de itens coletáveis ---
        this.spawnTimer++;
        if (this.spawnTimer >= this.SPAWN_INTERVAL) {
            this.spawnTimer = 0;
            if (this.skyItems.length < this.MAX_SKY_ITEMS) {
                this._spawnSkyItem(canvasWidth);
            }
        }

        // --- Mover itens no céu, remover por tempo de vida ou saída de tela ---
        for (let i = this.skyItems.length - 1; i >= 0; i--) {
            const item = this.skyItems[i];
            item.y += this.FALL_SPEED;
            item.life++;

            if (item.life >= this.ITEM_LIFETIME || item.y > canvasHeight + 40) {
                this.skyItems.splice(i, 1);
            }
        }

        // --- Mover projéteis arremessados ---
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.y += this.THROW_SPEED;

            if (proj.y < -40) {
                this.projectiles.splice(i, 1);
            }
        }
    },

    _spawnSkyItem(canvasWidth) {
        const margin = 60;
        const x = margin + Math.random() * (canvasWidth - margin * 2);

        this.skyItems.push({ x, y: 40, life: 0 });
    },

    // ===== COLETA =====
    checkPickup(player) {
        if (this.carrying) return;

        for (let i = this.skyItems.length - 1; i >= 0; i--) {
            const item = this.skyItems[i];
            const dx = item.x - (player.x + player.width / 2);
            const dy = item.y - (player.y + player.height / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.PICKUP_RADIUS) {
                this.skyItems.splice(i, 1);
                this.carrying = true;
                this._updateHUD();
                return;
            }
        }
    },

    // ===== ARREMESSO =====
    throwItem(player) {
        if (!this.carrying) return;

        this.carrying = false;
        this.projectiles.push({
            x: player.x + player.width / 2,
            y: player.y,
        });
        this._updateHUD();
    },

    // ===== DANO AO CHEFE =====
    checkBossHit(boss) {
        let hit = false;

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            const dx = proj.x - boss.x;
            const dy = proj.y - boss.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.HIT_RADIUS) {
                this.projectiles.splice(i, 1);
                boss.takeDamage(1);
                hit = true;
            }
        }

        return hit;
    },

    // ===== RENDER =====
    render(ctx) {
        this._renderSkyItems(ctx);
        this._renderProjectiles(ctx);
    },

    _renderSkyItems(ctx) {
        for (const item of this.skyItems) {
            const bob = Math.sin(this._animPhase * 2 + item.x * 0.05) * 3;
            const drawY = item.y + bob;

            ctx.save();

            const glow = 16 + Math.sin(this._animPhase * 3 + item.x * 0.02) * 4;
            const grad = ctx.createRadialGradient(item.x, drawY, 0, item.x, drawY, glow);
            grad.addColorStop(0, 'rgba(253, 224, 71, 0.7)');
            grad.addColorStop(1, 'rgba(253, 224, 71, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(item.x, drawY, glow, 0, Math.PI * 2);
            ctx.fill();

            const bodyGrad = ctx.createRadialGradient(item.x - 3, drawY - 3, 0, item.x, drawY, 12);
            bodyGrad.addColorStop(0, '#fff9c4');
            bodyGrad.addColorStop(0.6, '#facc15');
            bodyGrad.addColorStop(1, '#b45309');
            ctx.fillStyle = bodyGrad;
            ctx.beginPath();
            ctx.arc(item.x, drawY, 12, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.restore();
        }
    },

    _renderProjectiles(ctx) {
        for (const proj of this.projectiles) {
            ctx.save();

            const glow = 14;
            const grad = ctx.createRadialGradient(proj.x, proj.y, 0, proj.x, proj.y, glow);
            grad.addColorStop(0, 'rgba(103, 232, 249, 0.7)');
            grad.addColorStop(1, 'rgba(103, 232, 249, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, glow, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#e0f2fe';
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, 8, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(103, 232, 249, 0.8)';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.restore();
        }
    },

    // Ícone flutuando sobre o player enquanto ele carrega um item
    renderCarriedItem(ctx, player) {
        if (!this.carrying) return;

        const cx = player.x + player.width / 2;
        const cy = player.y - 18 + Math.sin(this._animPhase * 4) * 3;

        ctx.save();
        ctx.fillStyle = '#facc15';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    },

    _updateHUD() {
        const el = document.getElementById('bossItemIndicator');
        if (!el) return;
        el.classList.toggle('loaded', this.carrying);
    },
};
