// ===== CONTROLES DE TOQUE (zonas invisíveis) =====
// Segurar a metade esquerda/direita da tela → move o jogador.
// Toque rápido (qualquer lugar) → pulo.
// Deslizar para cima → arremessar item (fase do chefe).
// Escreve no objeto Input, exatamente como o teclado.

const TouchControls = {
    // Ajustes de sensibilidade
    TAP_MAX_MS: 180,      // toque mais curto que isso = pulo
    TAP_MAX_DIST: 15,     // e com deslocamento menor que isso (px)
    SWIPE_UP_MIN_DIST: 40, // deslizada p/ cima maior que isso = arremesso

    overlay: null,
    hint: null,
    pointers: new Map(), // pointerId -> { startX, startY, startTime, zone }

    isTouchDevice() {
        return window.matchMedia('(pointer: coarse)').matches;
    },

    init() {
        this.overlay = document.getElementById('touchOverlay');
        this.hint = document.getElementById('touchHint');
        if (!this.overlay || !this.isTouchDevice()) return;

        this.overlay.addEventListener('pointerdown', (e) => this.onPointerDown(e));
        this.overlay.addEventListener('pointermove', (e) => this.onPointerMove(e));
        this.overlay.addEventListener('pointerup', (e) => this.onPointerUp(e));
        this.overlay.addEventListener('pointercancel', (e) => this.onPointerCancel(e));
        this.overlay.addEventListener('contextmenu', (e) => e.preventDefault());
    },

    // Ligado/desligado pelo game_fixed.js no início/fim de cada fase,
    // para não roubar toques dos menus e overlays.
    setActive(isActive, isBossLevel) {
        if (!this.overlay || !this.isTouchDevice()) return;

        this.overlay.style.display = isActive ? 'block' : 'none';
        this.pointers.clear();
        this.syncMovement();

        if (isActive) {
            this.maybeShowHint(isBossLevel);
        } else {
            this.hideHint();
        }
    },

    zoneFor(x) {
        return x < window.innerWidth / 2 ? 'left' : 'right';
    },

    // Recalcula esquerda/direita a partir dos dedos na tela
    syncMovement() {
        let left = false;
        let right = false;

        this.pointers.forEach((p) => {
            if (p.zone === 'left') left = true;
            if (p.zone === 'right') right = true;
        });

        Input.left = left;
        Input.right = right;
    },

    onPointerDown(e) {
        e.preventDefault();
        this.pointers.set(e.pointerId, {
            startX: e.clientX,
            startY: e.clientY,
            startTime: performance.now(),
            zone: this.zoneFor(e.clientX),
        });
        this.syncMovement();
        this.hideHint();
    },

    onPointerMove(e) {
        const p = this.pointers.get(e.pointerId);
        if (!p) return;

        // Dedo cruzou o meio da tela: troca a direção
        const zone = this.zoneFor(e.clientX);
        if (zone !== p.zone) {
            p.zone = zone;
            this.syncMovement();
        }
    },

    onPointerUp(e) {
        const p = this.pointers.get(e.pointerId);
        if (!p) return;

        this.pointers.delete(e.pointerId);
        this.syncMovement();

        const duration = performance.now() - p.startTime;
        const dx = e.clientX - p.startX;
        const dy = e.clientY - p.startY;

        if (duration <= this.TAP_MAX_MS
            && Math.abs(dx) < this.TAP_MAX_DIST
            && Math.abs(dy) < this.TAP_MAX_DIST) {
            Input.queueJump();
        } else if (dy <= -this.SWIPE_UP_MIN_DIST) {
            Input.queueThrow();
        }
    },

    onPointerCancel(e) {
        this.pointers.delete(e.pointerId);
        this.syncMovement();
    },

    // --- Dica de primeira vez (uma para o jogo, outra para o chefe) ---
    HINT_KEY: 'maicon_touch_hint_shown',
    BOSS_HINT_KEY: 'maicon_touch_boss_hint_shown',

    maybeShowHint(isBossLevel) {
        if (!this.hint) return;

        const key = isBossLevel ? this.BOSS_HINT_KEY : this.HINT_KEY;
        try {
            if (localStorage.getItem(key) === '1') return;
            localStorage.setItem(key, '1');
        } catch (err) { /* localStorage indisponível — mostra mesmo assim */ }

        this.hint.innerHTML = isBossLevel
            ? '🪨 Pegue a pedra e <strong>deslize para cima</strong> para arremessar no chefe!'
            : '👆 <strong>Segure</strong> um lado da tela para mover<br>⚡ <strong>Toque rápido</strong> para pular';
        this.hint.style.display = 'block';

        clearTimeout(this._hintTimer);
        this._hintTimer = setTimeout(() => this.hideHint(), 5000);
    },

    hideHint() {
        if (this.hint) {
            this.hint.style.display = 'none';
        }
    },
};

document.addEventListener('DOMContentLoaded', () => TouchControls.init());
