# Wisp

Wisp é uma mini‑engine de simulação por turnos em TypeScript, baseada em ECS e eventos, com mundo procedural chunkado, IA reativa e storytelling orientado a eventos. Renderizada em ASCII (terminal), foi desenhada para ser clara, extensível e determinística.

- Renderização em terminal (ASCII), sem dependências de game engine.
- Mundo procedural com geração por chunks e `viewport` escalável.
- Arquitetura ECS + EventBus, com sistemas de percepção, IA, movimento, combate, morte e logging.
- Determinismo por seed (RNG próprio) e pipeline de world‑generation reproduzível.
- Base para evolução: scheduler por turnos, pathfinding/FoV, sistema de ocupação/camadas, StorySystem, triggers/efeitos, seeds para replays.


## Sumário
- Visão Geral da Engine
- Como Rodar
- Estrutura de Pastas
- Fluxo do Tick e Ordem dos Sistemas
- Componentes e Entidades (ECS)
- IA e Relações entre Raças
- Mundo e Tiles
 - World Generation
- Eventos e Logging
- Adaptador de Terminal (View/Renderer)
- Foco de Entidade (UI)
- Limitações Conhecidas
- Ideias e Próximos Passos
 - Story System (V1)


## Visão Geral da Engine
A arquitetura completa e decisões de design estão detalhadas em `docs/architecture.md`.

A engine segue o padrão ECS:
- Entities: identificadores numéricos (`number`).
- Components: dados puros guardados em `Map<Entity, T>` por tipo (ex.: `positions`, `healths`).
- Systems: funções que iteram sobre componentes relevantes e produzem efeitos (alteram estado e/ou emitem eventos).

Além do ECS, a engine tem:
- Mundo em grade (`WorldGrid`) com `tick` e acesso via `ChunkManager` a terreno/vegetação.
- Barramento de eventos (`EventBus`) por tick para desacoplar sistemas (percepção, IA, movimento, combate, log, morte) e servir de base para StorySystem.
- Sistema de log com handlers por tipo de evento para mensagens legíveis e auditáveis.

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
- Requisitos: Node.js 18+
- Instalar dependências: `npm install`
- Executar em desenvolvimento: `npm run dev` (usa `tsx --watch src/main.ts`)

Na execução, o terminal exibe HUD (tick/tamanho/agentes), painel de foco da entidade e log dos últimos eventos. O mundo é gerado on‑demand por chunks e os agentes interagem via sistemas (percepção → IA → combate → movimento → morte/log).

## Sistema de Ocupação & Índice Espacial
- Ocupação (`src/core/world/occupancy.ts`): consolida terreno/vegetação/entidades e expõe `canEntityWalkTo`.
- Índice espacial (`src/core/world/chunkManager.ts`): mapas por tile e chunk mantidos por `addEntity/moveEntity/removeEntity`.
- Regras de bloqueio: apenas `creature` e `structure` bloqueiam; `corpse` NÃO bloqueia.
- Níveis de simulação por chunk: `full` (completo), `macro` (simplificado com eventos), `summary` (barato sem eventos).


## Estrutura de Pastas
- `src/main.ts`: ponto de entrada; configura a simulação, agenda ticks e coordena a ordem dos sistemas + render.
- `src/core/`
  - `simulation.ts`: cria/agrega estado da simulação (mundo, ECS, eventos, log, foco) e funções de spawn.
  - `world/`: grid, chunks, viewport, config e geração procedural (terrain/vegetation/biomas).
  - `tile.ts`: tipos de terreno (`TerrainType`) e utilidades (`isWalkableTerrain`, `terrainToChar`).
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


## Loop de Simulação (ordem dos sistemas)
Em `src/main.ts`, a cada tick:
1. `advanceTick(world)`
2. `perceptionSystem(sim)`
3. `aiDecisionSystem(sim)`
4. `combatSystem(sim)`
5. `movementSystem(sim)`
6. `logSystem(sim)`
7. `deathSystem(sim)`
8. `clearEventBus(sim.events)`
9. `render(sim)`

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
- `createWorld(width, height)`: cria metadados do mundo (dimensões/tick).
- Acesso a terreno/vegetação via `ChunkManager` (geração por chunk sob demanda).
- Terrenos (`TerrainType`): Grass, Dirt, Sand, Water, ShallowWater, Swamp, Rock, Snow (e `Wall/Empty` legado).
- Passabilidade: `isWalkableTerrain(terrain)`.


## World Generation
- Visão geral da pipeline, biomas, painters e chunking: `docs/world-generation/README.md`
- Diagramas ASCII e exemplos visuais por bioma: `docs/world-generation/diagrams-and-examples.md`
- Tuning Guide com presets: `docs/world-generation/tuning-guide.md`


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
- Sem pathfinding (perseguição local) e sem FoV (paredes/vegetação não bloqueiam visão).
- Loop baseado em `setInterval` (sem scheduler por velocidade/ação).
- Logs sem ring buffer; dados de balanceamento hardcoded; sem persistência.


## Ideias e Próximos Passos
- Scheduler por turnos (min‑heap por `nextAt`) para velocidades distintas, cooldowns e determinismo de execução.
- Pathfinding (BFS/A*) e FoV (shadow casting) para percepção realista.
- RNG determinístico por seed (replays e testes mais estáveis).
- Serialização do estado (save/load) e testes unitários dos sistemas.
- Mais componentes (velocidade, armadura, efeitos temporais) e mais eventos.
- Input opcional para controlar uma entidade; HUD com barras e tooltips.

## Story System (V1)
- Visão: camada narrativa baseada em eventos do tick, com triggers determinísticos.
- Arquivos principais: `src/core/story/*` (StoryEngine, StoryState, triggers) e handler de log `src/core/log/handlers/story.ts`.
- Evento canônico de estreia: `auron_drift` (manifestação sutil de Auron); gera `story_event_created` e uma linha de log temática.
- Ordem no loop: após ação (`movement/combat/death`) e antes do `LogSystem` para logar no mesmo tick.
- Referências: `docs/architecture.md` (fluxo) e `docs/world/auron.md` (lore + hooks técnicos).


## Contribuindo
- Issues e PRs são bem‑vindos. Estruture contribuições por domínio (core, world, systems, ui, adapters, docs).
- Leia `AGENTS.md` para comandos, estilo e diretrizes (inclui ocupação/índice espacial).
- Commits semânticos ajudam a manter o histórico claro.

## Changelog
- Consulte `docs/changelogs.md` para marcos e mudanças entre versões.

## Licença
- ISC (ver `package.json`).
