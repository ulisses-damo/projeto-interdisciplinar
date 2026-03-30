// ===== GERENCIADOR DE NÍVEIS =====
// Configuração, desbloqueio, temas e dificuldade

const LevelManager = {
    // Configuração visual de cada nível
    LEVELS: {
        1: { name: 'Céu Azul',  platformColor: '#1E3A8A', bgTop: '#87CEEB', bgMid: '#98d8f0', bgBot: '#7fb069' },
        2: { name: 'Deserto',   platformColor: '#334155', bgTop: '#FEF3C7', bgMid: '#D97706', bgBot: '#92400E' },
        3: { name: 'Vulcão',    platformColor: '#FBBF24', bgTop: '#7F1D1D', bgMid: '#991B1B', bgBot: '#450a0a' },
        4: { name: 'Noite',     platformColor: '#22D3EE', bgTop: '#0f172a', bgMid: '#1e1b4b', bgBot: '#312e81' },
        5: { name: 'Galáxia',   platformColor: '#F472B6', bgTop: '#0a0015', bgMid: '#140025', bgBot: '#1e0040' },
    },

    MAX_LEVEL: 5,
    PLATFORMS_PER_LEVEL: {
        1: 50,
        2: 75,
        3: 75,
        4: 100,
        5: 120,
    },

    getPlatformsForLevel(level) {
        const lvl = Math.min(level || this.currentLevel, this.MAX_LEVEL);
        return this.PLATFORMS_PER_LEVEL[lvl] || 50;
    },

    currentLevel: 1,
    unlockedLevels: [1],

    init() {
        this.MAX_LEVEL = Object.keys(this.LEVELS).length;
        this.loadUnlocked();
    },

    // --- Persistência ---
    loadUnlocked() {
        try {
            const saved = localStorage.getItem('maicon_unlocked_levels');
            if (saved) this.unlockedLevels = JSON.parse(saved);
        } catch (e) {
            this.unlockedLevels = [1];
        }
    },

    saveUnlocked() {
        try {
            localStorage.setItem('maicon_unlocked_levels', JSON.stringify(this.unlockedLevels));
        } catch (e) {}
    },

    unlockLevel(level) {
        if (!this.unlockedLevels.includes(level)) {
            this.unlockedLevels.push(level);
            this.unlockedLevels.sort((a, b) => a - b);
            this.saveUnlocked();
        }
    },

    isUnlocked(level) {
        return this.unlockedLevels.includes(level);
    },

    // --- Dados do nível ---
    getTheme(level) {
        const lvl = Math.min(level || this.currentLevel, this.MAX_LEVEL);
        return this.LEVELS[lvl];
    },

    getPlatformColor(level) {
        return this.getTheme(level).platformColor;
    },

    // --- Dificuldade ---
    // Constantes base de física
    BASE_MIN_GAP: 85,
    BASE_MAX_GAP: 115,
    BASE_SAFETY: 0.75,

    getDifficulty(level) {
        const lvl = Math.min(level || this.currentLevel, this.MAX_LEVEL);
        const t = (lvl - 1) / Math.max(this.MAX_LEVEL - 1, 1); // 0.0 a 1.0
        return {
            minGap: this.BASE_MIN_GAP + t * 10,                        // 85 → 95
            maxGap: Math.min(this.BASE_MAX_GAP + t * 5, 120),          // 115 → 120
            safety: this.BASE_SAFETY - t * 0.10,                        // 0.75 → 0.65
            crumbleChance: lvl >= 2 ? 0.15 + (lvl - 2) * 0.08 : 0,    // 0, 15%, 23%, 31%, 39%
        };
    },

    // --- Tema visual ---
    applyTheme(level, canvas) {
        const theme = this.getTheme(level);

        document.body.style.background = `linear-gradient(to bottom, ${theme.bgTop} 0%, ${theme.bgMid} 50%, ${theme.bgBot} 100%)`;
        canvas.style.background = `linear-gradient(to bottom, ${theme.bgTop} 0%, ${theme.bgMid} 50%, ${theme.bgBot} 100%)`;

        const gameScreen = document.getElementById('gameScreen');
        if (gameScreen) gameScreen.setAttribute('data-level', Math.min(level, this.MAX_LEVEL));
    },

    // --- HUD ---
    updateHUD(platformCount) {
        const counterEl = document.getElementById('platformCounter');
        if (counterEl) {
            const target = this.getPlatformsForLevel(this.currentLevel);
            counterEl.textContent = `Plataformas: ${platformCount} / ${target}`;
        }
    },

    updateLevelIndicator(level) {
        const levelEl = document.getElementById('levelIndicator');
        if (levelEl) {
            const theme = this.getTheme(level);
            levelEl.textContent = `Nível ${level} — ${theme.name}`;
        }
    }
};

// Inicializar ao carregar
LevelManager.init();
