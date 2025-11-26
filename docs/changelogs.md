# Changelog

Todas as mudanças relevantes deste projeto serão documentadas aqui.

## [Unreleased]

## [1.2.0] - 2025-11-26

### Added
- Ocupação de tiles e checagem de movimento (`core/world/occupancy.ts`) com razões de bloqueio (mundo, terreno, vegetação, entidade).
- Índice espacial por tile no `ChunkManager` (maps `tileEntities`/`entityToTile`/`entityToChunk`) e APIs `addEntity/moveEntity/removeEntity/getEntitiesAt`.
- Movimento em todos os níveis (`full/macro/summary`) agora consulta `canEntityWalkTo`, respeitando colisões e limites do mundo.

### Behavior
- `corpse` não bloqueia caminho (somente `creature` e `structure` são entidades bloqueadoras).

### Docs
- Guia de contribuição: `AGENTS.md` com estrutura do projeto, comandos e convenções.

## [1.1.0] - 2025-11-25

### Added
- Geração de mundo procedural chunkada com pipeline determinístico:
  - Campos escalares: Altitude (`ValueNoiseHeightMap`), Umidade (`ValueNoiseMoistureMap`), Temperatura (`ValueNoiseTemperatureMap`).
  - Mapa de Biomas (`RangeBasedBiomeMap`) baseado em intervalos e penalidades.
  - Pintura de Terreno (`DefaultTerrainPainter`): mares/costas por altitude (seaLevel), neve em picos.
  - Pintura de Vegetação (`DefaultVegetationPainter`): presença por noise + perfis por bioma.
  - `ChunkManager`: geração preguiçosa por chunk, acesso `getTerrainAt/getVegetationAt`, visibilidade por `Viewport` e níveis de simulação (`full/macro/summary`).
- Utilidades de RNG determinístico (`random/prng`, `random/hashing`).
- Documentação de world‑generation:
  - `docs/world-generation/README.md` (overview: pipeline, biomas, painters, determinismo e integração).
  - `docs/world-generation/diagrams-and-examples.md` (diagramas ASCII e exemplos visuais por bioma).
  - `docs/world-generation/tuning-guide.md` (presets de parâmetros e boas práticas).

### Changed
- README atualizado com descrição expandida (ECS+eventos, chunks/viewport, storytelling via log, roadmap) e links para a documentação de world‑generation.
- `package.json` atualizado com `description` descritiva do projeto/engine.

### Notes
- Base preparada para evoluções: FoV, pathfinding, StorySystem e serviço de ocupação/colisão.

## [1.0.0] - 2025-11-25

### Added
- Engine de simulação baseada em ECS (Entity-Component-System):
  - Componentes: Position, Vision, Appearance, Race, Kind, AIState, Behavior, Health, Attack.
  - Estado ECS com `Map<Entity, T>` por componente e `nextEntityId`.
- Mundo procedural em grid com salas e corredores (`world.ts`), tiles `Empty`/`Wall` e utilidades (`inBounds`, `isWalkable`).
- Sistema de eventos (`EventBus`) e eventos: `move`, `blocked_move`, `entity_seen`, `ai_mode_changed`, `entity_engaged`, `entity_attacked`, `entity_damaged`, `entity_died`.
- IA básica:
  - Percepção por raio (Manhattan) e decisão por comportamento (`fight`, `flight`, `random`).
  - Lógica de “fuga antes do engajamento” condicionada ao HP.
- Sistemas:
  - `perceptionSystem`, `aiDecisionSystem`, `combatSystem`, `movementSystem`, `deathSystem` e `logSystem`.
- Adaptador de terminal:
  - `view.ts` (HUD, mundo, log, painel de foco) e `renderer.ts` (renderização ASCII).
- Spawn helpers (`spawnHuman`, `spawnDwarf`, `spawnOrc`, `spawnRandomCreature`) e `createSimulation`.
- Logs de alto nível com handlers específicos por tipo de evento.
- README com visão geral do projeto e engine.
- Documento de brainstorming sobre ocupação/colisão (`docs/brainstorming/occupancy-and-collision.md`).

### Changed
- Organização do loop principal para ordem clara de sistemas e limpeza do `EventBus` por tick.

### Known limitations
- Sem pathfinding (perseguição gananciosa por eixo) e sem FoV (paredes não bloqueiam visão).
- Loop baseado em `setInterval` (todos agem por tick); não há scheduler por velocidade/ação.
- `LogState` ilimitado; ideal adotar ring buffer em versões futuras.
- Cadáveres (`kind: 'corpse'`) atualmente permanecem em `positions`; política de sobreposição será movida para um módulo de ocupação.

### Docs
- `README.md` contendo visão geral, arquitetura, sistemas, execução e roadmap.
- `docs/brainstorming/occupancy-and-collision.md` propondo API de ocupação/camada e evolução com `SpatialIndex` e `Collider`.

[1.0.0]: #
[1.1.0]: #
