// ===== AS AVENTURAS DE MAICON - Game Loop Principal =====
// Orquestra os módulos: Camera, LevelManager, PlatformGenerator, UIManager

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let player;
let platforms = [];
let gravity = 0.4;
let isGameOver = false;
let isPlayerDying = false;
let platformCount = 0;
let visitedPlatforms = new Set();
let platformIdCounter = 0;

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function () {
    SoundManager.init();
    UIManager.init();
    StoryManager.init();
    UIManager.onLevelSelected = init;
});

function init(level) {
    LevelManager.currentLevel = level || 1;
    isGameOver = false;
    isPlayerDying = false;
    platformCount = 0;
    visitedPlatforms = new Set();
    platformIdCounter = 0;

    if (LevelManager.isBossLevel(LevelManager.currentLevel)) {
        initBossLevel();
        return;
    }

    UIManager.setBossHUDVisible(false);

    // Reset módulos
    Camera.reset(canvas.height, LevelManager.currentLevel);
    PlatformGenerator.reset();
    LavaManager.reset();
    PowerUpManager.reset();
    StarManager.reset(LevelManager.currentLevel);

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

    // Musica de fundo padrao
    SoundManager.play();

    // Esconder overlays
    UIManager.hideLevelSelector();
    UIManager.hideLevelComplete();
    UIManager.hideGameOver();

    Input.reset();
    TouchControls.setActive(true);
    resetLoopTiming();
    requestAnimationFrame(gameLoop);
}

// ===== NÍVEL DE CHEFE (Nível 5) =====
function initBossLevel() {
    UIManager.setBossHUDVisible(true);

    Camera.reset(canvas.height, LevelManager.currentLevel);
    PowerUpManager.reset();
    BossManager.reset();
    BossItemManager.reset();

    platforms = BossArena.build();

    const first = platforms[0];
    player = new Player(
        first.x + (first.width / 2) - 32,
        first.y - 64
    );

    LevelManager.applyTheme(LevelManager.currentLevel, canvas);
    LevelManager.updateLevelIndicator(LevelManager.currentLevel);

    SoundManager.playBossTrack();

    UIManager.hideLevelSelector();
    UIManager.hideLevelComplete();
    UIManager.hideGameOver();

    Input.reset();
    TouchControls.setActive(true, true);
    resetLoopTiming();
    requestAnimationFrame(gameLoop);
}

function handleBossVictory() {
    if (isGameOver) return;

    isGameOver = true;
    TouchControls.setActive(false);
    SoundManager.stop();
    UIManager.showLevelComplete(LevelManager.currentLevel, false);

    setTimeout(() => {
        UIManager.hideLevelComplete();
        UIManager.showLevelSelector();
    }, 4000);
}

function finalizeGameOver() {
    if (isGameOver) {
        return;
    }

    isPlayerDying = false;
    isGameOver = true;
    TouchControls.setActive(false);
    UIManager.showGameOver(platformCount, LevelManager.currentLevel);
}

function triggerPlayerDeath(useAnimation) {
    if (isGameOver || isPlayerDying) {
        return false;
    }

    SoundManager.stop();

    if (useAnimation && player) {
        isPlayerDying = true;
        player.startDeathAnimation();
        return false;
    }

    finalizeGameOver();
    return false;
}

function handlePlayerHit(onSurvive) {
    if (PowerUpManager.hasShield()) {
        if (typeof onSurvive === 'function') onSurvive();
        return true;
    }

    if (PowerUpManager.useExtraLife()) {
        if (typeof onSurvive === 'function') onSurvive();
        return true;
    }

    triggerPlayerDeath(true);
    return false;
}

// ===== GAME LOOP =====
// Passo fixo com acumulador: a física roda sempre em passos de 1/60s,
// independente da taxa de atualização da tela (60/90/120 Hz).
const STEP_MS = 1000 / 60;
const MAX_STEPS_PER_FRAME = 5;
let loopLastTime = 0;
let loopAccumulator = 0;

function resetLoopTiming() {
    loopLastTime = 0;
    loopAccumulator = 0;
}

function gameLoop(timestamp) {
    if (isGameOver) return;

    if (!loopLastTime) loopLastTime = timestamp;
    loopAccumulator += timestamp - loopLastTime;
    loopLastTime = timestamp;

    // Evita rajada de passos após pausas longas (troca de aba, etc.)
    if (loopAccumulator > STEP_MS * MAX_STEPS_PER_FRAME) {
        loopAccumulator = STEP_MS * MAX_STEPS_PER_FRAME;
    }

    while (loopAccumulator >= STEP_MS && !isGameOver) {
        update();
        loopAccumulator -= STEP_MS;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    render();
    requestAnimationFrame(gameLoop);
}

// Pausa em segundo plano: zera o relógio ao voltar e pausa/retoma a música
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        SoundManager.pauseAll();
    } else {
        resetLoopTiming();
        SoundManager.resumeAll();
    }
});

