// ===== CONTROLES DE TOQUE (botões fixos) =====
// Setas ◀ ▶ no canto inferior esquerdo, pulo no direito e um botão de
// arremesso (🪨) que só aparece quando o jogador carrega um item na fase
// do chefe. Escrevem no objeto Input, exatamente como o teclado.

const TouchControls = {
    container: null,
    throwBtn: null,
    _throwAvailable: false,

    isTouchDevice() {
        return window.matchMedia('(pointer: coarse)').matches;
    },

    init() {
        this.container = document.getElementById('touchControls');
        this.throwBtn = document.getElementById('btnThrow');
        if (!this.container || !this.isTouchDevice()) return;

        this._bindHold(document.getElementById('btnLeft'), 'left');
        this._bindHold(document.getElementById('btnRight'), 'right');
        this._bindPress(document.getElementById('btnJump'), () => Input.queueJump());
        this._bindPress(this.throwBtn, () => Input.queueThrow());

        this.container.addEventListener('contextmenu', (e) => e.preventDefault());
    },

    // Botão de segurar: pressionado enquanto o dedo estiver nele.
    // A captura implícita de ponteiro do touch garante que o pointerup
    // chegue no botão mesmo se o dedo deslizar para fora.
    _bindHold(btn, direction) {
        if (!btn) return;

        const release = () => { Input[direction] = false; };

        btn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            Input[direction] = true;
        });
        btn.addEventListener('pointerup', release);
        btn.addEventListener('pointercancel', release);
    },

    // Botão de ação: dispara no apertar (mais responsivo que no soltar)
    _bindPress(btn, action) {
        if (!btn) return;

        btn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            action();
        });
    },

    // Ligado/desligado pelo game_fixed.js no início/fim de cada fase
    setActive(isActive) {
        if (!this.container || !this.isTouchDevice()) return;

        this.container.style.display = isActive ? 'block' : 'none';
        this.setThrowAvailable(false);
        Input.left = false;
        Input.right = false;
    },

    // Chamado a cada passo na fase do chefe com BossItemManager.carrying
    setThrowAvailable(available) {
        if (this._throwAvailable === available) return;

        this._throwAvailable = available;
        if (this.throwBtn) {
            this.throwBtn.classList.toggle('available', available);
        }
    },
};

document.addEventListener('DOMContentLoaded', () => TouchControls.init());
