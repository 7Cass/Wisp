# Changelog

Todas as mudanças relevantes deste projeto serão documentadas aqui.

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

