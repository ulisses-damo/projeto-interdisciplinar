// ===== AS AVENTURAS DE MAICON - Game Loop Principal =====
// Orquestra os módulos: Camera, LevelManager, PlatformGenerator, UIManager

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let player;
let platforms = [];
let gravity = 0.4;
let isGameOver = false;
let platformCount = 0;
let visitedPlatforms = new Set();
let platformIdCounter = 0;

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function () {
    SoundManager.init();
    UIManager.init();
    UIManager.onLevelSelected = init;
});

function init(level) {
    LevelManager.currentLevel = level || 1;
    isGameOver = false;
    platformCount = 0;
    visitedPlatforms = new Set();
    platformIdCounter = 0;

    // Reset módulos
    Camera.reset(canvas.height, LevelManager.currentLevel);
    PlatformGenerator.reset();
    LavaManager.reset();
    PowerUpManager.reset();

    // Criar plataformas
    const result = PlatformGenerator.createInitial(canvas.width, canvas.height, LevelManager.currentLevel);
    platforms = result.platforms;
    platformIdCounter = result.nextId;

    // Posicionar jogador na primeira plataforma
    const first = platforms[0];
    player = new Player(
        first.x + (first.width / 2) - 32,
        first.y - 64
    );

    // Aplicar tema visual
    LevelManager.applyTheme(LevelManager.currentLevel, canvas);
    LevelManager.updateHUD(0);
    LevelManager.updateLevelIndicator(LevelManager.currentLevel);

    // Música de fundo do nível
    SoundManager.play(LevelManager.currentLevel);

    // Esconder overlays
    UIManager.hideLevelSelector();
    UIManager.hideLevelComplete();

    requestAnimationFrame(gameLoop);
}

