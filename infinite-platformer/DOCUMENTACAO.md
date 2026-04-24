# Documentacao Tecnica - As Aventuras de Maicon

## Indice
1. Visao Geral
2. Avaliacao do Codigo
3. Arquitetura do Sistema
4. Tecnologias Utilizadas
5. Estrutura Atual do Projeto
6. Niveis e Progressao
7. Requisitos Funcionais
8. Requisitos Nao Funcionais
9. Componentes Tecnicos
10. Fluxos Principais
11. Limitacoes e Recomendacoes
12. Guia de Instalacao e Execucao

---

## Visao Geral

As Aventuras de Maicon e um jogo de plataforma 2D desenvolvido com HTML5, CSS3 e JavaScript puro, renderizado via Canvas 2D. O projeto evoluiu de um platformer vertical simples para uma estrutura com multiplos niveis tematicos, desbloqueio progressivo, trilhas sonoras por fase, hazards contextuais, power-ups e um nivel especial com progressao invertida.

### Caracteristicas atuais
- 5 niveis com temas visuais, musica e dificuldade proprios.
- Progressao vertical por subida nos niveis 1, 2, 3 e 5.
- Progressao vertical por descida no nivel 4, com barreira de morte no topo.
- Plataformas normais, plataformas que desmoronam e plataformas triangulares escorregadias.
- Power-ups a partir do nivel 3: escudo, vida extra e pulo duplo.
- Lava como hazard nos niveis 3 e 5.
- Seletor de niveis com desbloqueio persistido em `localStorage`.
- Tela inicial, HUD dinamica, tela de conclusao de nivel e game over com as acoes Tentar novamente e Escolher nivel.

### Objetivo de jogo
O jogador deve tocar um numero alvo de plataformas unicas para concluir o nivel atual e desbloquear o proximo. O risco principal varia por fase: queda fora da area segura, plataformas instaveis, lava e dificuldade crescente de navegacao.

---

## Avaliacao do Codigo

### Pontos fortes
- A separacao por responsabilidade esta boa para um projeto sem framework: `game_fixed.js` orquestra o loop principal, enquanto nivel, camera, geracao, power-ups, audio e UI ficam encapsulados em modulos especificos.
- A extensibilidade de gameplay melhorou bastante. O codigo ja suporta tipos diferentes de plataforma, niveis com direcoes opostas de progressao e hazards por fase sem reescrever o loop principal.
- O fluxo de update e renderizacao esta claro e previsivel: input, fisica, colisao, hazards, reciclagem de plataformas e render.
- O uso de `localStorage` para niveis desbloqueados e de Howler.js para audio deixa a experiencia mais completa sem adicionar infraestrutura complexa.

### Pontos de atencao
- O projeto depende fortemente de estado global mutavel e da ordem de carregamento das `script tags`. Isso funciona para um jogo pequeno, mas aumenta o acoplamento entre modulos.
- Ainda ha inconsistencias pontuais de configuracao: `player.js` carrega `LULI.png`, mas a mensagem de erro ainda menciona outro arquivo; `lavaManager.js` mantem configuracao para o nivel 4 mesmo com a lava desativada nessa fase.
- O HTML possui muitos estilos inline na tela principal e no game over, o que reduz a manutenibilidade visual e dificulta padronizacao com o restante do CSS.
- Nao ha testes automatizados, lint formal nem pipeline de validacao. Mudancas de gameplay dependem quase totalmente de teste manual.

### Avaliacao geral
O codigo esta em um bom ponto para um jogo academico em JavaScript puro: legivel, funcional e com modulos bem identificados. O principal debito tecnico nao esta na complexidade do gameplay, mas na falta de uma camada de validacao automatica e no acoplamento por escopo global.

---

## Arquitetura do Sistema

