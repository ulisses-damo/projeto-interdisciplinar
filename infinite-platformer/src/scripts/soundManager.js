// ===== GERENCIADOR DE SOM =====
// Música de fundo por nível usando Howler.js

const SoundManager = {
    // Mapeamento de nível → arquivo de áudio
    tracks: {
        1: '../assets/sounds/the_mountain-soft-background-music-nivel1.mp3',
        2: '../assets/sounds/u_znsmzo40u2-fundo-rpg-nivel2.mp3',
        3: '../assets/sounds/alexgrohl-ignition-action-metal-nivel3.mp3',
        4: '../assets/sounds/sigmamusicart-halloween-trap-background-music-nivel4.mp3',
        5: '../assets/sounds/delosound-background-music-2-nivel5.mp3',
    },

    // Instâncias Howl carregadas
    _howls: {},

    // Nível tocando atualmente
    _currentLevel: null,

    // Volume global (0.0 a 1.0)
    volume: 0.4,

    // Pré-carrega todas as músicas
    init() {
        for (const [level, src] of Object.entries(this.tracks)) {
            this._howls[level] = new Howl({
                src: [src],
                loop: true,
                volume: this.volume,
                preload: true,
            });
        }
    },

    // Toca a música do nível (para a anterior se houver)
    play(level) {
        const lvl = String(level);

        // Se já está tocando este nível, não faz nada
        if (this._currentLevel === lvl && this._howls[lvl] && this._howls[lvl].playing()) {
            return;
        }

        // Parar qualquer música em andamento
        this.stop();

        // Tocar a nova
        if (this._howls[lvl]) {
            this._howls[lvl].play();
            this._currentLevel = lvl;
        }
    },

    // Para a música atual
    stop() {
        if (this._currentLevel && this._howls[this._currentLevel]) {
            this._howls[this._currentLevel].stop();
        }
        this._currentLevel = null;
    },

    // Pausa a música atual
    pause() {
        if (this._currentLevel && this._howls[this._currentLevel]) {
            this._howls[this._currentLevel].pause();
        }
    },

    // Retoma a música pausada
    resume() {
        if (this._currentLevel && this._howls[this._currentLevel]) {
            this._howls[this._currentLevel].play();
        }
    },

    // Ajusta o volume de todas as faixas
    setVolume(vol) {
        this.volume = vol;
        for (const howl of Object.values(this._howls)) {
            howl.volume(vol);
        }
    },
};
