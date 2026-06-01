// ===== GERENCIADOR DE SOM =====
// Musica de fundo padrao usando Howler.js

const SoundManager = {
    defaultTrack: '../assets/sounds/the_mountain-soft-background-music-nivel1.mp3',

    _backgroundTrack: null,

    volume: 0.4,

    init() {
        this._backgroundTrack = new Howl({
            src: [this.defaultTrack],
            loop: true,
            volume: this.volume,
            preload: true,
        });
    },

    play() {
        if (!this._backgroundTrack) {
            return;
        }

        if (!this._backgroundTrack.playing()) {
            this._backgroundTrack.play();
        }
    },

    stop() {
        if (this._backgroundTrack) {
            this._backgroundTrack.stop();
        }
    },

    pause() {
        if (this._backgroundTrack && this._backgroundTrack.playing()) {
            this._backgroundTrack.pause();
        }
    },

    resume() {
        if (this._backgroundTrack && !this._backgroundTrack.playing()) {
            this._backgroundTrack.play();
        }
    },

    setVolume(vol) {
        this.volume = vol;
        if (this._backgroundTrack) {
            this._backgroundTrack.volume(vol);
        }
    },
};
