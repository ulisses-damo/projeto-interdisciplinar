# 📚 Documentação Técnica - As Aventuras de Maicon

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Tecnologias Utilizadas](#tecnologias-utilizadas)
4. [Estrutura do Projeto](#estrutura-do-projeto)
5. [Requisitos Funcionais](#requisitos-funcionais)
6. [Requisitos Não-Funcionais](#requisitos-não-funcionais)
7. [Componentes Técnicos](#componentes-técnicos)
8. [Sistema de Renderização](#sistema-de-renderização)
9. [Sistema de Animação](#sistema-de-animação)
10. [Sistema de Física](#sistema-de-física)
11. [Sistema de Colisão](#sistema-de-colisão)
12. [Guia de Instalação](#guia-de-instalação)

---

## 🎮 Visão Geral

**As Aventuras de Maicon** é um jogo de plataforma 2D desenvolvido com tecnologias web nativas (HTML5, CSS3 e JavaScript). O jogo apresenta mecânicas clássicas de plataforma com rolagem infinita vertical, onde o jogador controla o personagem LULI através de plataformas em constante movimento.

### Conceito do Jogo
- **Gênero**: Plataforma 2D Infinita
- **Objetivo**: Alcançar o maior número de plataformas possível sem cair
- **Modo de Jogo**: Single-player
- **Perspectiva**: Vista lateral (2D Side-scrolling)

---

## 🏗️ Arquitetura do Sistema

### Padrão Arquitetural
O projeto utiliza uma arquitetura baseada em **Programação Orientada a Objetos (OOP)** com separação de responsabilidades:

```
┌─────────────────────────────────────────┐
│           Interface do Usuário          │
│         (HTML + CSS + Canvas)           │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│         Game Loop Principal             │
│        (game_fixed.js)                  │
│  ┌─────────────────────────────────┐   │
│  │  • Inicialização                │   │
│  │  • Update Logic                 │   │
│  │  • Render Loop                  │   │
│  │  • Event Handling               │   │
│  └─────────────────────────────────┘   │
└─────┬───────────────────┬───────────────┘
      │                   │
┌─────▼──────┐     ┌─────▼──────────┐
│   Player   │     │   Platform     │
│   Class    │     │    Class       │
│(player.js) │     │(platform.js)   │
└────────────┘     └────────────────┘
      │                   │
      └──────────┬────────┘
                 │
        ┌────────▼─────────┐
        │  Utility Layer   │
        │   (utils.js)     │
        └──────────────────┘
```

### Fluxo de Dados
```
User Input → Event Listeners → Game State Update → 
Physics Calculation → Collision Detection → 
Sprite Animation → Canvas Rendering → Display
```

---

## 💻 Tecnologias Utilizadas

### Core Technologies
| Tecnologia | Versão | Finalidade |
|------------|--------|------------|
| **HTML5** | - | Estrutura da aplicação e Canvas API |
| **CSS3** | - | Estilização, animações e transições |
| **JavaScript (ES6+)** | ES2015+ | Lógica do jogo e manipulação do DOM |
| **Canvas API** | HTML5 | Renderização 2D de gráficos |

### APIs e Recursos Web
- **Canvas 2D Context**: Renderização de sprites e elementos visuais
- **RequestAnimationFrame**: Loop de jogo suave (60 FPS)
- **DOM Events**: Captura de inputs do teclado
- **CSS Grid/Flexbox**: Layout responsivo
- **CSS Animations**: Animações da tela inicial

### Ferramentas de Desenvolvimento
- **Piskel**: Editor de pixel art para criação de sprites
- **VS Code**: Editor de código
- **Git**: Controle de versão

---

## 📁 Estrutura do Projeto

```
infinite-platformer/
│
├── assets/                      # Recursos multimídia
│   ├── LULI.png                # Spritesheet do personagem (128x128px, grade 2x2)
│   ├── mario.png               # (Arquivo legado)
│   ├── Maicon.piskel           # Arquivo fonte do Piskel
│   └── sounds/                 # Diretório para efeitos sonoros
│
├── src/                         # Código fonte
│   ├── index.html              # Documento HTML principal
│   │
│   ├── styles/
│   │   └── style.css           # Estilos globais (629 linhas)
│   │       ├── Tela inicial    # Animações e layout da tela de início
│   │       ├── Tela de jogo    # Estilização do canvas e HUD
│   │       └── Game Over       # Modal de fim de jogo
│   │
│   └── scripts/
│       ├── game_fixed.js       # Loop principal e gerenciamento (330 linhas)
│       │   ├── Inicialização do jogo
│       │   ├── Criação de plataformas
│       │   ├── Game Loop (update/render)
│       │   ├── Sistema de colisão
│       │   ├── Reposicionamento de plataformas
│       │   └── Controles de input
│       │
│       ├── player.js           # Classe Player (81 linhas)
│       │   ├── Propriedades do jogador
│       │   ├── Sistema de animação de sprites
│       │   ├── Mecânica de pulo
│       │   └── Renderização com flip horizontal
│       │
│       ├── platform.js         # Classe Platform (40 linhas)
│       │   ├── Propriedades das plataformas
│       │   ├── Renderização com cantos arredondados
│       │   └── Detecção de colisão
│       │
│       └── utils.js            # Funções utilitárias (27 linhas)
│           ├── getRandomInt()
│           ├── detectCollision()
│           ├── clamp()
│           └── lerp()
│
├── README.md                    # Documentação básica
└── DOCUMENTACAO.md             # Esta documentação técnica
```

---

## ✅ Requisitos Funcionais

### RF01 - Movimentação do Personagem
**Descrição**: O jogador deve poder mover o personagem horizontalmente usando as setas do teclado.
- **Entrada**: Teclas ArrowLeft (←) e ArrowRight (→)
- **Comportamento**: Velocidade constante de 3 pixels/frame
- **Restrição**: Não pode sair dos limites horizontais do canvas

### RF02 - Mecânica de Pulo
**Descrição**: O jogador deve poder fazer o personagem pular usando a tecla espaço.
- **Entrada**: Tecla Space
- **Comportamento**: 
  - Velocidade inicial de pulo: -13 pixels/frame
  - Só pode pular quando está sobre uma plataforma
  - Sujeito à gravidade (0.4 pixels/frame²)
- **Velocidade máxima de queda**: 12 pixels/frame

### RF03 - Sistema de Plataformas Infinitas
**Descrição**: As plataformas devem ser geradas e reposicionadas dinamicamente.
- **Quantidade inicial**: 12 plataformas
- **Dimensões**: 100x20 pixels
- **Gap vertical**: 125 pixels entre plataformas
- **Distância horizontal**: 50-110 pixels (aleatória)
- **Comportamento**: Quando uma plataforma sai da tela, é reposicionada no topo

### RF04 - Detecção de Colisão
**Descrição**: O sistema deve detectar quando o personagem pousa sobre uma plataforma.
- **Método**: Verificação de sobreposição de hitboxes
- **Requisito**: O personagem deve estar caindo (velocityY > 0)
- **Tolerância**: ±20 pixels no eixo Y para melhor jogabilidade

### RF05 - Sistema de Pontuação
**Descrição**: O jogo deve contar quantas plataformas únicas o jogador alcançou.
- **Display**: Contador no canto superior direito
- **Formato**: "Plataformas: X"
- **Cor**: Amarelo (#FFD700)
- **Atualização**: Em tempo real ao tocar nova plataforma

### RF06 - Animação do Personagem
**Descrição**: O sprite do personagem deve animar durante o jogo.
- **Frames**: 3 frames de animação
- **Taxa**: ~2.4 FPS (25 frames do jogo por frame de sprite)
- **Organização**: Spritesheet em grade 2x2 (128x128px total)
- **Comportamento**: Animação contínua independente do movimento

### RF07 - Flip Horizontal
**Descrição**: O personagem deve virar de acordo com a direção do movimento.
- **Direita**: Sprite normal
- **Esquerda**: Sprite espelhado horizontalmente
- **Método**: Canvas scale(-1, 1)

### RF08 - Tela Inicial
**Descrição**: Apresentar uma tela de boas-vindas antes de iniciar o jogo.
- **Elementos**:
  - Título do jogo com animação
  - Avatar do personagem
  - Botão "Iniciar"
  - Elementos decorativos (nuvens, árvores, plataformas)
- **Transição**: Fade out/in suave (0.5s)

### RF09 - Game Over
**Descrição**: Detectar quando o jogador cai da tela e exibir tela de fim de jogo.
- **Condição**: player.y > canvas.height
- **Display**: Modal centralizado
- **Informações**: Pontuação final
- **Ação**: Botão para reiniciar o jogo

### RF10 - Rolagem da Tela
**Descrição**: As plataformas devem se mover para baixo após o jogador alcançar certa altura.
- **Trigger**: Ao alcançar a 3ª plataforma
- **Velocidade**: 1 pixel/frame
- **Comportamento**: Todas as plataformas movem simultaneamente

---

## 🔒 Requisitos Não-Funcionais

### RNF01 - Performance
**Descrição**: O jogo deve manter taxa de quadros estável.
- **Taxa de quadros**: 60 FPS
- **Método**: RequestAnimationFrame
- **Otimização**: Renderização apenas de elementos visíveis
- **Métrica**: Sem quedas perceptíveis de FPS durante gameplay normal

### RNF02 - Compatibilidade
**Descrição**: O jogo deve funcionar em navegadores modernos.
- **Navegadores suportados**:
  - Chrome 90+
  - Firefox 88+
  - Edge 90+
  - Safari 14+
- **Resolução mínima**: 1024x768 pixels
- **Canvas**: 800x600 pixels fixo

### RNF03 - Responsividade Visual
**Descrição**: A interface deve se adaptar a diferentes tamanhos de tela.
- **Layout**: Flexbox/Grid responsivo
- **Canvas**: Dimensões fixas com centralização
- **Elementos**: Escala proporcional em telas maiores

### RNF04 - Tempo de Carregamento
**Descrição**: Os recursos devem carregar rapidamente.
- **Sprites**: < 50KB cada
- **Tempo total**: < 2 segundos em conexão padrão
- **Fallback**: Retângulo colorido enquanto sprite carrega

### RNF05 - Usabilidade
**Descrição**: Controles devem ser intuitivos e responsivos.
- **Latência de input**: < 16ms (1 frame)
- **Feedback visual**: Imediato
- **Instruções**: Claramente exibidas na tela

### RNF06 - Manutenibilidade
**Descrição**: Código deve ser organizado e documentado.
- **Padrão**: OOP com classes separadas
- **Comentários**: Funções complexas documentadas
- **Nomenclatura**: CamelCase para variáveis, PascalCase para classes
- **Modularidade**: Separação por responsabilidade

### RNF07 - Escalabilidade
**Descrição**: Facilidade para adicionar novos recursos.
- **Arquitetura**: Desacoplada
- **Classes**: Extensíveis
- **Sistema de plataformas**: Suporta novos tipos facilmente

### RNF08 - Acessibilidade
**Descrição**: Interface deve ter bom contraste e legibilidade.
- **Contraste**: Ratio mínimo 4.5:1 (WCAG AA)
- **Fontes**: Tamanhos legíveis (mín. 1.1em)
- **Cores**: Paleta consistente e harmoniosa

---

## 🧩 Componentes Técnicos

### 1. Canvas API
**Dimensões**: 800x600 pixels
**Contexto**: 2D (`CanvasRenderingContext2D`)

```javascript
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
```

**Métodos Utilizados**:
- `clearRect()`: Limpa o canvas a cada frame
- `fillRect()`: Desenha retângulos (fallback)
- `drawImage()`: Renderiza sprites
- `fillText()`: Renderiza texto
- `save()/restore()`: Salva/restaura estado do contexto
- `translate()`: Move origem do contexto
- `scale()`: Escala desenhos (flip horizontal)

### 2. Classe Player

**Propriedades**:
```javascript
{
  x: Number,              // Posição X (pixels)
  y: Number,              // Posição Y (pixels)
  width: 64,              // Largura (pixels)
  height: 64,             // Altura (pixels)
  velocityX: Number,      // Velocidade horizontal (-3, 0, ou 3)
  velocityY: Number,      // Velocidade vertical (afetada por gravidade)
  isJumping: Boolean,     // Estado de pulo
  facingLeft: Boolean,    // Direção que está olhando
  
  // Animação
  frameWidth: 64,         // Largura do frame no spritesheet
  frameHeight: 64,        // Altura do frame no spritesheet
  totalFrames: 3,         // Total de frames na animação
  currentFrame: Number,   // Frame atual (0-2)
  frameCounter: Number,   // Contador para delay
  frameDelay: 25,         // Frames de jogo por frame de sprite
  framesPerRow: 2         // Organização do spritesheet
}
```

**Métodos**:
- `jump()`: Aplica velocidade vertical negativa
- `render(ctx)`: Desenha o sprite no canvas

### 3. Classe Platform

**Propriedades**:
```javascript
{
  x: Number,              // Posição X
  y: Number,              // Posição Y
  width: 100,             // Largura padrão
  height: 20,             // Altura padrão
  color: String,          // Cor (hex ou nome)
  id: Number              // Identificador único
}
```

**Métodos**:
- `render(ctx)`: Desenha plataforma com cantos arredondados
- `checkCollision(player)`: Verifica colisão com jogador

### 4. Game Loop

```javascript
function gameLoop() {
    if (isGameOver) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);  // Limpa canvas
    update();                                           // Atualiza lógica
    render();                                           // Renderiza
    requestAnimationFrame(gameLoop);                   // Próximo frame
}
```

**Taxa de Atualização**: ~60 FPS (16.67ms por frame)

---

## 🎨 Sistema de Renderização

### Pipeline de Renderização
```
1. Clear Canvas (clearRect)
   ↓
2. Render Platforms (forEach)
   ↓
3. Render Player (sprite animation)
   ↓
4. Present Frame
```

### Ordem de Renderização (Z-Index)
```
Background (Canvas fill) → 
Platforms (lowest) → 
Player (highest) → 
UI Elements (overlay)
```

### Otimizações
- **Dirty Rectangle**: Apenas limpa canvas completo (otimização futura possível)
- **Object Pooling**: Plataformas são reutilizadas (reposicionamento)
- **Culling**: Elementos fora da tela não são renderizados (futuro)

---

## 🎬 Sistema de Animação

### Spritesheet
**Arquivo**: `LULI.png`
**Dimensões**: 128x128 pixels
**Organização**: Grade 2x2
**Frames**: 3 (posições: [0,0], [1,0], [0,1])

```
┌─────────┬─────────┐
│ Frame 0 │ Frame 1 │  64x64 cada
├─────────┼─────────┤
│ Frame 2 │ (vazio) │
└─────────┴─────────┘
```

### Lógica de Animação
```javascript
// A cada update do jogo:
frameCounter++;
if (frameCounter >= frameDelay) {
    frameCounter = 0;
    currentFrame = (currentFrame + 1) % totalFrames;  // 0→1→2→0
}
```

### Cálculo de Posição do Frame
```javascript
const col = currentFrame % framesPerRow;           // Coluna no grid
const row = Math.floor(currentFrame / framesPerRow); // Linha no grid
const frameX = col * frameWidth;                    // Posição X em pixels
const frameY = row * frameHeight;                   // Posição Y em pixels
```

### Renderização do Sprite
```javascript
ctx.drawImage(
    spriteSheet,
    frameX, frameY,                  // Posição no spritesheet
    frameWidth, frameHeight,          // Tamanho do frame
    this.x, this.y,                  // Posição no canvas
    this.width, this.height          // Tamanho renderizado
);
```

### Image Rendering
```css
image-rendering: pixelated;          /* Mantém estilo pixel art */
image-rendering: -moz-crisp-edges;   /* Firefox */
image-rendering: crisp-edges;        /* Padrão */
```

---

## ⚙️ Sistema de Física

### Gravidade
```javascript
const gravity = 0.4;  // pixels/frame²

// Aplicada a cada frame:
player.velocityY += gravity;
player.y += player.velocityY;

// Velocidade terminal:
if (player.velocityY > 12) player.velocityY = 12;
```

### Pulo
```javascript
player.velocityY = -13;  // Impulso inicial
// Gravidade desacelera até velocityY = 0 (ápice do pulo)
// Depois acelera para baixo
```

### Movimento Horizontal
```javascript
// Sem aceleração/desaceleração
velocityX = 3;   // Direita
velocityX = -3;  // Esquerda
velocityX = 0;   // Parado

// Aplicado diretamente:
player.x += player.velocityX;
```

### Cálculos de Alcance

**Altura Máxima do Pulo**:
```
h = v₀² / (2g)
h = 13² / (2 × 0.4)
h ≈ 211 pixels
```

**Tempo no Ar**:
```
t = 2v₀ / g
t = 2 × 13 / 0.4
t = 65 frames (≈ 1.08 segundos a 60 FPS)
```

**Distância Horizontal Máxima**:
```
d = velocityX × tempo
d = 3 × 65
d = 195 pixels
```

---

## 💥 Sistema de Colisão

### Detecção de Colisão (AABB - Axis-Aligned Bounding Box)

```javascript
function detectCollision(rect1, rect2) {
    // Sobreposição horizontal
    const horizontalOverlap = 
        rect1.x < rect2.x + rect2.width && 
        rect1.x + rect1.width > rect2.x;
    
    // Posição dos pés do player
    const feetY = rect1.y + rect1.height;
    const platformTop = rect2.y;
    
    // Player deve estar caindo
    const isFalling = rect1.velocityY > 0;
    
    // Pés na altura da plataforma (tolerância)
    const feetOnTop = feetY > platformTop - 10 && 
                      feetY < platformTop + 20;
    
    return horizontalOverlap && feetOnTop && isFalling;
}
```

### Resolução de Colisão
```javascript
if (detectCollision(player, platform)) {
    player.y = platform.y - player.height;  // Snap para topo
    player.velocityY = 0;                    // Para movimento vertical
    player.isJumping = false;                // Permite pular novamente
}
```

### Tolerância de Colisão
- **Superior**: -10 pixels (permite cair através se muito acima)
- **Inferior**: +20 pixels (perdoa pequenas penetrações)
- **Objetivo**: Melhorar jogabilidade e evitar bugs visuais

---

## 📦 Guia de Instalação

### Pré-requisitos
- Navegador moderno (Chrome 90+, Firefox 88+, Edge 90+, Safari 14+)
- Servidor web local (opcional, mas recomendado)
  - Python: `python -m http.server 8000`
  - Node.js: `npx http-server`
  - VS Code: Live Server Extension

### Instalação Local

1. **Clone o repositório**:
```bash
git clone https://github.com/ulisses-damo/projeto-interdisciplinar.git
cd projeto-interdisciplinar/infinite-platformer
```

2. **Verifique a estrutura**:
```bash
├── assets/
│   └── Maicon.png          # Deve existir
├── src/
│   ├── index.html
│   ├── styles/
│   │   └── style.css
│   └── scripts/
│       ├── game_fixed.js
│       ├── player.js
│       ├── platform.js
│       └── utils.js
```

3. **Inicie um servidor local**:
```bash
# Opção 1: Python
python -m http.server 8000

# Opção 2: Node.js
npx http-server -p 8000

# Opção 3: VS Code Live Server
# Clique direito em index.html → "Open with Live Server"
```

4. **Acesse no navegador**:
```
http://localhost:8000/src/index.html
```

### Verificação de Funcionamento

✅ **Checklist**:
- [ ] Tela inicial carrega com animações
- [ ] Avatar do personagem aparece no círculo laranja
- [ ] Botão "INICIAR" está visível
- [ ] Ao clicar, transição para tela de jogo
- [ ] Canvas carrega com fundo gradiente
- [ ] Personagem aparece animado
- [ ] Plataformas são visíveis
- [ ] Setas movem o personagem
- [ ] Espaço faz pular
- [ ] Contador de plataformas atualiza
- [ ] Game Over aparece ao cair

### Troubleshooting

**Problema**: Sprite não carrega
- **Solução**: Verifique se `LULI.png` está em `assets/`
- **Solução**: Verifique permissões de arquivo
- **Solução**: Use servidor web (CORS pode bloquear file://)

**Problema**: Animação não funciona
- **Solução**: Verifique Console do navegador (F12)
- **Solução**: Confirme que spritesheet é 128x128px
- **Solução**: Limpe cache do navegador (Ctrl+Shift+R)

**Problema**: Controles não respondem
- **Solução**: Clique no canvas para dar foco
- **Solução**: Verifique se não há erros no Console

---

## 🎮 Controles

| Tecla | Ação |
|-------|------|
| **←** | Mover para esquerda |
| **→** | Mover para direita |
| **Espaço** | Pular |

---

## 📊 Métricas do Projeto

### Linhas de Código
- **Total**: ~1,067 linhas
- JavaScript: ~438 linhas
- CSS: ~629 linhas
- HTML: ~58 linhas (gerado)

### Complexidade
- **Classes**: 2 (Player, Platform)
- **Funções**: ~15 principais
- **Event Listeners**: 3
- **Loops principais**: 1 (Game Loop)

### Assets
- **Sprites**: 1 arquivo (128x128px, ~5KB)
- **Imagens**: Formato PNG
- **Audio**: Não implementado

---

## 🚀 Melhorias Futuras

### Curto Prazo
- [ ] Sistema de pontuação highscore (localStorage)
- [ ] Efeitos sonoros (pulo, colisão, game over)
- [ ] Música de fundo
- [ ] Diferentes tipos de plataformas (móveis, quebráveis)

### Médio Prazo
- [ ] Power-ups colecionáveis
- [ ] Inimigos
- [ ] Múltiplos níveis/mundos
- [ ] Sistema de vidas
- [ ] Modo de dificuldade

### Longo Prazo
- [ ] Multiplayer local
- [ ] Ranking online
- [ ] Editor de níveis
- [ ] Mobile responsivo (touch controls)
- [ ] Progressive Web App (PWA)

---

## 👥 Créditos

- **Desenvolvimento**: Projeto Interdisciplinar
- **Arte**: Sprite LULI criado no Piskel
- **Repositório**: [github.com/ulisses-damo/projeto-interdisciplinar](https://github.com/ulisses-damo/projeto-interdisciplinar)

---

## 📄 Licença

Este projeto é desenvolvido para fins educacionais.

---

**Última Atualização**: Novembro 2025
**Versão**: 1.0.0
