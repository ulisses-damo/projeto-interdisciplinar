// ===== GERADOR DE PLATAFORMAS =====
// Gera plataformas em CAMADAS espalhadas pelo canvas inteiro
// Cada camada tem 2-3 plataformas distribuídas horizontalmente
// Resultado: campo de plataformas como um platformer real

const PlatformGenerator = {
    PLATFORM_WIDTH: 100,
    PLATFORM_HEIGHT: 20,
    EDGE_MARGIN: 5,

    // Configuração de camadas
    ROW_JITTER_Y: 18,       // Variação vertical dentro de uma camada (±px)
    MIN_ROW_GAP: 65,        // Gap mínimo entre camadas
    MAX_ROW_GAP: 95,        // Gap máximo entre camadas (confortável para pular)
    MIN_PER_ROW: 2,         // Mínimo de plataformas por camada
    MAX_PER_ROW: 3,         // Máximo de plataformas por camada

    // Rastreamento
    highestRowY: 0,         // Y da camada mais alta já gerada
    platformList: null,     // Referência para checar overlap

    reset() {
        this.highestRowY = 0;
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

        // --- Primeira plataforma: spawn central ---
        let rowY = canvasHeight - 40;
        platforms.push(new Platform(
            (canvasWidth - this.PLATFORM_WIDTH) / 2,
            rowY,
            this.PLATFORM_WIDTH, this.PLATFORM_HEIGHT,
            color, idCounter++, 'normal'
        ));

        // --- Gerar camadas para cima ---
        // Camadas suficientes para preencher a tela + buffer acima
        const numRows = 9;
        for (let row = 1; row <= numRows; row++) {
            const gap = this._getRowGap(level);
            rowY -= gap;

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

        this.highestRowY = rowY;
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
        // Encontrar a plataforma mais alta
        let highestY = Infinity;
        for (const p of allPlatforms) {
            if (p !== platform && !p.isFalling && p.y < highestY) {
                highestY = p.y;
            }
        }

        // Quantas plataformas já estão perto do "topo"?
        // Se poucas, gerar uma nova camada mais acima
        const topZone = highestY + 40; // 40px de tolerância
        let nearTop = 0;
        for (const p of allPlatforms) {
            if (p !== platform && !p.isFalling && p.y < topZone) {
                nearTop++;
            }
        }

        let newY;
        if (nearTop < this.MIN_PER_ROW) {
            // Poucas plataformas no topo — colocar na mesma faixa (completar a camada)
            const jitter = (Math.random() - 0.5) * this.ROW_JITTER_Y * 2;
            newY = highestY + jitter;
        } else {
            // Camada do topo já tem plataformas suficientes — criar nova camada acima
            const gap = this._getRowGap(level);
            newY = Math.min(highestY, this.highestRowY) - gap;
            const jitter = (Math.random() - 0.5) * this.ROW_JITTER_Y * 2;
            newY += jitter;
            this.highestRowY = Math.min(this.highestRowY, newY);
        }

        // X aleatório pelo canvas inteiro, evitando sobreposição
        let x = this._findGoodX(newY, allPlatforms, platform, canvasWidth);

        platform.x = x;
        platform.y = newY;
        platform.id = nextId;
        platform.color = LevelManager.getPlatformColor(level);

        // Tipo
        const diff = LevelManager.getDifficulty(level);
        if (diff.crumbleChance > 0) {
            platform.type = Math.random() < diff.crumbleChance ? 'crumbling' : 'normal';
        } else {
            platform.type = 'normal';
        }
        platform.resetCrumble();

        return nextId + 1;
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

    _getPlatformsPerRow(level) {
        const roll = Math.random();
        if (level <= 2) {
            // Fácil: mais plataformas (60% de 3, 40% de 2)
            return roll < 0.6 ? 3 : 2;
        } else if (level <= 4) {
            // Médio: balanceado (45% de 3, 55% de 2)
            return roll < 0.45 ? 3 : 2;
        } else {
            // Difícil: menos plataformas (30% de 3, 70% de 2)
            return roll < 0.3 ? 3 : 2;
        }
    },

    _getType(level, rowIndex) {
        if (rowIndex <= 2) return 'normal'; // Primeiras 2 camadas sempre seguras
        const diff = LevelManager.getDifficulty(level);
        if (diff.crumbleChance > 0 && Math.random() < diff.crumbleChance) {
            return 'crumbling';
        }
        return 'normal';
    }
};
