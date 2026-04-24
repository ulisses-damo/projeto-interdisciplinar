// ===== SISTEMA DE CÂMERA =====
// Responsável por controlar a visão do jogador no mundo

const Camera = {
    y: 0,                    // Offset da câmera (mundo → tela)
    travelMode: 'up',        // 'up' = progresso para cima, 'down' = progresso para baixo
    smooth: 0.08,            // Suavidade da câmera (0-1)
    targetOffset: 330,       // Distância do jogador ao topo da tela
    deathMargin: 20,         // Margem da barreira de morte

    reset(canvasHeight, level = LevelManager.currentLevel) {
        this.y = 0;
        this.travelMode = LevelManager.isDescending(level) ? 'down' : 'up';
        this.targetOffset = canvasHeight * (this.travelMode === 'down' ? 0.35 : 0.55);
    },

    update(playerY) {
        const targetCameraY = playerY - this.targetOffset;

        if (this.travelMode === 'down') {
            if (targetCameraY > this.y) {
                this.y += (targetCameraY - this.y) * this.smooth;
            }
            return;
        }

        if (targetCameraY < this.y) {
            this.y += (targetCameraY - this.y) * this.smooth;
        }
    },

    // Verifica se o jogador saiu pela barreira mortal do nível
    isPlayerDead(player, canvasHeight) {
        const playerScreenY = player.y - this.y;

        if (this.travelMode === 'down') {
            return playerScreenY + player.height < -this.deathMargin;
        }

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

    // Verifica se um objeto saiu da área útil e pode ser reciclado
    shouldRecycle(worldY, canvasHeight, margin = 100) {
        const screenY = worldY - this.y;

        if (this.travelMode === 'down') {
            return screenY < -margin;
        }

        return screenY > canvasHeight + margin;
    },

    isBelowScreen(worldY, canvasHeight, margin = 100) {
        return this.shouldRecycle(worldY, canvasHeight, margin);
    }
};