### Estilo arquitetural
O projeto segue um modelo de aplicacao estatico em pagina unica, com modulos JavaScript carregados diretamente pelo HTML. O jogo usa uma combinacao de:
- classes para entidades de mundo, como `Player` e `Platform`;
- objetos singleton para servicos de runtime, como `LevelManager`, `Camera`, `PlatformGenerator`, `PowerUpManager`, `LavaManager`, `SoundManager` e `UIManager`;
- um loop central em `game_fixed.js` para atualizar e desenhar o estado do jogo.

### Fluxo de inicializacao
1. O HTML carrega os scripts em ordem fixa.
2. `DOMContentLoaded` inicializa som e UI.
3. A UI abre o seletor de niveis.
4. Ao escolher um nivel, `init(level)` reseta os sistemas e cria o estado da fase.
5. `requestAnimationFrame` passa a executar o loop principal.

### Fluxo do loop principal
1. Atualizar posicao do jogador.
2. Atualizar animacao do sprite.
3. Resolver colisao com plataformas.
4. Aplicar gravidade.
5. Atualizar camera.
6. Atualizar power-ups e hazards.
7. Reciclar e gerar plataformas futuras.
8. Verificar condicoes de game over ou conclusao.
9. Renderizar mundo e HUD.

---

## Tecnologias Utilizadas

### Core
| Tecnologia | Uso atual |
| --- | --- |
| HTML5 | Estrutura da tela inicial, canvas, overlays e HUD |
| CSS3 | Layout, animacoes, temas visuais e responsividade basica |
| JavaScript ES6+ | Gameplay, estado do jogo, UI e persistencia |
| Canvas 2D API | Renderizacao do jogador, plataformas, lava e power-ups |

### Bibliotecas e APIs
| Recurso | Uso atual |
| --- | --- |
| Howler.js | Musica de fundo por nivel |
| `requestAnimationFrame` | Loop principal em ~60 FPS |
| `localStorage` | Persistencia dos niveis desbloqueados |
| DOM Events | Entrada do teclado e interacoes de UI |

### Observacoes de execucao
- O projeto nao usa bundler.
- O HTML carrega Howler por CDN.
- Existe `package.json` na raiz do workspace com a dependencia `howler`, mas a execucao da versao atual do jogo continua baseada em arquivo estatico + CDN.

---

## Estrutura Atual do Projeto

```text
projeto-interdisciplinar/
|-- package.json
`-- infinite-platformer/
    |-- DOCUMENTACAO.md
    |-- README.md
    |-- assets/
    |   |-- LULI.png
    |   `-- sounds/
    `-- src/
        |-- index.html
        |-- styles/
        |   `-- style.css
        `-- scripts/
            |-- camera.js
            |-- game_fixed.js
            |-- lavaManager.js
            |-- levelManager.js
            |-- platform.js
            |-- platformGenerator.js
            |-- player.js
            |-- powerUpManager.js
            |-- soundManager.js
            |-- uiManager.js
            `-- utils.js
```

### Responsabilidade por modulo
| Arquivo | Responsabilidade principal |
| --- | --- |
| `game_fixed.js` | Loop principal, inicializacao, update, render, input e integracao entre sistemas |
| `player.js` | Entidade do jogador e renderizacao do sprite |
| `platform.js` | Tipos de plataforma, render e comportamento especial |
| `camera.js` | Scroll vertical, visibilidade, reciclagem e death barrier |
| `levelManager.js` | Metadados de nivel, tema, persistencia e meta por fase |
| `platformGenerator.js` | Criacao inicial, reciclagem e buffer preditivo de plataformas |
| `lavaManager.js` | Spawn, movimento, colisao e renderizacao de lava |
| `powerUpManager.js` | Spawn, coleta, duracao e efeitos de power-up |
| `soundManager.js` | Preload, reproducao e troca de trilha sonora |
| `uiManager.js` | Fluxos de tela inicial, seletor, fim de nivel e game over |
| `utils.js` | Colisao e funcoes utilitarias gerais |

---

## Niveis e Progressao

