# Arquitetura do Wisp

Este documento descreve os blocos principais da engine e como eles se conectam em tempo de execução.

## Núcleo
- `ECS` (`src/core/ecs/*`): entidades são `number`; componentes são mapas (`Map<Entity, T>`); sistemas percorrem componentes e emitem eventos.
- `EventBus` (`src/core/events/*`): transporta eventos por tick (ex.: `move`, `blocked_move`, `entity_seen`, `entity_died`).
- `Simulation` (`src/core/simulation.ts`): agrega `world`, `viewport`, `ecs`, `events`, `log` e `chunkManager`; monta o gerador procedural.
- `Runner`/`Clock` (`src/core/simulationRunner.ts`, `src/core/simulationClock.ts`): executam a sequência de sistemas por tick e controlam a cadência.

## Mundo e Chunks
- `WorldGrid` (`world.ts`): largura/altura/tick.
- `Chunk` (`chunk.ts`): região fixa do mundo (tamanho definido por `config.ts`).
- `ChunkManager` (`chunkManager.ts`): acesso a terreno/vegetação, visibilidade por `viewport`, atualização de nível de simulação e índice espacial de entidades.
- Níveis de simulação: `full` (comportamento completo), `macro` (movimento simples com eventos), `summary` (movimento barato sem eventos).

## Ocupação e Colisão
- `occupancy.ts`: consolida estado do tile (terreno, vegetação, entidades) e expõe `canEntityWalkTo`.
- Entidades bloqueadoras: apenas `creature` e `structure`; `corpse` é NÃO bloqueadora (decisão de design para fluidez de movimento e clareza visual).
- Movimento: sempre consultar `canEntityWalkTo` e atualizar posição via `chunkManager.moveEntity` para manter o índice consistente.

## Geração de Mundo
- `worldGenerator.ts`: orquestra campos escalares e painters.
- Campos escalares: `heightMap`, `moistureMap`, `temperatureMap` (value noise + octaves; determinísticos por seed).
- Painters: `terrainPainter` (mar, costa, rocha, neve) e `vegetationPainter` (presença/tipo/variação por noise e bioma).

## Renderização e UI
- Adaptador de terminal (`src/adapters/terminal/*`): `view.ts` monta HUD/mundo/log/painel; `renderer.ts` imprime; `input.ts` lê teclado (WASD, focus, pausa).
- Painel de foco (`core/ui/focus.ts`): garante uma entidade válida para inspeção.

## Fluxo do Tick (resumo)
1. `advanceTick` e atualização do `ChunkManager` (níveis por viewport)
2. `perceptionSystem` → `aiDecisionSystem` → `combatSystem` → `movementSystem`
3. `deathSystem` → `logSystem` → `ensureFocusedEntity`
4. Renderização no terminal

Princípios: determinismo por seed, simplicidade/clareza de sistemas, custo controlado fora do `full`, e logs orientados a eventos para storytelling e depuração.

### Diagrama (ASCII)
```
┌──────────────────┐      ┌──────────────────────────┐
│   Tick Start     │      │      EventBus (per tick) │
│ events.clear()   │◀─────┤  collect events emitted  │
└───────┬──────────┘      └─────────────┬────────────┘
        │                                ▲
        v                                │ emit()
┌──────────────────┐   ┌─────────────────┴─────────────────┐
│ advanceTick()    │→→│ updateSimulationLevels(viewport)   │
└──────────────────┘   └───────────────────────────────────┘
        │
        v
┌──────────────────┐→┌──────────────────┐→┌─────────────────┐→┌──────────────────┐
│ perceptionSystem │ │ aiDecisionSystem │ │  combatSystem   │ │ movementSystem   │
└──────────────────┘ └──────────────────┘ └─────────────────┘ └──────────────────┘
        │                                (emit move/blocked/engage/damage/die)
        v
┌──────────────────┐→┌──────────────────┐→┌──────────────────────┐→┌────────────────┐
│   deathSystem    │ │    logSystem     │ │ ensureFocusedEntity  │ │   render()     │
└──────────────────┘ └──────────────────┘ └──────────────────────┘ └────────────────┘
```