// ===== GAME LOOP =====
function gameLoop() {
    if (isGameOver) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// ===== UPDATE =====
function update() {
    // --- Movimento do jogador ---
    player.x += player.velocityX;
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    player.y += player.velocityY;
    if (player.velocityY > 12) player.velocityY = 12;

    // --- Animação do sprite ---
    player.frameCounter = player.frameCounter || 0;
    player.frameCounter++;
    if (player.frameCounter >= player.frameDelay) {
        player.frameCounter = 0;
        player.currentFrame = (player.currentFrame + 1) % player.totalFrames;
    }

    // --- Colisão com plataformas ---
    for (let i = 0; i < platforms.length; i++) {
        const plat = platforms[i];

        if (plat.type === 'crumbling') plat.updateCrumble();
        if (plat.isFalling) continue;

        if (detectCollision(player, plat)) {
            const feetX = clamp(player.x + player.width / 2, plat.x, plat.x + plat.width);
            const landingY = typeof plat.getSurfaceYAt === 'function'
                ? plat.getSurfaceYAt(feetX)
                : plat.y;

            player.y = landingY - player.height;
            player.velocityY = 0;
            player.isJumping = false;

            if (plat.isSlippery()) {
                player.x = clamp(player.x + plat.getSlideVelocity(), 0, canvas.width - player.width);
            }

            // Iniciar desmoronamento
            if (plat.type === 'crumbling' && !plat.crumbleStarted) {
                plat.startCrumble();
            }

            // Plataforma nova visitada
            if (!visitedPlatforms.has(plat.id)) {
                visitedPlatforms.add(plat.id);
                platformCount = visitedPlatforms.size;

                // Conclusão de nível?
                if (platformCount >= LevelManager.getPlatformsForLevel(LevelManager.currentLevel)) {
                    isGameOver = true;
                    const lvl = LevelManager.currentLevel;

                    // Parar música ao completar nível
                    SoundManager.stop();

                    if (lvl < LevelManager.MAX_LEVEL) {
                        LevelManager.unlockLevel(lvl + 1);
                    }

                    UIManager.showLevelComplete(lvl);
                    setTimeout(() => {
                        UIManager.hideLevelComplete();
                        UIManager.showLevelSelector();
                    }, 3000);
                    return;
                }

                LevelManager.updateHUD(platformCount);
            }
        }
    }

    // --- Gravidade ---
    player.velocityY += gravity;

    // --- Câmera ---
    Camera.update(player.y);

    // --- Power-ups (nível 3+) ---
    PowerUpManager.update(LevelManager.currentLevel, platforms, canvas.width, Camera.y, canvas.height);
    PowerUpManager.checkPickup(player);

    // --- Gotas de lava (nível 3+) ---
    LavaManager.update(LevelManager.currentLevel, canvas.width, canvas.height, Camera.y);
    if (LavaManager.checkCollision(player)) {
        // Escudo ativo? Ignorar hit
        if (PowerUpManager.hasShield()) {
            // Remove as gotas que colidiram para feedback visual
            LavaManager.drops = LavaManager.drops.filter(drop => {
                const dx = drop.x - (player.x + player.width / 2);
                const dy = drop.y - (player.y + player.height / 2);
                return Math.sqrt(dx * dx + dy * dy) >= 28 + drop.size;
            });
        } else if (PowerUpManager.useExtraLife()) {
            // Vida extra consumida — sobrevive mas remove gotas próximas
            LavaManager.drops = LavaManager.drops.filter(drop => {
                const dx = drop.x - (player.x + player.width / 2);
                const dy = drop.y - (player.y + player.height / 2);
                return Math.sqrt(dx * dx + dy * dy) >= 28 + drop.size;
            });
        } else {
            isGameOver = true;
            SoundManager.stop();
            UIManager.showGameOver(platformCount, LevelManager.currentLevel);
            return;
        }
    }

    // --- Reposicionar plataformas que saíram por baixo ---
    for (let i = 0; i < platforms.length; i++) {
        if (Camera.shouldRecycle(platforms[i].y, canvas.height)) {
            platformIdCounter = PlatformGenerator.reposition(
                platforms[i], platforms, canvas.width, LevelManager.currentLevel, platformIdCounter
            );
        }
    }

    platformIdCounter = PlatformGenerator.ensureBuffer(
        platforms,
        canvas.width,
        canvas.height,
        LevelManager.currentLevel,
        platformIdCounter,
        player
    );

    // --- Game Over ---
    if (Camera.isPlayerDead(player, canvas.height)) {
        isGameOver = true;
        SoundManager.stop();
        UIManager.showGameOver(platformCount, LevelManager.currentLevel);
    }
}

// ===== RENDER =====
function render() {
    ctx.save();
    ctx.translate(0, -Camera.y);

    // Plataformas visíveis
    for (let i = 0; i < platforms.length; i++) {
        if (Camera.isVisible(platforms[i].y, canvas.height)) {
            platforms[i].render(ctx);
        }
    }

    // Power-ups no mundo
    PowerUpManager.render(ctx);

    // Jogador
    player.render(ctx);

    // Efeito visual do poder ativo no jogador
    PowerUpManager.renderPlayerEffect(ctx, player);

    // Gotas de lava (nível 3+)
    LavaManager.render(ctx, canvas.height, Camera.y);

    ctx.restore();
}

// ===== INPUT =====
window.addEventListener('keydown', (event) => {
    if (!player) return;
    if (event.code === 'Space') {
        if (!player.isJumping) {
            player.jump();
            player._doubleJumpUsed = false;
        } else if (PowerUpManager.hasDoubleJump() && !player._doubleJumpUsed) {
            // Pulo duplo!
            player.velocityY = -10;
            player._doubleJumpUsed = true;
        }
    } else if (event.code === 'ArrowLeft') {
        player.velocityX = -3;
        player.facingLeft = true;
    } else if (event.code === 'ArrowRight') {
        player.velocityX = 3;
        player.facingLeft = false;
    }
});

window.addEventListener('keyup', (event) => {
    if (!player) return;
    if (event.code === 'ArrowLeft' && player.velocityX < 0) {
        player.velocityX = 0;
    } else if (event.code === 'ArrowRight' && player.velocityX > 0) {
        player.velocityX = 0;
    }
});
