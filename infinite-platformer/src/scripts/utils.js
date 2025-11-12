function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function detectCollision(rect1, rect2) {
    // Verifica se há sobreposição horizontal
    const horizontalOverlap = rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x;
    
    // Posição dos pés do player
    const feetY = rect1.y + rect1.height;
    const platformTop = rect2.y;
    
    // O player deve estar caindo e os pés devem estar na altura da plataforma (com tolerância)
    const isFalling = rect1.velocityY > 0;
    const feetOnTop = feetY > platformTop - 10 && feetY < platformTop + 20;
    
    return horizontalOverlap && feetOnTop && isFalling;
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function lerp(start, end, t) {
    return start + (end - start) * t;
}