const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let player;
let platforms = [];
let gravity = 0.5;
let isGameOver = false;
let shouldMoveScreen = false;
let currentLevel = 0;
let visitedPlatforms = new Set();
let platformIdCounter = 0;

function init() {
    createPlatforms();
    const firstPlatform = platforms[0];
    player = new Player(
        firstPlatform.x + (firstPlatform.width / 2) - 25,
        firstPlatform.y - 50
    );
    isGameOver = false;
    currentLevel = 0;
    visitedPlatforms = new Set();
    platformIdCounter = 0;
    requestAnimationFrame(gameLoop);
}

function createPlatforms() {
    platforms = [];
    const platformWidth = 100;
    const platformHeight = 20;
    const verticalGap = 130;
    
  
    const playerHorizontalSpeed = 3;
    const jumpInitialVelocity = 15;
    const gravity = 0.5;
    
    const timeInAir = Math.sqrt(2 * verticalGap / gravity) + (jumpInitialVelocity / gravity);
    const maxHorizontalReach = playerHorizontalSpeed * timeInAir * 0.8; 
    
    const minHorizontalGap = 20; // Distância mínima para não sobrepor
    const maxHorizontalGap = Math.min(maxHorizontalReach, 140); // Máximo alcançável

    let x = (canvas.width - platformWidth) / 2;
    let y = canvas.height - 40;
    platforms.push(new Platform(x, y, platformWidth, platformHeight, 'blue', platformIdCounter++));

    for (let i = 1; i < 10; i++) {
        // Gera deslocamento horizontal baseado no alcance do jogador
        let prevX = platforms[i - 1].x;
        let prevCenterX = prevX + platformWidth / 2;
        
        // Calcula a distância horizontal possível
        let direction = Math.random() < 0.5 ? -1 : 1;
        let horizontalGap = minHorizontalGap + Math.random() * (maxHorizontalGap - minHorizontalGap);
        
        let newCenterX = prevCenterX + direction * horizontalGap;
        x = newCenterX - platformWidth / 2;

        // Garante que a plataforma fique dentro da tela e seja alcançável
        x = Math.max(0, Math.min(canvas.width - platformWidth, x));
        
        // Verifica se a distância ainda é alcançável após o ajuste
        let finalCenterX = x + platformWidth / 2;
        let actualDistance = Math.abs(finalCenterX - prevCenterX);
        
        // Se a distância ficou muito grande após o ajuste, reposiciona
        if (actualDistance > maxHorizontalGap) {
            if (finalCenterX > prevCenterX) {
                // Muito à direita, move para a esquerda
                x = Math.max(0, prevCenterX - maxHorizontalGap - platformWidth / 2);
            } else {
                // Muito à esquerda, move para a direita
                x = Math.min(canvas.width - platformWidth, prevCenterX + maxHorizontalGap - platformWidth / 2);
            }
        }

        y = platforms[i - 1].y - verticalGap;

        platforms.push(new Platform(x, y, platformWidth, platformHeight, 'blue', platformIdCounter++));
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

            // Incrementa o nível baseado no número de plataformas únicas visitadas
            if (!visitedPlatforms.has(platform.id)) {
                visitedPlatforms.add(platform.id);
                currentLevel = visitedPlatforms.size;
            }

            if (index === 2) {
                shouldMoveScreen = true;
            }
        }
        if (shouldMoveScreen) {
            platform.y += 1;
        }
        if (platform.y > canvas.height) {
            platform.y = -platform.height;
            
            // Lógica inteligente para reposicionamento horizontal
            // Encontra uma plataforma de referência próxima ao topo
            let referencePlatform = null;
            let minY = Infinity;
            
            platforms.forEach((otherPlatform) => {
                if (otherPlatform !== platform && otherPlatform.y < minY && otherPlatform.y < canvas.height * 0.3) {
                    minY = otherPlatform.y;
                    referencePlatform = otherPlatform;
                }
            });
            
            if (referencePlatform) {
                // Posiciona em relação à plataforma de referência
                const playerHorizontalSpeed = 3;
                const jumpInitialVelocity = 15;
                const gravity = 0.5;
                const verticalGap = 130;
                const timeInAir = Math.sqrt(2 * verticalGap / gravity) + (jumpInitialVelocity / gravity);
                const maxHorizontalReach = playerHorizontalSpeed * timeInAir * 0.8;
                
                const minHorizontalGap = 20;
                const maxHorizontalGap = Math.min(maxHorizontalReach, 140);
                
                const refCenterX = referencePlatform.x + referencePlatform.width / 2;
                const direction = Math.random() < 0.5 ? -1 : 1;
                const horizontalGap = minHorizontalGap + Math.random() * (maxHorizontalGap - minHorizontalGap);
                
                let newCenterX = refCenterX + direction * horizontalGap;
                let newX = newCenterX - platform.width / 2;
                
                // Garante que fique dentro da tela
                newX = Math.max(0, Math.min(canvas.width - platform.width, newX));
                
                // Verifica se ainda é alcançável após ajuste
                let finalCenterX = newX + platform.width / 2;
                let actualDistance = Math.abs(finalCenterX - refCenterX);
                
                if (actualDistance > maxHorizontalGap) {
                    if (finalCenterX > refCenterX) {
                        newX = Math.max(0, refCenterX - maxHorizontalGap - platform.width / 2);
                    } else {
                        newX = Math.min(canvas.width - platform.width, refCenterX + maxHorizontalGap - platform.width / 2);
                    }
                }
                
                platform.x = newX;
            } else {
                // Fallback: posicionamento aleatório seguro
                platform.x = Math.random() * (canvas.width - platform.width);
            }
            
            // Gera novo ID para a plataforma reposicionada
            platform.id = platformIdCounter++;
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
    drawLevelCounter();
}

function drawLevelCounter() {
    ctx.save();
    
    ctx.font = 'bold 24px Arial';
    const text = `Plataformas: ${currentLevel}`;
    const textWidth = ctx.measureText(text).width;
    const textHeight = 24;

    //contador
    const padding = 15;
    const x = canvas.width - textWidth - padding * 2;
    const y = padding;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x - padding, y, textWidth + padding * 2, textHeight + padding);
    
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - padding, y, textWidth + padding * 2, textHeight + padding);
    
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, x, y + textHeight);
    
    ctx.restore();
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