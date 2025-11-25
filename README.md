# simulation_v2

Mini‑engine de simulação por turnos em TypeScript, baseada em ECS e eventos, com mundo procedural chunkado, IA reativa e storytelling orientado a eventos. Renderizada em ASCII (terminal) e desenhada para extensibilidade: scheduler por turnos, pathfinding/FoV, sistema de ocupação/camadas, StorySystem, triggers/efeitos, seeds determinísticos e serialização para replays.

- Renderização em terminal (ASCII), sem bibliotecas de game.
- Mundo procedural (salas retangulares e corredores em L) e base para chunking/viewport.
- Entidades com componentes (posição, visão, vida, ataque, aparência, raça, tipo, IA, comportamento).
- Sistemas determinísticos por domínio: percepção, decisão de IA, combate, movimento, morte e logging.
- Storytelling básico via log orientado a eventos (base para StorySystem).


## Sumário
- Visão Geral da Engine
- Como Rodar
- Estrutura de Pastas
- Fluxo do Tick e Ordem dos Sistemas
- Componentes e Entidades (ECS)
- IA e Relações entre Raças
- Mundo e Tiles
- Eventos e Logging
- Adaptador de Terminal (View/Renderer)
- Foco de Entidade (UI)
- Limitações Conhecidas
- Ideias e Próximos Passos


## Visão Geral da Engine
A engine segue o padrão ECS:
- Entities: identificadores numéricos (`number`).
- Components: dados puros guardados em `Map<Entity, T>` por tipo (ex.: `positions`, `healths`).
- Systems: funções que iteram sobre componentes relevantes e produzem efeitos (alteram estado e/ou emitem eventos).

Além do ECS, a engine tem:
- Mundo em grade (`WorldGrid`) com `tiles` e `tick` (contador lógico de tempo de simulação).
- Barramento de eventos (`EventBus`) por tick para desacoplar sistemas (percepção, IA, movimento, combate, log, morte) e servir de base para StorySystem.
- Sistema de log com handlers por tipo de evento para mensagens legíveis.

O loop atual é baseado em um relógio real (`setInterval`), mas a engine foi organizada para facilitar a migração para um scheduler por turnos (ver seção “Ideias e Próximos Passos”).


## Visão de Produto (Roadmap Resumido)
- Scheduler por turnos: velocidades/cooldowns, determinismo e desacoplamento do render.
- Ocupação/Colisão centralizada: camadas e sobreposição controlada (corpse/effect/trap), pronto para `SpatialIndex`.
- Pathfinding (BFS/A*) e FoV (shadow‑casting) com suporte a `blocksVision`.
- StorySystem: narrativa reativa a eventos (rumores, objetivos, consequências).
- Triggers/Effects/Traps: reações a `move`/`enter tile` e efeitos temporais.
- Data‑driven: stats/config por JSON; facções e relações expansíveis.
- RNG determinístico (seeds), save/load e replays.


## Como Rodar
Pré‑requisitos: Node.js 18+.

- Instale dependências: `npm install`
- Rodando em desenvolvimento: `npm run dev`
  - Usa `tsx --watch src/main.ts` e redesenha o terminal a cada tick.

A execução inicial cria um mundo 25x25 e spawna algumas criaturas humanas e orcs aleatórios. O terminal exibe HUD, painel de foco da entidade e log dos últimos eventos.


## Estrutura de Pastas
- `src/main.ts`: ponto de entrada; configura a simulação, agenda ticks e coordena a ordem dos sistemas + render.
- `src/core/`
  - `simulation.ts`: cria/agrega estado da simulação (mundo, ECS, eventos, log, foco) e funções de spawn.
  - `world.ts`: geração do mundo, utilitários de tile e avanço de tick.
  - `tile.ts`: tipos de tile (Empty/Wall) e utilidades (`isWalkable`, `tileToChar`).
  - `math.ts`: helpers de grade (ex.: `inBounds`, `isMovableKind`).
  - `events.ts`: tipos de eventos e barramento (`EventBus`).
  - `log/`: `logState`, `logSystem` e handlers por evento.
  - `ecs/`:
    - `entities.ts`: alias do ID de entidade.
    - `components.ts`: definição dos componentes (Position, Vision, Race, Kind, AIState, Behavior, Health, Attack, Appearance).
    - `state.ts`: estrutura e criação do estado ECS (maps por componente).
    - `systems/`: sistemas de domínio (movement, perception, aiDecision, combat, death).
  - `ai/relations.ts`: relações entre raças (aliado, neutro, inimigo) e helpers (`isEnemy`).
  - `ui/focus.ts`: garante uma entidade focada válida para exibição no painel.
- `src/adapters/terminal/`
  - `view.ts`: monta view models (HUD, mundo, log, painel de foco).
  - `renderer.ts`: imprime o view model no terminal.


