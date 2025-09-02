const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let player;
let platforms = [];
let gravity = 0.5;
let isGameOver = false;
let shouldMoveScreen = false;
let currentLevel = 1;
let visitedPlatforms = new Set();
let platformIdCounter = 0;
let gameStarted = false;

// Função para iniciar o jogo
function startGame() {
    const startScreen = document.getElementById('startScreen');
    const gameScreen = document.getElementById('gameScreen');
    
    // Transição suave
    startScreen.style.transition = 'opacity 0.5s ease-out';
    startScreen.style.opacity = '0';
    
    setTimeout(() => {
        startScreen.style.display = 'none';
        gameScreen.style.display = 'block';
        gameScreen.style.opacity = '0';
        gameScreen.style.transition = 'opacity 0.5s ease-in';
        
        setTimeout(() => {
            gameScreen.style.opacity = '1';
            init();
            gameStarted = true;
        }, 50);
    }, 500);
}

// Event listener para o botão Play
document.addEventListener('DOMContentLoaded', function() {
    const playBtn = document.getElementById('playBtn');
    playBtn.addEventListener('click', startGame);
    
    // Remove o listener de Enter para evitar iniciar acidentalmente
    // A tela inicial agora só aparece na primeira vez ou refresh da página
});

function init() {
    createPlatforms();
    const firstPlatform = platforms[0];
    player = new Player(
        firstPlatform.x + (firstPlatform.width / 2) - 25,
        firstPlatform.y - 50
    );
    isGameOver = false;
    currentLevel = 1;
    visitedPlatforms = new Set();
    platformIdCounter = 0;
    requestAnimationFrame(gameLoop);
}

function createPlatforms() {
    platforms = [];
    const platformWidth = 100;
    const platformHeight = 20;
    const verticalGap = 140; // Aumentado para mais espaçamento
    const maxHorizontalDistance = 100; // Distância máxima segura
    
    // Primeira plataforma centralizada
    let x = (canvas.width - platformWidth) / 2;
    let y = canvas.height - 40;
    platforms.push(new Platform(x, y, platformWidth, platformHeight, 'blue', platformIdCounter++));

    // Criar plataformas com garantia de alcançabilidade
    for (let i = 1; i < 12; i++) { // Reduzido para 12 plataformas
        let prevPlatform = platforms[i - 1];
        let validPosition = false;
        let attempts = 0;
        
        while (!validPosition && attempts < 30) { // Mais tentativas
            // Direção aleatória mas com preferência para ficar próximo ao centro
            let prevCenterX = prevPlatform.x + prevPlatform.width / 2;
            let canvasCenter = canvas.width / 2;
            
            // Se está muito longe do centro, tende a voltar
            let direction;
            if (prevCenterX < canvasCenter * 0.4) {
                direction = 1; // Vai para direita
            } else if (prevCenterX > canvasCenter * 1.6) {
                direction = -1; // Vai para esquerda
            } else {
                direction = Math.random() < 0.5 ? -1 : 1;
            }
            
            // Distância horizontal mínima aumentada
            let horizontalDistance = 50 + Math.random() * 60; // Entre 50 e 110 pixels
            
            let newCenterX = prevCenterX + direction * horizontalDistance;
            x = newCenterX - platformWidth / 2;
            
            // Garante que fique dentro da tela com margem maior
            x = Math.max(80, Math.min(canvas.width - platformWidth - 80, x));
            y = prevPlatform.y - verticalGap;
            
            // Verifica se não há colisão
            validPosition = true;
            for (let j = 0; j < platforms.length; j++) {
                if (checkPlatformCollision(x, y, platformWidth, platformHeight, platforms[j])) {
                    validPosition = false;
                    break;
                }
            }
            
            // Verifica se a distância final é alcançável
            let finalCenterX = x + platformWidth / 2;
            let actualDistance = Math.abs(finalCenterX - prevCenterX);
            if (actualDistance > maxHorizontalDistance) {
                validPosition = false;
            }
            
            attempts++;
        }
        
        // Se não conseguiu posição válida, força uma posição muito segura
        if (!validPosition) {
            let prevCenterX = prevPlatform.x + prevPlatform.width / 2;
            // Posição mais conservadora
            if (prevCenterX < canvas.width / 2) {
                x = prevCenterX + 80; // Vai para direita
            } else {
                x = prevCenterX - 80 - platformWidth; // Vai para esquerda
            }
            x = Math.max(80, Math.min(canvas.width - platformWidth - 80, x));
            y = prevPlatform.y - verticalGap;
        }

        platforms.push(new Platform(x, y, platformWidth, platformHeight, 'blue', platformIdCounter++));
    }
}

