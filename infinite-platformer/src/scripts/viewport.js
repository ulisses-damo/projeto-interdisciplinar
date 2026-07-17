// ===== ESCALA RESPONSIVA DO CANVAS =====
// O mundo do jogo continua em 800×600 (resolução interna do canvas);
// aqui apenas o TAMANHO EXIBIDO é ajustado via CSS para caber na tela,
// centralizado com letterbox. Em desktop a escala máxima é 1 (visual atual).

const Viewport = {
    GAME_WIDTH: 800,
    GAME_HEIGHT: 600,
    BORDER: 6, // 3px de borda de cada lado (game-layout.css)

    canvas: null,

    init(canvas) {
        this.canvas = canvas;
        window.addEventListener('resize', () => this.fit());
        window.addEventListener('orientationchange', () => this.fit());
        this.fit();
    },

    isTouchLayout() {
        return window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 900;
    },

    fit() {
        if (!this.canvas) return;

        const availW = window.innerWidth - this.BORDER;
        const availH = window.innerHeight - this.BORDER;
        let scale = Math.min(availW / this.GAME_WIDTH, availH / this.GAME_HEIGHT);

        // Desktop mantém o tamanho original; só reduz se a janela for pequena
        if (!this.isTouchLayout()) {
            scale = Math.min(scale, 1);
        }

        this.canvas.style.width = Math.floor(this.GAME_WIDTH * scale) + 'px';
        this.canvas.style.height = Math.floor(this.GAME_HEIGHT * scale) + 'px';
    },

    // Chamado a partir do clique em INICIAR (precisa de gesto do usuário).
    // Fullscreen e trava de orientação são "melhor esforço": se o navegador
    // negar (ex.: iOS Safari), o jogo segue funcionando normalmente.
    enterMobileFullscreen() {
        if (!this.isTouchLayout()) return;

        const root = document.documentElement;
        const request = root.requestFullscreen && root.requestFullscreen({ navigationUI: 'hide' });

        Promise.resolve(request)
            .catch(() => {})
            .then(() => {
                if (screen.orientation && screen.orientation.lock) {
                    return screen.orientation.lock('landscape').catch(() => {});
                }
            })
            .then(() => this.fit());
    },
};

document.addEventListener('DOMContentLoaded', () => {
    Viewport.init(document.getElementById('gameCanvas'));
});
