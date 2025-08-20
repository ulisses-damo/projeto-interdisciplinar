const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let player;
let platforms = [];
let gravity = 0.5;
let isGameOver = false;
let shouldMoveScreen = false;

function init() {
    createPlatforms();
    const firstPlatform = platforms[0];
    player = new Player(
        firstPlatform.x + (firstPlatform.width / 2) - 25,
        firstPlatform.y - 50
    );
    isGameOver = false;
    requestAnimationFrame(gameLoop);
}

function createPlatforms() {
    platforms = [];
    const platformWidth = 100;
    const platformHeight = 20;
    const verticalGap = 130;
    const minHorizontalGap = 50;
    const maxHorizontalGap = 150;

    // Primeira plataforma centralizada
    let x = (canvas.width - platformWidth) / 2;
    let y = canvas.height - 40;
    platforms.push(new Platform(x, y, platformWidth, platformHeight, 'blue'));

    for (let i = 1; i < 10; i++) {
        // Gera deslocamento horizontal aleatório, mas sempre dentro do canvas
        let prevX = platforms[i - 1].x;
        let direction = Math.random() < 0.5 ? -1 : 1;
        let horizontalGap = minHorizontalGap + Math.random() * (maxHorizontalGap - minHorizontalGap);
        x = prevX + direction * horizontalGap;

        // Garante que a plataforma fique dentro da tela
        x = Math.max(0, Math.min(canvas.width - platformWidth, x));

        y = platforms[i - 1].y - verticalGap;

        platforms.push(new Platform(x, y, platformWidth, platformHeight, 'blue'));
    }
}

function gameLoop() {
    if (isGameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    update();
    render();
    requestAnimationFrame(gameLoop);
}

function update() {
    player.update();

    platforms.forEach((platform, index) => {
        if (detectCollision(player, platform)) {
            player.y = platform.y - player.height;
            player.velocityY = 0;
            player.isJumping = false;

            if (index === 2) {
                shouldMoveScreen = true;
            }
        }
        if (shouldMoveScreen) {
            platform.y += 1;
        }
        if (platform.y > canvas.height) {
            platform.y = -platform.height;
            platform.x = Math.random() * (canvas.width - platform.width);
        }
    });

    player.velocityY += gravity;

    if (player.y > canvas.height) {
        isGameOver = true;
        showGameOverBox();
        shouldMoveScreen = false;  
    }
}

Player.prototype.update = function() {
    this.x += this.velocityX;

    if (this.x < 0) this.x = 0;
    if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;

    this.y += this.velocityY;
    this.velocityY += gravity;

    if (this.velocityY > 10) this.velocityY = 10;
};

function render() {
    player.render(ctx);
    platforms.forEach(platform => platform.render(ctx));
}

window.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        player.jump();
    } else if (event.code === 'ArrowLeft') {
        player.velocityX = -3;
        player.facingLeft = true; 
    } else if (event.code === 'ArrowRight') {
        player.velocityX = 3;
        player.facingLeft = false;
    }
});

window.addEventListener('keyup', (event) => {
    if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
        player.velocityX = 0;
    }
});

document.getElementById('restartBtn').addEventListener('click', hideGameOverBox);

function showGameOverBox() {
    document.getElementById('gameOverBox').style.display = 'flex';
}

function hideGameOverBox() {
    document.getElementById('gameOverBox').style.display = 'none';
    init();
}

init();