function checkPlatformCollision(x1, y1, width1, height1, platform2) {
    const horizontalMargin = 30; // Margem horizontal aumentada
    const verticalMargin = 30;   // Margem vertical aumentada
    return (
        x1 < platform2.x + platform2.width + horizontalMargin &&
        x1 + width1 > platform2.x - horizontalMargin &&
        y1 < platform2.y + platform2.height + verticalMargin &&
        y1 + height1 > platform2.y - verticalMargin
    );
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
            // Sistema de reposicionamento inteligente
            repositionPlatform(platform);
        }
    });

    player.velocityY += gravity;

    if (player.y > canvas.height) {
        isGameOver = true;
        showGameOverBox();
        shouldMoveScreen = false;  
    }
}

function repositionPlatform(platform) {
    // Encontra a plataforma mais próxima do topo para usar como referência
    let referencePlatform = null;
    let highestY = canvas.height;
    
    platforms.forEach((otherPlatform) => {
        if (otherPlatform !== platform && otherPlatform.y < highestY && otherPlatform.y > -200) {
            highestY = otherPlatform.y;
            referencePlatform = otherPlatform;
        }
    });
    
    let validPosition = false;
    let attempts = 0;
    
    while (!validPosition && attempts < 20) {
        if (referencePlatform) {
            // Posiciona baseado na plataforma de referência
            let refCenterX = referencePlatform.x + referencePlatform.width / 2;
            let direction = Math.random() < 0.5 ? -1 : 1;
            let distance = 60 + Math.random() * 50; // Entre 60 e 110 pixels
            
            let newCenterX = refCenterX + direction * distance;
            platform.x = newCenterX - platform.width / 2;
            
            // Garante que fique dentro da tela
            platform.x = Math.max(80, Math.min(canvas.width - platform.width - 80, platform.x));
            
            // Posiciona bem acima da referência
            platform.y = referencePlatform.y - 140 - Math.random() * 100;
        } else {
            // Fallback: posicionamento aleatório seguro
            platform.x = 100 + Math.random() * (canvas.width - 300);
            platform.y = -platform.height - Math.random() * 200;
        }
        
        // Verifica se não há colisão com outras plataformas
        validPosition = true;
        for (let otherPlatform of platforms) {
            if (otherPlatform !== platform && 
                checkPlatformCollision(platform.x, platform.y, platform.width, platform.height, otherPlatform)) {
                validPosition = false;
                break;
            }
        }
        
        attempts++;
    }
    
    // Se ainda não conseguiu, força uma posição muito alta e segura
    if (!validPosition) {
        platform.x = canvas.width / 2 - platform.width / 2;
        platform.y = -300 - Math.random() * 100;
    }
    
    // Gera novo ID
    platform.id = platformIdCounter++;
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
    
    // Configurações do texto
    ctx.font = 'bold 24px Arial';
    const text = `Plataformas: ${currentLevel}`;
    const textWidth = ctx.measureText(text).width;
    const textHeight = 24;
    
    // Posição do contador (canto superior direito com margem)
    const padding = 15;
    const x = canvas.width - textWidth - padding * 2;
    const y = padding;
    
    // Desenha o fundo do contador
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x - padding, y, textWidth + padding * 2, textHeight + padding);
    
    // Desenha a borda
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - padding, y, textWidth + padding * 2, textHeight + padding);
    
    // Desenha o texto
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
    document.getElementById('finalScore').textContent = currentLevel;
    document.getElementById('gameOverBox').style.display = 'flex';
}

function hideGameOverBox() {
    document.getElementById('gameOverBox').style.display = 'none';
    init(); // Apenas reinicia o jogo sem voltar à tela inicial
}

// O jogo não inicia automaticamente mais - apenas quando o usuário clicar em PLAY