### Matriz de niveis
| Nivel | Tema | Direcao | Meta de plataformas | Riscos principais | Destaques |
| --- | --- | --- | --- | --- | --- |
| 1 | Ceu Azul | Subida | 50 | Queda pela parte inferior | Introducao ao loop basico |
| 2 | Deserto | Subida | 75 | Queda e plataformas que desmoronam | Inicio da variacao de plataformas |
| 3 | Vulcao | Subida | 75 | Lava vinda de cima, queda, crumble | Inicio dos power-ups |
| 4 | Noite | Descida | 100 | Barreira de morte acima, triangulos escorregadios, crumble | Nivel invertido e exclusivo |
| 5 | Galaxia | Subida | 120 | Lava vinda de cima, queda, crumble mais frequente | Fase mais densa e dificil |

### Regras de progressao
- O jogo inicia com apenas o nivel 1 desbloqueado.
- Ao concluir um nivel, o proximo e liberado automaticamente.
- O progresso de desbloqueio fica salvo em `localStorage` com a chave `maicon_unlocked_levels`.
- A conclusao de um nivel depende da quantidade de plataformas unicas tocadas, nao de um ponto final do mapa.

### Variacoes de plataforma
- `normal`: plataforma estavel padrao.
- `crumbling`: plataforma em formato de nuvem que treme e cai depois de ativada.
- `triangle-left` e `triangle-right`: plataformas inclinadas, exclusivas do nivel 4, que empurram o jogador lateralmente e dificultam permanencia.

---

## Requisitos Funcionais

### RF01 - Tela inicial e entrada no jogo
O sistema deve apresentar uma tela inicial com botao `Iniciar` e realizar transicao visual para a tela principal do jogo.

### RF02 - Selecao e desbloqueio de niveis
O jogador deve poder escolher niveis desbloqueados em um overlay dedicado. O desbloqueio deve ocorrer progressivamente conforme a conclusao das fases.

### RF03 - Persistencia local de progresso
Os niveis desbloqueados devem ser armazenados localmente para permanecerem disponiveis entre sessoes do navegador.

### RF04 - Movimento horizontal
O personagem deve se mover para esquerda e direita com velocidade constante usando `ArrowLeft` e `ArrowRight`, sem sair dos limites do canvas.

### RF05 - Pulo basico
O jogador deve poder pular com a tecla `Espaco` apenas quando estiver apoiado em uma plataforma valida.

### RF06 - Gravidade e queda
O personagem deve estar sujeito a gravidade constante e a uma velocidade terminal de queda para manter previsibilidade no controle.

### RF07 - Pulo duplo por power-up
Quando o power-up `doubleJump` estiver ativo, o jogador deve poder executar um segundo pulo no ar antes de tocar novamente o solo.

### RF08 - Geracao infinita de plataformas
As plataformas devem ser geradas dinamicamente e recicladas durante a fase, mantendo buffer suficiente a frente do jogador.

### RF09 - Progressao vertical por nivel
O sistema deve suportar niveis com progressao por subida e um nivel com progressao por descida, com camera e condicao de morte adequadas ao modo.

### RF10 - Tipos especiais de plataforma
O jogo deve suportar plataformas que desmoronam e plataformas triangulares escorregadias, com comportamento proprio de colisao e renderizacao.

### RF11 - Contagem de plataformas unicas
Cada plataforma tocada pela primeira vez deve incrementar o progresso do nivel. A HUD deve mostrar a contagem atual e a meta da fase.

### RF12 - Conclusao de nivel
Ao atingir a meta de plataformas unicas, o jogo deve encerrar a fase, liberar o proximo nivel quando existir e exibir overlay de conclusao.

### RF13 - Sistema de hazards por nivel
O jogo deve suportar hazards especificos por fase. Atualmente a lava esta ativa nos niveis 3 e 5 e desativada no nivel 4.

### RF14 - Sistema de power-ups
O sistema deve gerar, renderizar, permitir coleta e aplicar efeitos temporarios ou consumiveis para escudo, vida extra e pulo duplo a partir do nivel 3.

