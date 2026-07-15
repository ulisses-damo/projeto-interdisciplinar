// ===== ARENA DO CHEFE =====
// Layout fixo de plataformas para a luta do nível 5 (sem geração procedural)

const BossArena = {
    LAYOUT: [
        { x: 100, y: 560, width: 600, height: 20 }, // piso principal
        { x: 60,  y: 460, width: 150, height: 20 },
        { x: 590, y: 460, width: 150, height: 20 },
        { x: 325, y: 380, width: 150, height: 20 },
        { x: 100, y: 300, width: 140, height: 20 },
        { x: 560, y: 300, width: 140, height: 20 },
    ],

    build() {
        const color = LevelManager.getPlatformColor(5);
        return this.LAYOUT.map((spec, index) =>
            new Platform(spec.x, spec.y, spec.width, spec.height, color, index, 'normal')
        );
    },
};
