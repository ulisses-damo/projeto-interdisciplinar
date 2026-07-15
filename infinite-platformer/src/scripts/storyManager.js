// ===== CARDS DE HISTÓRIA =====
// Introdução narrativa exibida sempre que o jogador clica em "Iniciar"

const StoryManager = {
    CARDS: [
        { title: 'Vila Tranquila', text: 'Em uma vila pacata, Maicon vivia feliz ao lado da Princesa Lumi.', art: 'village', emoji: '🏡' },
        { title: 'O Sequestro', text: 'Um dia, o temido Chefe Meteoro desceu dos céus e raptou a princesa!', art: 'kidnap', emoji: '👑' },
        { title: 'A Jornada Começa', text: 'Destemido, Maicon parte em uma jornada para resgatá-la.', art: 'journey', emoji: '🏃' },
        { title: 'Através dos Reinos', text: 'Ele atravessa o Céu Azul, o Deserto e o Vulcão, enfrentando perigos a cada passo...', art: 'realms', emoji: '🌋' },
        { title: 'A Noite Antes da Batalha', text: 'Sob o céu estrelado, Maicon segue firme rumo ao topo do mundo.', art: 'night', emoji: '🌙' },
        { title: 'O Confronto Final', text: 'No topo da Galáxia, o Chefe Meteoro o aguarda. Chegou a hora de salvar a princesa!', art: 'battle', emoji: '☄️' },
    ],

    currentIndex: 0,
    onComplete: null,

    init() {
        const nextBtn = document.getElementById('storyNextBtn');
        const skipBtn = document.getElementById('storySkipBtn');
        if (nextBtn) nextBtn.addEventListener('click', () => this.next());
        if (skipBtn) skipBtn.addEventListener('click', () => this.skip());
    },

    show(onComplete) {
        this.currentIndex = 0;
        this.onComplete = onComplete;
        this._render();

        const screen = document.getElementById('storyScreen');
        if (screen) screen.style.display = 'flex';
    },

    next() {
        this.currentIndex++;
        if (this.currentIndex >= this.CARDS.length) {
            this._finish();
        } else {
            this._render();
        }
    },

    skip() {
        this._finish();
    },

    _finish() {
        const screen = document.getElementById('storyScreen');
        if (screen) screen.style.display = 'none';

        const callback = this.onComplete;
        this.onComplete = null;
        if (callback) callback();
    },

    _render() {
        const card = this.CARDS[this.currentIndex];

        const art = document.getElementById('storyCardArt');
        const title = document.getElementById('storyCardTitle');
        const text = document.getElementById('storyCardText');
        const nextBtn = document.getElementById('storyNextBtn');
        const dots = document.getElementById('storyDots');

        if (art) {
            art.className = `story-art art-${card.art}`;
            art.textContent = card.emoji;
        }
        if (title) title.textContent = card.title;
        if (text) text.textContent = card.text;
        if (nextBtn) {
            const isLast = this.currentIndex === this.CARDS.length - 1;
            nextBtn.textContent = isLast ? 'Começar Aventura ▶' : 'Avançar ▶';
        }

        if (dots) {
            dots.innerHTML = '';
            this.CARDS.forEach((_, index) => {
                const dot = document.createElement('span');
                dot.className = 'story-dot' + (index === this.currentIndex ? ' active' : '');
                dots.appendChild(dot);
            });
        }
    },
};