### RF15 - Audio por nivel
Cada fase deve possuir uma trilha sonora propria, trocada automaticamente na entrada do nivel e interrompida em game over ou conclusao.

### RF16 - Feedback visual de estado
O jogo deve exibir HUD com contador de plataformas, nivel atual e indicador de power-up ativo.

### RF17 - Game over com acoes imediatas
Ao perder, o sistema deve exibir a pontuacao da tentativa e oferecer as acoes `Tentar novamente` e `Escolher nivel`.

### RF18 - Renderizacao do personagem animado
O personagem deve animar continuamente e virar de lado conforme a direcao horizontal atual.

---

## Requisitos Nao Funcionais

### RNF01 - Performance visual
O jogo deve manter atualizacao fluida com `requestAnimationFrame`, buscando experiencia proxima de 60 FPS em navegadores desktop modernos.

### RNF02 - Simplicidade de deploy
O projeto deve funcionar como aplicacao estatica, executavel via servidor HTTP simples, sem etapa obrigatoria de build.

### RNF03 - Compatibilidade com navegadores modernos
O jogo deve operar corretamente em Chrome, Edge, Firefox e navegadores equivalentes com suporte a Canvas 2D, `localStorage` e ES6.

### RNF04 - Manutenibilidade modular
A logica deve permanecer separada em modulos por responsabilidade para facilitar extensao de fases, hazards e tipos de plataforma.

### RNF05 - Persistencia local leve
O estado persistido deve ser pequeno, simples e limitado ao essencial da progressao do jogador.

### RNF06 - Observabilidade minima
Falhas de carregamento de asset devem produzir algum feedback, como fallback visual ou mensagem de console, para facilitar depuracao manual.

### RNF07 - Extensibilidade de gameplay
O projeto deve continuar permitindo novos niveis, power-ups, hazards e temas sem exigir reestruturacao completa do loop principal.

### RNF08 - Legibilidade de interface
A HUD e os overlays devem permanecer legiveis sobre fundos variados por meio de contraste, tipografia destacada e estrutura visual consistente.

### RNF09 - Audio pre-carregado
As trilhas devem ser pre-carregadas no inicio para reduzir latencia perceptivel durante troca de nivel.

### RNF10 - Validacao manual viavel
Mesmo sem testes automatizados, o codigo deve permanecer organizado o suficiente para permitir verificacao manual rapida por arquivo e por sistema.

---

## Componentes Tecnicos

### 1. Loop principal
`game_fixed.js` controla o ciclo `init -> update -> render` e integra todos os managers.

Responsabilidades principais:
- resetar estado de fase;
- criar jogador e plataformas iniciais;
- processar movimento, gravidade, colisao e hazards;
- reciclar plataformas e manter buffer futuro;
- decidir game over e conclusao.

### 2. Sistema de niveis
`levelManager.js` concentra:
- nome, tema e cor de cada fase;
- quantidade alvo de plataformas;
- modo vertical (`up` ou `down`);
- carga e persistencia dos niveis desbloqueados;
- atualizacao da HUD e indicador de fase.

### 3. Sistema de camera
`camera.js` suporta dois comportamentos:
- modo de subida: a camera sobe suavemente e a morte ocorre abaixo da tela;
- modo de descida: a camera acompanha para baixo e a morte ocorre acima da tela.

### 4. Geracao de plataformas
`platformGenerator.js` usa geracao por camadas com distribuicao horizontal por zonas.

Mecanismos relevantes:
- buffer frontal configuravel;
- predicao da queda do jogador para gerar plataformas a frente;
- reciclagem de plataformas antigas fora da area util;
- escolha dinamica do tipo de plataforma por nivel.

### 5. Entidade jogador
`player.js` representa o avatar e contem:
- posicao e velocidade;
- estado de pulo;
- orientacao horizontal;
- animacao por spritesheet 2x2 com 3 frames utilizados.

