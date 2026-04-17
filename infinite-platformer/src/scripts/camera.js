// ===== SISTEMA DE CÂMERA =====
// Responsável por controlar a visão do jogador no mundo

const Camera = {
    y: 0,                    // Offset da câmera (mundo → tela)
    highestPlayerY: 0,       // Posição Y mais alta que o jogador alcançou
    smooth: 0.08,            // Suavidade da câmera (0-1)
    targetOffset: 330,       // Jogador fica a ~55% da tela (600 * 0.55)
    deathMargin: 20,         // Morre logo ao sair da tela por baixo

    reset(canvasHeight) {
        this.y = 0;
        this.highestPlayerY = canvasHeight - 90;
        this.targetOffset = canvasHeight * 0.55;
    },

    update(playerY) {
        // Atualizar ponto mais alto
        if (playerY < this.highestPlayerY) {
            this.highestPlayerY = playerY;
        }

        // Câmera suave: segue o jogador para cima, NUNCA desce
        const targetCameraY = playerY - this.targetOffset;
        if (targetCameraY < this.y) {
            this.y += (targetCameraY - this.y) * this.smooth;
        }
    },

    // Verifica se o jogador caiu demais e deve morrer
    isPlayerDead(playerY, canvasHeight) {
        const playerScreenY = playerY - this.y;
        return playerScreenY > canvasHeight + this.deathMargin;
    },

    // Converte Y do mundo para Y da tela
    worldToScreen(worldY) {
        return worldY - this.y;
    },

    // Verifica se um objeto está visível na tela
    isVisible(worldY, canvasHeight, margin = 50) {
        const screenY = worldY - this.y;
        return screenY > -margin && screenY < canvasHeight + margin;
    },

    // Verifica se um objeto saiu por baixo da tela
    isBelowScreen(worldY, canvasHeight, margin = 100) {
        const screenY = worldY - this.y;
        return screenY > canvasHeight + margin;
    }
};