// ===== UPDATE =====
function update() {
    if (LevelManager.isBossLevel(LevelManager.currentLevel)) {
        updateBossLevel();
        return;
    }

    if (isPlayerDying) {
        player.updateAnimation();

        if (player.isDeathAnimationComplete()) {
            finalizeGameOver();
        }

        return;
    }

    // --- Movimento do jogador ---
    applyInput();
    player.x += player.velocityX;
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    player.y += player.velocityY;
    if (player.velocityY > 12) player.velocityY = 12;

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

            if (typeof plat.isSpiked === 'function' && plat.isSpiked()) {
                const survived = handlePlayerHit(() => {
                    player.y = landingY - player.height - 2;
                    player.velocityY = -7;
                    player.isJumping = true;
                });

                if (!survived) return;
                continue;
            }

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

                    TouchControls.setActive(false);

                    // Parar música ao completar nível
                    SoundManager.stop();

                    if (lvl < LevelManager.MAX_LEVEL) {
                        LevelManager.unlockLevel(lvl + 1);
                    }

                    UIManager.showLevelComplete(lvl, StarManager.hasCollectedAll());
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

    // --- Estrelas bônus ---
    StarManager.update(
        LevelManager.currentLevel,
        platforms,
        player,
        Camera.y,
        canvas.height,
        platformCount
    );
    StarManager.checkPickup(player);

    // --- Power-ups (nível 3+) ---
    PowerUpManager.update(LevelManager.currentLevel, platforms, canvas.width, Camera.y, canvas.height);
    PowerUpManager.checkPickup(player);

    // --- Gotas de lava (nível 3+) ---
    LavaManager.update(LevelManager.currentLevel, canvas.width, canvas.height, Camera.y);
    if (LavaManager.checkCollision(player)) {
        const survived = handlePlayerHit(() => {
            // Remove as gotas que colidiram para feedback visual
            LavaManager.drops = LavaManager.drops.filter(drop => {
                const dx = drop.x - (player.x + player.width / 2);
                const dy = drop.y - (player.y + player.height / 2);
                return Math.sqrt(dx * dx + dy * dy) >= 28 + drop.size;
            });
        });

        if (!survived) return;
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

    player.updateAnimation();

    // --- Game Over ---
    if (Camera.isPlayerDead(player, canvas.height)) {
        triggerPlayerDeath(false);
    }
}

function updateBossLevel() {
    if (isPlayerDying) {
        player.updateAnimation();

        if (player.isDeathAnimationComplete()) {
            finalizeGameOver();
        }

        return;
    }

    // --- Movimento do jogador ---
    applyInput();
    player.x += player.velocityX;
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    player.y += player.velocityY;
    if (player.velocityY > 12) player.velocityY = 12;

    // --- Colisão com plataformas fixas da arena ---
    for (let i = 0; i < platforms.length; i++) {
        const plat = platforms[i];

        if (detectCollision(player, plat)) {
            player.y = plat.y - player.height;
            player.velocityY = 0;
            player.isJumping = false;
        }
    }

    // --- Gravidade ---
    player.velocityY += gravity;

    // --- Chefe: ataques, arremessos do jogador, dano ---
    BossManager.update(canvas.width, canvas.height);
    BossItemManager.update(canvas.width, canvas.height);
    BossItemManager.checkPickup(player);
    BossItemManager.checkBossHit(BossManager);

    if (BossManager.checkCollision(player)) {
        const survived = handlePlayerHit(() => {
            BossManager.clearNearbyMeteors(player);
        });

        if (!survived) return;
    }

    player.updateAnimation();

    // --- Vitória ---
    if (BossManager.isDefeated()) {
        handleBossVictory();
        return;
    }

    // --- Queda fora da arena ---
    if (Camera.isPlayerDead(player, canvas.height)) {
        triggerPlayerDeath(false);
    }
}

// ===== RENDER =====
function render() {
    if (LevelManager.isBossLevel(LevelManager.currentLevel)) {
        renderBossLevel();
        return;
    }

    ctx.save();
    ctx.translate(0, -Camera.y);

    // Plataformas visíveis
    for (let i = 0; i < platforms.length; i++) {
        if (Camera.isVisible(platforms[i].y, canvas.height)) {
            platforms[i].render(ctx);
        }
    }

    // Estrelas bônus no mundo
    StarManager.render(ctx);

    // Power-ups no mundo
    PowerUpManager.render(ctx);

    // Jogador
    player.render(ctx);

    // Efeito visual do poder ativo no jogador
    if (!player.isDying) {
        PowerUpManager.renderPlayerEffect(ctx, player);
    }

    // Gotas de lava (nível 3+)
    LavaManager.render(ctx, canvas.height, Camera.y);

    ctx.restore();
}

function renderBossLevel() {
    ctx.save();

    for (let i = 0; i < platforms.length; i++) {
        platforms[i].render(ctx);
    }

    BossManager.render(ctx);
    BossItemManager.render(ctx);
    player.render(ctx);
    BossItemManager.renderCarriedItem(ctx, player);

    ctx.restore();
}

// ===== INPUT =====
// Teclado e toque (touchControls.js) escrevem no objeto Input;
// applyInput() traduz esse estado para o player a cada passo do update.
function applyInput() {
    if (Input.left && !Input.right) {
        player.velocityX = -3;
        player.facingLeft = true;
    } else if (Input.right && !Input.left) {
        player.velocityX = 3;
        player.facingLeft = false;
    } else {
        player.velocityX = 0;
    }

    if (Input.consumeJump()) {
        if (!player.isJumping) {
            player.jump();
            player._doubleJumpUsed = false;
        } else if (PowerUpManager.hasDoubleJump() && !player._doubleJumpUsed) {
            // Pulo duplo!
            player.velocityY = -10;
            player._doubleJumpUsed = true;
        }
    }

    if (Input.consumeThrow() && LevelManager.isBossLevel(LevelManager.currentLevel)) {
        BossItemManager.throwItem(player);
    }
}

window.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        event.preventDefault();
        Input.queueJump();
    } else if (event.code === 'ArrowLeft') {
        Input.left = true;
    } else if (event.code === 'ArrowRight') {
        Input.right = true;
    } else if (event.code === 'ArrowUp') {
        event.preventDefault();
        Input.queueThrow();
    }
});

window.addEventListener('keyup', (event) => {
    if (event.code === 'ArrowLeft') {
        Input.left = false;
    } else if (event.code === 'ArrowRight') {
        Input.right = false;
    }
});