## Fluxo do Tick e Ordem dos Sistemas
Em `src/main.ts`, a cada 1000ms:
1. `advanceTick(world)`: incrementa o contador lógico do mundo.
2. `perceptionSystem(sim)`: observadores com `Vision` percebem alvos próximos; emite `entity_seen`.
3. `aiDecisionSystem(sim)`: processa percepções, decide `AIState` (idle/chase/flee/engaged) e pode emitir `ai_mode_changed` e `entity_engaged`.
4. `combatSystem(sim)`: para pares em `engaged`, resolve ataque, dano e morte (eventos `entity_attacked`, `entity_damaged`, `entity_died`).
5. `movementSystem(sim)`: move criaturas não‑engaged (idle: aleatório; chase: aproximação por eixo; flee: aumenta distância). Emite `move`/`blocked_move`.
6. `logSystem(sim)`: traduz eventos em mensagens legíveis e adiciona ao `LogState`.
7. `deathSystem(sim)`: processa `entity_died` (converte em `corpse`, remove IA/combate).
8. `clearEventBus(sim.events)`: limpa eventos do tick.
9. `render(sim)`: renderiza HUD, painel de foco, mundo e log.

Observação: a ordem (IA → combate → movimento) é simples para este protótipo. Projetos maiores podem separar “decidir” de “executar” e usar fases/buffers mais estruturados.


## Componentes e Entidades (ECS)
Componentes principais (ver `src/core/ecs/components.ts`):
- `Position { x, y }`
- `Vision { radius }`
- `Appearance { glyph }`
- `Race { race: 'human'|'dwarf'|'orc' }`
- `Kind { kind: 'creature'|'structure'|'corpse'|'item'|'effect' }`
- `AIState { mode: 'idle'|'chase'|'flee'|'engaged', target? }`
- `Behavior { reactionToEnemy: 'fight'|'flight'|'random' }`
- `Health { current, baseHealth }`
- `Attack { baseDamage }`

Spawns (em `simulation.ts`):
- `spawnHuman`, `spawnDwarf`, `spawnOrc`: setam glyph, visão, vida, ataque e um viés de comportamento.
- `spawnRandomCreature`: seleciona raça e posição andável disponível.


## IA e Relações entre Raças
- Relações (em `ai/relations.ts`): humanos↔anões são aliados; orcs são inimigos de ambos.
- Percepção (`perceptionSystem`): Manhattan distance ≤ `Vision.radius`.
- Decisão (`aiDecisionSystem`):
  - Ao ver um inimigo: comportamento dita reação (`fight` → `chase`, `flight` → `flee`, `random` → decide na hora).
  - Se perseguidor fica adjacente ao alvo: aplica chances simples de “fuga” baseadas em HP baixo e estado atual do defensor; se ninguém fugir, ambos entram em `engaged`.
  - Emite `ai_mode_changed` quando muda `mode/target`.


## Mundo e Tiles
- `createWorld(width, height)`: inicializa grade com paredes e carva salas retangulares + corredores em L, com largura de 1–2.
- Tiles: `Empty` e `Wall`; `isWalkable` define passabilidade.
- Coordenadas e limites: `inBounds` (helpers em `math.ts`).


## Eventos e Logging
Tipos de eventos (em `events.ts`):
- `move`, `blocked_move (wall|out_of_bounds|occupied)`,
- `entity_seen`, `ai_mode_changed`,
- `entity_engaged`, `entity_attacked`, `entity_damaged`, `entity_died`.

`logSystem` encaminha cada evento para um handler em `core/log/handlers/*`, que produz mensagens legíveis e grava em `LogState`. A view do log mostra apenas as últimas N linhas (default 10).


## Adaptador de Terminal (View/Renderer)
- `buildWorldView`: projeta `tiles` e sobrepõe glyphs de entidades por `Position`.
- `buildHudView`: tick, dimensões do mundo e contagem de agentes (componente `Race`).
- `buildFocusedEntityPanel`: detalhes da entidade focada (posição, HP, ataque, comportamento, IA + target). 
- `renderer.ts`: limpa o terminal, imprime HUD, painel, grid e log.


## Foco de Entidade (UI)
- `ensureFocusedEntity`: mantém um `focusedEntity` válido; se o atual não existe mais, escolhe o primeiro disponível.


## Limitações Conhecidas
- Sem pathfinding: perseguição usa “eixo dominante” e fuga maximiza distância de forma local.
- Sem campo de visão (FoV): percepção ignora obstruções por parede.
- Loop por `setInterval`: todos os agentes “agem” em bloco a cada tick.
- Balanceamento e dados hardcoded; sem persistência (save/load) e sem testes automatizados.
- Mundo simples (Empty/Wall) e poucas raças/estados de IA.


## Ideias e Próximos Passos
- Scheduler por turnos (min‑heap por `nextAt`) para velocidades distintas, cooldowns e determinismo de execução.
- Pathfinding (BFS/A*) e FoV (shadow casting) para percepção realista.
- RNG determinístico por seed (replays e testes mais estáveis).
- Serialização do estado (save/load) e testes unitários dos sistemas.
- Mais componentes (velocidade, armadura, efeitos temporais) e mais eventos.
- Input opcional para controlar uma entidade; HUD com barras e tooltips.


## Licença
- Conforme `package.json`, licença ISC.
