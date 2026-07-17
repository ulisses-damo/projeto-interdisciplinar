// ===== ESTADO DE INPUT UNIFICADO =====
// Teclado (game_fixed.js) e toque (touchControls.js) escrevem aqui;
// o update() do jogo lê este estado a cada passo da simulação.
// Pulo e arremesso são "enfileirados" para não perder toques rápidos
// que acontecem entre dois passos.

const Input = {
    left: false,
    right: false,
    _jumpQueued: false,
    _throwQueued: false,

    queueJump() {
        this._jumpQueued = true;
    },

    queueThrow() {
        this._throwQueued = true;
    },

    consumeJump() {
        const queued = this._jumpQueued;
        this._jumpQueued = false;
        return queued;
    },

    consumeThrow() {
        const queued = this._throwQueued;
        this._throwQueued = false;
        return queued;
    },

    reset() {
        this.left = false;
        this.right = false;
        this._jumpQueued = false;
        this._throwQueued = false;
    },
};
