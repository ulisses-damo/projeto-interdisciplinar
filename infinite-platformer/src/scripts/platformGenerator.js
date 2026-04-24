// ===== GERADOR DE PLATAFORMAS =====
// Gera plataformas em CAMADAS espalhadas pelo canvas inteiro
// Cada camada tem 2-3 plataformas distribuídas horizontalmente
// Resultado: campo de plataformas como um platformer real

const PlatformGenerator = {
    PLATFORM_WIDTH: 100,
    PLATFORM_HEIGHT: 20,
    EDGE_MARGIN: 5,
    FRONT_BUFFER_PX: 320,   // Distância mínima de plataformas prontas à frente da câmera
    RECYCLE_MARGIN: 80,     // Quanto uma plataforma precisa ficar para trás para poder reciclar
    INITIAL_EXTRA_BUFFER: 360,
    PLAYER_LOOKAHEAD_FRAMES: 18,
    PLAYER_RETAIN_DISTANCE_FACTOR: 0.65,
    MAX_PLAYER_FALL_SPEED: 12,

    // Configuração de camadas
    ROW_JITTER_Y: 18,       // Variação vertical dentro de uma camada (±px)
    MIN_ROW_GAP: 65,        // Gap mínimo entre camadas
    MAX_ROW_GAP: 95,        // Gap máximo entre camadas (confortável para pular)
    MIN_PER_ROW: 2,         // Mínimo de plataformas por camada
    MAX_PER_ROW: 3,         // Máximo de plataformas por camada

    // Rastreamento
    frontierRowY: 0,        // Y mais distante já gerado na direção do nível
    platformList: null,     // Referência para checar overlap

    reset() {
        this.frontierRowY = 0;
        this.platformList = null;
    },

    // =======================================
    // CRIAÇÃO INICIAL — gera campo de plataformas
    // =======================================
    createInitial(canvasWidth, canvasHeight, level) {
        const platforms = [];
        this.platformList = platforms;
        const color = LevelManager.getPlatformColor(level);
        let idCounter = 0;
        const descending = LevelManager.isDescending(level);

        // --- Primeira plataforma: spawn central ---
        let rowY = descending ? 140 : canvasHeight - 40;
        platforms.push(new Platform(
            (canvasWidth - this.PLATFORM_WIDTH) / 2,
            rowY,
            this.PLATFORM_WIDTH, this.PLATFORM_HEIGHT,
            color, idCounter++, 'normal'
        ));

        // --- Gerar camadas para cima ---
        // Camadas suficientes para preencher a tela + buffer acima
        const numRows = this._getInitialRowCount(canvasHeight, level, rowY);
        for (let row = 1; row <= numRows; row++) {
            const gap = this._getRowGap(level);
            rowY += descending ? gap : -gap;

            const count = this._getPlatformsPerRow(level);
            const positions = this._generateRowPositions(count, canvasWidth);

            for (let p = 0; p < positions.length; p++) {
                const jitterY = (Math.random() - 0.5) * this.ROW_JITTER_Y * 2;
                const type = this._getType(level, row);

                platforms.push(new Platform(
                    positions[p],
                    rowY + jitterY,
                    this.PLATFORM_WIDTH, this.PLATFORM_HEIGHT,
                    color, idCounter++, type
                ));
            }
        }

        this.frontierRowY = platforms.reduce(
            (edgeY, platform) => descending ? Math.max(edgeY, platform.y) : Math.min(edgeY, platform.y),
            descending ? -Infinity : Infinity
        );
        return { platforms, nextId: idCounter };
    },

    // =======================================
    // GERAR POSIÇÕES X PARA UMA CAMADA
    // Divide o canvas em zonas e coloca 1 plataforma por zona
    // =======================================
    _generateRowPositions(count, canvasWidth) {
        const positions = [];
        const usable = canvasWidth - this.EDGE_MARGIN * 2 - this.PLATFORM_WIDTH;
        const zoneWidth = usable / count;

        for (let i = 0; i < count; i++) {
            const zoneStart = this.EDGE_MARGIN + i * zoneWidth;
            // Posição aleatória DENTRO da zona (com margem interna)
            const innerMargin = 5;
            const maxX = zoneWidth - this.PLATFORM_WIDTH + innerMargin;
            const x = zoneStart + innerMargin + Math.random() * Math.max(maxX, 0);
            positions.push(clamp(x, this.EDGE_MARGIN, canvasWidth - this.PLATFORM_WIDTH - this.EDGE_MARGIN));
        }

        return positions;
    },

    // =======================================
    // REPOSICIONAR — plataforma que saiu por baixo
    // Coloca em nova posição acima da mais alta
    // =======================================
    reposition(platform, allPlatforms, canvasWidth, level, nextId) {
        const descending = LevelManager.isDescending(level);

        // Encontrar a faixa mais à frente na direção do nível
        let frontierY = descending ? -Infinity : Infinity;
        for (const p of allPlatforms) {
            if (p === platform || p.isFalling) continue;

            if (descending) {
                if (p.y > frontierY) frontierY = p.y;
            } else if (p.y < frontierY) {
                frontierY = p.y;
            }
        }

        if (!Number.isFinite(frontierY)) {
            frontierY = platform.y;
        }

        // Quantas plataformas já estão perto da borda de avanço?
        const frontZone = descending ? frontierY - 40 : frontierY + 40;
        let nearFront = 0;
        for (const p of allPlatforms) {
            if (p === platform || p.isFalling) continue;

            if (descending) {
                if (p.y > frontZone) nearFront++;
            } else if (p.y < frontZone) {
                nearFront++;
            }
        }

        let newY;
        if (nearFront < this.MIN_PER_ROW) {
            // Completa a camada já existente na borda de avanço
            const jitter = (Math.random() - 0.5) * this.ROW_JITTER_Y * 2;
            newY = frontierY + jitter;
        } else {
            // A camada atual já está cheia — criar outra mais à frente
            const gap = this._getRowGap(level);
            const referenceY = descending
                ? Math.max(frontierY, this.frontierRowY)
                : Math.min(frontierY, this.frontierRowY);

            newY = referenceY + (descending ? gap : -gap);
            const jitter = (Math.random() - 0.5) * this.ROW_JITTER_Y * 2;
            newY += jitter;
            this.frontierRowY = descending
                ? Math.max(this.frontierRowY, newY)
                : Math.min(this.frontierRowY, newY);
        }

        // X aleatório pelo canvas inteiro, evitando sobreposição
        let x = this._findGoodX(newY, allPlatforms, platform, canvasWidth);

        platform.x = x;
        platform.y = newY;
        platform.id = nextId;
        platform.color = LevelManager.getPlatformColor(level);
        this.frontierRowY = descending
            ? Math.max(this.frontierRowY, platform.y)
            : Math.min(this.frontierRowY, platform.y);

        // Tipo
        platform.type = this._getType(level);
        platform.resetCrumble();

        return nextId + 1;
    },

    ensureBuffer(allPlatforms, canvasWidth, canvasHeight, level, nextId, player) {
        let updatedId = nextId;
        let attempts = 0;
        const maxAttempts = allPlatforms.length;
        const anchorY = this._getPlayerAnchorY(player, level);

        while (!this._hasFrontBuffer(anchorY, level) && attempts < maxAttempts) {
            const reusable = this._findReusablePlatform(allPlatforms, player, canvasHeight, level);
            if (!reusable) break;

            updatedId = this.reposition(reusable, allPlatforms, canvasWidth, level, updatedId);
            attempts++;
        }

        return updatedId;
    },

    // =======================================
    // ENCONTRAR BOM X — evita cluster/sobreposição
    // =======================================
    _findGoodX(targetY, allPlatforms, excludePlatform, canvasWidth) {
        const maxAttempts = 15;
        let bestX = this.EDGE_MARGIN + Math.random() * (canvasWidth - this.PLATFORM_WIDTH - this.EDGE_MARGIN * 2);
        let bestDist = 0;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const candidateX = this.EDGE_MARGIN + Math.random() * (canvasWidth - this.PLATFORM_WIDTH - this.EDGE_MARGIN * 2);

            // Calcular distância mínima para plataformas na mesma faixa de Y
            let minDist = Infinity;
            for (const p of allPlatforms) {
                if (p === excludePlatform || p.isFalling) continue;
                const dy = Math.abs(p.y - targetY);
                if (dy < 50) { // Plataformas na mesma "camada"
                    const dx = Math.abs(candidateX - p.x);
                    if (dx < minDist) minDist = dx;
                }
            }

            // Queremos maximizar a distância mínima (spread máximo)
            if (minDist > bestDist) {
                bestDist = minDist;
                bestX = candidateX;
            }

            // Se achou uma posição com boa distância, aceitar
            if (minDist > this.PLATFORM_WIDTH * 1.5) break;
        }

        return clamp(bestX, this.EDGE_MARGIN, canvasWidth - this.PLATFORM_WIDTH - this.EDGE_MARGIN);
    },

    // =======================================
    // HELPERS
    // =======================================

    _getRowGap(level) {
        const diff = LevelManager.getDifficulty(level);
        // Usar range de gap mais confortável que o máximo do pulo
        const minGap = Math.max(this.MIN_ROW_GAP, diff.minGap * 0.75);
        const maxGap = Math.min(this.MAX_ROW_GAP, diff.maxGap * 0.85);
        return minGap + Math.random() * (maxGap - minGap);
    },

    _getInitialRowCount(canvasHeight, level, startY) {
        if (!LevelManager.isDescending(level)) {
            return 9;
        }

        const averageGap = (this.MIN_ROW_GAP + this.MAX_ROW_GAP) / 2;
        const predictiveSpan = this.MAX_PLAYER_FALL_SPEED * this.PLAYER_LOOKAHEAD_FRAMES;
        const travelSpan = (canvasHeight - startY) + predictiveSpan + this.FRONT_BUFFER_PX + this.INITIAL_EXTRA_BUFFER;
        return Math.max(9, Math.ceil(travelSpan / averageGap));
    },

    _getPlayerAnchorY(player, level) {
        if (!player) return 0;

        const descending = LevelManager.isDescending(level);
        const verticalSpeed = descending
            ? Math.max(player.velocityY || 0, 0)
            : Math.max(-(player.velocityY || 0), 0);
        const projectedOffset = verticalSpeed * this.PLAYER_LOOKAHEAD_FRAMES;

        if (descending) {
            return player.y + player.height + projectedOffset;
        }

        return player.y - projectedOffset;
    },

    _hasFrontBuffer(anchorY, level) {
        const descending = LevelManager.isDescending(level);

        if (descending) {
            return this.frontierRowY >= anchorY + this.FRONT_BUFFER_PX;
        }

        return this.frontierRowY <= anchorY - this.FRONT_BUFFER_PX;
    },

    _findReusablePlatform(allPlatforms, player, canvasHeight, level) {
        if (!player) return null;

        const descending = LevelManager.isDescending(level);
        let candidate = null;
        let candidateScreenY = descending ? Infinity : -Infinity;
        const retainDistance = canvasHeight * this.PLAYER_RETAIN_DISTANCE_FACTOR + this.RECYCLE_MARGIN;
        const playerTop = player.y;
        const playerBottom = player.y + player.height;

        for (const platform of allPlatforms) {
            if (platform.isFalling) continue;

            if (descending) {
                const safelyBehind = platform.y + platform.height < playerTop - retainDistance;
                if (safelyBehind && platform.y < candidateScreenY) {
                    candidate = platform;
                    candidateScreenY = platform.y;
                }
                continue;
            }

            const safelyBehind = platform.y > playerBottom + retainDistance;
            if (safelyBehind && platform.y > candidateScreenY) {
                candidate = platform;
                candidateScreenY = platform.y;
            }
        }

        return candidate;
    },

    _getPlatformsPerRow(level) {
        const roll = Math.random();
        if (level <= 2) {
            // Fácil: mais plataformas (60% de 3, 40% de 2)
            return roll < 0.6 ? 3 : 2;
        } else if (level <= 3) {
            // Médio: balanceado (45% de 3, 55% de 2)
            return roll < 0.45 ? 3 : 2;
        } else {
            // Difícil: menos plataformas (30% de 3, 70% de 2)
            return roll < 0.3 ? 3 : 2;
        }
    },

    _getType(level, rowIndex = 3) {
        if (rowIndex <= 2) return 'normal'; // Primeiras 2 camadas sempre seguras

        if (level === 4 && Math.random() < 0.18) {
            return Math.random() < 0.5 ? 'triangle-left' : 'triangle-right';
        }

        const diff = LevelManager.getDifficulty(level);
        if (diff.crumbleChance > 0 && Math.random() < diff.crumbleChance) {
            return 'crumbling';
        }
        return 'normal';
    }
};
