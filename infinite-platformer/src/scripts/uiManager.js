// ===== GERENCIADOR DE UI =====
// Telas de seleção de nível, conclusão, game over, transições

const UIManager = {
    // Callback para quando um nível for selecionado
    onLevelSelected: null, // Será definido por game_fixed.js

    // --- Tela inicial → jogo ---
    startGame() {
        const startScreen = document.getElementById('startScreen');
        const gameScreen = document.getElementById('gameScreen');

        startScreen.style.transition = 'opacity 0.5s ease-out';
        startScreen.style.opacity = '0';

        setTimeout(() => {
            startScreen.style.display = 'none';
            gameScreen.style.display = 'block';
            gameScreen.style.opacity = '0';
            gameScreen.style.transition = 'opacity 0.5s ease-in';

            setTimeout(() => {
                gameScreen.style.opacity = '1';
                this.showLevelSelector();
            }, 50);
        }, 500);
    },

    // --- Seletor de níveis ---
    showLevelSelector() {
        const selector = document.getElementById('levelSelectorOverlay');
        if (!selector) return;

        const grid = document.getElementById('levelGrid');
        if (!grid) return;

        grid.innerHTML = '';

        for (let i = 1; i <= LevelManager.MAX_LEVEL; i++) {
            const btn = document.createElement('button');
            const isUnlocked = LevelManager.isUnlocked(i);
            const theme = LevelManager.LEVELS[i];

            btn.className = 'level-btn' + (isUnlocked ? ' unlocked' : ' locked');

            if (isUnlocked) {
                btn.innerHTML = `
                    <span class="level-number">${i}</span>
                    <span class="level-name-btn">${theme.name}</span>
                `;
                btn.style.background = `linear-gradient(135deg, ${theme.bgTop}, ${theme.bgMid})`;
                btn.style.borderColor = theme.platformColor;
                const lvl = i;
                btn.addEventListener('click', () => {
                    this.hideLevelSelector();
                    if (this.onLevelSelected) this.onLevelSelected(lvl);
                });
            } else {
                btn.innerHTML = `
                    <span class="lock-icon">🔒</span>
                    <span class="level-number">${i}</span>
                    <span class="level-name-btn">${theme.name}</span>
                `;
                btn.style.background = '#333';
                btn.style.cursor = 'not-allowed';
            }

            grid.appendChild(btn);
        }

        selector.style.display = 'flex';
        selector.style.opacity = '1';
    },

    hideLevelSelector() {
        const selector = document.getElementById('levelSelectorOverlay');
        if (selector) {
            selector.style.display = 'none';
            selector.style.opacity = '0';
        }
    },

    // --- Tela de conclusão de nível ---
    showLevelComplete(level) {
        const overlay = document.getElementById('levelCompleteOverlay');
        const text = document.getElementById('levelCompleteText');
        if (overlay && text) {
            const theme = LevelManager.getTheme(level);
            text.innerHTML = `🎉 Muito bem!<br>Você passou do Nível ${level}!<br><span style="font-size:0.5em; opacity:0.8;">${theme.name}</span>`;
            overlay.style.display = 'flex';
            overlay.style.opacity = '1';
        }
    },

    hideLevelComplete() {
        const overlay = document.getElementById('levelCompleteOverlay');
        if (overlay) {
            overlay.style.display = 'none';
            overlay.style.opacity = '0';
        }
    },

    // --- Game Over ---
    showGameOver(platformCount, level) {
        document.getElementById('finalScore').textContent = platformCount;
        const levelReached = document.getElementById('finalLevel');
        if (levelReached) {
            const theme = LevelManager.getTheme(level);
            levelReached.textContent = `Nível ${level} — ${theme.name}`;
        }
        document.getElementById('gameOverBox').style.display = 'flex';
    },

    hideGameOver() {
        document.getElementById('gameOverBox').style.display = 'none';
    },

    // --- Inicialização de event listeners ---
    init() {
        const playBtn = document.getElementById('playBtn');
        if (playBtn) {
            playBtn.addEventListener('click', () => this.startGame());
        }

        const retryBtn = document.getElementById('retryBtn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                this.hideGameOver();
                if (this.onLevelSelected) this.onLevelSelected(LevelManager.currentLevel);
            });
        }

        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.hideGameOver();
                this.showLevelSelector();
            });
        }
    }
};
