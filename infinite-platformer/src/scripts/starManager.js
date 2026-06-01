// ===== GERENCIADOR DE ESTRELAS =====
// Distribui 3 estrelas bonus por nivel sem afetar a conclusao

const StarManager = {
    STAR_TARGET: 3,
    EARLIEST_PROGRESS: 6,
    END_PADDING: 6,
    SPAWN_LEAD: 4,

    items: [],
    milestones: [],
    collected: 0,
    currentLevel: null,
    _animPhase: 0,
    _bonusMessageTimer: 0,
    _bonusAwarded: false,

    reset(level) {
        this.currentLevel = level || LevelManager.currentLevel;
        this.items = [];
        this.collected = 0;
        this._animPhase = 0;
        this._bonusMessageTimer = 0;
        this._bonusAwarded = false;
        this.milestones = this._createMilestones(LevelManager.getPlatformsForLevel(this.currentLevel));
        this._hideBonusMessage();
        this._updateHUD();
    },

    update(level, platforms, player, cameraY, canvasHeight, platformCount) {
        if (!player) return;

        if (this.currentLevel !== level || this.milestones.length === 0) {
            this.reset(level);
        }

        this._animPhase += 0.045;

        if (this._bonusMessageTimer > 0) {
            this._bonusMessageTimer--;
            if (this._bonusMessageTimer === 0) {
                this._hideBonusMessage();
            }
        }

        for (const milestone of this.milestones) {
            if (milestone.spawned || platformCount < milestone.triggerAt) {
                continue;
            }

            if (this._spawnForMilestone(milestone, platforms, player, cameraY, canvasHeight, level)) {
                milestone.spawned = true;
            }
        }

        this._cleanupMissedStars(cameraY, canvasHeight, level);
    },

    checkPickup(player) {
        if (!player) return false;

        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            const dx = item.x - (player.x + player.width / 2);
            const dy = item.y - (player.y + player.height / 2);
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 34) {
                this.items.splice(i, 1);
                this.collected = Math.min(this.collected + 1, this.STAR_TARGET);
                this._updateHUD();

                if (this.collected >= this.STAR_TARGET && !this._bonusAwarded) {
                    this._bonusAwarded = true;
                    this._showBonusMessage();
                }

                return true;
            }
        }

        return false;
    },

    render(ctx) {
        for (const item of this.items) {
            const bob = Math.sin(this._animPhase * 2 + item.x * 0.05) * 5;
            const spin = this._animPhase + item.x * 0.01;
            const drawY = item.y + bob;

            ctx.save();

            const glowRadius = 20 + Math.sin(this._animPhase * 3 + item.x * 0.02) * 4;
            const gradient = ctx.createRadialGradient(item.x, drawY, 0, item.x, drawY, glowRadius);
            gradient.addColorStop(0, 'rgba(255, 244, 163, 0.75)');
            gradient.addColorStop(0.55, 'rgba(251, 191, 36, 0.28)');
            gradient.addColorStop(1, 'rgba(251, 191, 36, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(item.x, drawY, glowRadius, 0, Math.PI * 2);
            ctx.fill();

            this._drawStar(ctx, item.x, drawY, 5, 14, 6, spin);

            ctx.restore();
        }
    },

    hasCollectedAll() {
        return this.collected >= this.STAR_TARGET;
    },

    _createMilestones(targetPlatforms) {
        const milestones = [];
        const safeTarget = Math.max(targetPlatforms, this.EARLIEST_PROGRESS + this.STAR_TARGET * 3);
        const minProgress = Math.min(this.EARLIEST_PROGRESS, Math.max(2, safeTarget - this.STAR_TARGET));
        const maxProgress = Math.max(minProgress + this.STAR_TARGET - 1, safeTarget - this.END_PADDING);
        const span = Math.max(1, maxProgress - minProgress + 1);
        const segmentSize = span / this.STAR_TARGET;

        for (let index = 0; index < this.STAR_TARGET; index++) {
            const segmentStart = Math.floor(minProgress + segmentSize * index);
            const segmentEnd = Math.max(segmentStart, Math.floor(minProgress + segmentSize * (index + 1)) - 1);
            const at = getRandomInt(segmentStart, segmentEnd);

            milestones.push({
                at,
                triggerAt: Math.max(1, at - this.SPAWN_LEAD),
                spawned: false,
            });
        }

        milestones.sort((left, right) => left.at - right.at);
        return milestones;
    },

    _spawnForMilestone(milestone, platforms, player, cameraY, canvasHeight, level) {
        const candidates = this._getSpawnCandidates(platforms, player, cameraY, canvasHeight, level);
        if (candidates.length === 0) {
            return false;
        }

        const platform = candidates[Math.floor(Math.random() * candidates.length)];
        this.items.push({
            x: platform.x + platform.width / 2,
            y: platform.y - 28,
            platformId: platform.id,
            milestoneAt: milestone.at,
        });
        return true;
    },

    _getSpawnCandidates(platforms, player, cameraY, canvasHeight, level) {
        const descending = LevelManager.isDescending(level);
        const validPlatforms = platforms.filter(platform => {
            if (!platform || platform.isFalling) return false;
            if (typeof platform.isSpiked === 'function' && platform.isSpiked()) return false;

            const screenY = platform.y - cameraY;
            const insideBand = screenY > 50 && screenY < canvasHeight - 100;
            if (!insideBand) return false;

            if (descending) {
                return platform.y > player.y + 40;
            }

            return platform.y < player.y - 40;
        });

        const preferred = validPlatforms.filter(platform => platform.type === 'normal');
        const pool = preferred.length > 0 ? preferred : validPlatforms;

        return pool.filter(platform => !this._hasNearbyStar(platform));
    },

    _hasNearbyStar(platform) {
        const targetX = platform.x + platform.width / 2;
        const targetY = platform.y - 28;
        return this.items.some(item => {
            if (item.platformId === platform.id) {
                return true;
            }

            return Math.abs(item.x - targetX) < 70 && Math.abs(item.y - targetY) < 50;
        });
    },

    _cleanupMissedStars(cameraY, canvasHeight, level) {
        const descending = LevelManager.isDescending(level);

        for (let i = this.items.length - 1; i >= 0; i--) {
            const screenY = this.items[i].y - cameraY;
            const outOfView = (!descending && screenY > canvasHeight + 180)
                || (descending && screenY < -180);

            if (outOfView) {
                this.items.splice(i, 1);
            }
        }
    },

    _drawStar(ctx, centerX, centerY, spikes, outerRadius, innerRadius, rotation) {
        let angle = rotation - Math.PI / 2;
        const step = Math.PI / spikes;

        ctx.beginPath();
        for (let index = 0; index < spikes * 2; index++) {
            const radius = index % 2 === 0 ? outerRadius : innerRadius;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }

            angle += step;
        }
        ctx.closePath();

        const fill = ctx.createLinearGradient(centerX, centerY - outerRadius, centerX, centerY + outerRadius);
        fill.addColorStop(0, '#FFF9C4');
        fill.addColorStop(0.55, '#FACC15');
        fill.addColorStop(1, '#F59E0B');
        ctx.fillStyle = fill;
        ctx.fill();

        ctx.strokeStyle = 'rgba(120, 53, 15, 0.55)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.beginPath();
        ctx.ellipse(centerX - 3, centerY - 5, 4, 2.5, -0.4, 0, Math.PI * 2);
        ctx.fill();
    },

    _updateHUD() {
        const counter = document.getElementById('starCounter');
        if (!counter) return;

        counter.textContent = `Estrelas: ${this.collected} / ${this.STAR_TARGET}`;
        counter.classList.toggle('complete', this.hasCollectedAll());
    },

    _showBonusMessage() {
        const message = document.getElementById('starBonusMessage');
        if (!message) return;

        this._bonusMessageTimer = 180;
        message.textContent = 'Bonus das estrelas completo!';
        message.classList.add('visible');
    },

    _hideBonusMessage() {
        const message = document.getElementById('starBonusMessage');
        if (!message) return;

        message.classList.remove('visible');
        message.textContent = '';
    },
};