
const spriteSheet = new Image();
spriteSheet.src = '../assets/LULI.png';

let spriteLoaded = false;
spriteSheet.onload = function() {
    spriteLoaded = true;
};
spriteSheet.onerror = function() {
    console.error('Erro ao carregar o sprite! Verifique o caminho: ../assets/Maicon2.0.png');
};


class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 64;
        this.height = 64;
        this.velocityX = 0;
        this.velocityY = 0;
        this.isJumping = false;
        this.facingLeft = false;
        
        // Configuração da animação
        this.frameWidth = 64; // largura de cada frame no spritesheet
        this.frameHeight = 64; // altura de cada frame no spritesheet
        this.totalFrames = 3; // total de frames na animação
        this.currentFrame = 0;
        this.frameCounter = 0;
        this.frameDelay = 25; // quantos updates até mudar de frame (25 frames = ~2.4 FPS a 60 FPS)
        this.framesPerRow = 2; // quantos frames por linha no spritesheet (grade 2x2)
    }


    jump() {
        if (!this.isJumping) {
            this.velocityY = -10;
            this.isJumping = true;
        }
    }

    render(ctx) {
        // Não desenhar se a imagem ainda não foi carregada
        if (!spriteLoaded) {
            // Desenhar um retângulo temporário enquanto carrega
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            return;
        }
        
        // Calcular a posição do frame na grade 2x2
        // Frame 0 = (0,0), Frame 1 = (1,0), Frame 2 = (0,1)
        const col = this.currentFrame % this.framesPerRow; // coluna (0 ou 1)
        const row = Math.floor(this.currentFrame / this.framesPerRow); // linha (0 ou 1)
        const frameX = col * this.frameWidth;
        const frameY = row * this.frameHeight;
        
        ctx.save();
        if (this.facingLeft) {
            ctx.translate(this.x + this.width, this.y);
            ctx.scale(-1, 1);
            ctx.drawImage(
                spriteSheet,
                frameX, frameY, // posição no spritesheet (x, y) - grade 2x2
                this.frameWidth, this.frameHeight, // tamanho do frame no spritesheet
                0, 0, // posição no canvas
                this.width, this.height // tamanho renderizado
            );
        } else {
            ctx.drawImage(
                spriteSheet,
                frameX, frameY, // posição no spritesheet (x, y) - grade 2x2
                this.frameWidth, this.frameHeight, // tamanho do frame no spritesheet
                this.x, this.y, // posição no canvas
                this.width, this.height // tamanho renderizado
            );
        }
        ctx.restore();
    }
}