### 6. Sistema de colisao
`utils.js` calcula colisao horizontal e verifica se os pes do jogador estao na altura da superficie da plataforma. Para plataformas triangulares, a superficie e calculada dinamicamente pela funcao `getSurfaceYAt`.

### 7. Power-ups
`powerUpManager.js` gerencia:
- spawn em plataformas visiveis;
- coleta por proximidade radial;
- duracao e consumo dos efeitos;
- HUD do poder ativo;
- efeitos visuais aplicados ao jogador.

### 8. Lava
`lavaManager.js` gerencia spawn, movimento e colisao das gotas de lava. No estado atual:
- nivel 3: lava vindo de cima;
- nivel 4: lava desativada;
- nivel 5: lava vindo de cima.

### 9. Audio
`soundManager.js` usa Howler.js para:
- pre-carregar trilhas por nivel;
- tocar, pausar, retomar e parar musicas;
- ajustar volume global.

### 10. UI
`uiManager.js` controla:
- tela inicial;
- seletor de niveis;
- overlay de fim de nivel;
- overlay de game over;
- acoes de reinicio da fase atual ou retorno ao seletor.

---

## Fluxos Principais

### Fluxo de fase
1. Jogador escolhe um nivel.
2. O sistema reseta camera, plataformas, lava, power-ups e contadores.
3. O gerador cria o conjunto inicial de plataformas.
4. O jogo inicia a musica da fase.
5. O loop principal processa gameplay ate a conclusao ou derrota.

### Fluxo de conclusao
1. O jogador toca a quantidade alvo de plataformas unicas.
2. A musica e interrompida.
3. O proximo nivel e desbloqueado, quando houver.
4. O overlay de conclusao aparece.
5. O seletor de niveis e exibido novamente apos o tempo de transicao.

### Fluxo de derrota
1. O jogador toca um hazard letal ou cruza a barreira de morte.
2. A musica e interrompida.
3. O overlay de game over mostra fase e progresso da tentativa.
4. O jogador pode tentar novamente ou voltar ao seletor.

---

## Limitacoes e Recomendacoes

### Limitacoes atuais
- Nao ha testes automatizados.
- A arquitetura depende de escopo global e ordem de carregamento dos scripts.
- Parte da interface ainda usa estilos inline no HTML.
- Existem pequenas inconsistencias de manutencao, como mensagens de erro e configuracoes que nao refletem 100% o uso atual.

### Recomendacoes tecnicas
1. Consolidar configuracoes de gameplay em arquivos ou objetos dedicados por nivel.
2. Migrar estilos inline do HTML para `style.css`.
3. Criar um checklist de regressao manual por nivel para validar camera, hazards, power-ups e game over a cada mudanca.
4. Corrigir pequenas inconsistencias de configuracao, como o caminho do erro do sprite e a configuracao inutilizada da lava no nivel 4.
5. Considerar modularizacao via ES Modules no futuro para reduzir acoplamento global.

---

## Guia de Instalacao e Execucao

### Pre-requisitos
- Navegador moderno com suporte a Canvas 2D.
- Servidor HTTP simples local.

### Estrategias de execucao

Opcao 1:

```bash
cd infinite-platformer/src
python -m http.server 8000
```

Opcao 2:

```bash
cd infinite-platformer/src
npx http-server -p 8000
```

Opcao 3:
- Abrir `src/index.html` com Live Server no VS Code.

### URL de acesso

```text
http://localhost:8000/index.html
```

### Checklist de verificacao
- Tela inicial aparece e transiciona corretamente.
- Seletor de niveis exibe niveis desbloqueados e bloqueados.
- Musica troca ao entrar em um nivel.
- HUD mostra nivel, plataformas e power-up ativo.
- Nivel 4 inicia em modo de descida.
- Plataformas triangulares aparecem apenas no nivel 4.
- Lava aparece apenas nos niveis 3 e 5.
- Game over oferece Tentar novamente e Escolher nivel.

---

Ultima atualizacao: Abril de 2026
Documento alinhado ao estado atual do codigo-fonte.
