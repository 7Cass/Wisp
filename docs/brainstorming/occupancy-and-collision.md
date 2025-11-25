# Brainstorming: Ocupação e Colisão (Movement/Overlap)

Este documento descreve uma proposta modular para tratar ocupação/colisão de entidades no grid, permitindo sobreposição controlada (ex.: `corpse`, `effect`, `trap`) e preparando terreno para índices espaciais (chunk manager) e evoluções como FoV e pathfinding.


## Objetivos
- Centralizar a regra de “pode ocupar este tile?” em um único módulo reutilizável.
- Permitir sobreposição entre tipos específicos (corpse/effect/trap) sem bloquear movimento.
- Desacoplar sistemas (movement, IA, triggers) da implementação de busca espacial.
- Evoluir facilmente para um `SpatialIndex`/`chunkManager` sem mudar os sistemas de domínio.


## Arquivos/Localização Propostos
- Novo módulo: `src/core/physics/occupancy.ts` (ou `collision.ts`).
- Futuro índice espacial: `src/core/world/spatialIndex.ts` (ou `chunkManager.ts`).


## API (mínimo viável)
Assinaturas sugeridas (TypeScript):

```ts
// occupancy.ts
import { Simulation } from '../simulation';
import { Entity } from '../ecs/entities';

export type OccupyBlockReason = 'out_of_bounds' | 'wall' | 'entity_blocker';

export function entitiesAt(sim: Simulation, x: number, y: number): Entity[];

export function isTileWalkable(sim: Simulation, x: number, y: number): boolean;

/**
 * Verifica se "mover" pode ocupar (x,y).
 * Retorna blocker quando houver uma entidade impedindo o movimento.
 */
export function canOccupy(
  sim: Simulation,
  mover: Entity,
  x: number,
  y: number
): { ok: true } | { ok: false; reason: OccupyBlockReason; blocker?: Entity };

/**
 * Regra de bloqueio entre entidades (por Kind, no mínimo viável).
 */
export function isBlockingFor(
  sim: Simulation,
  mover: Entity,
  blocker: Entity
): boolean;
```

Integração no `movementSystem`:
- Substituir checagens de ocupação por uma chamada a `canOccupy(...)`.
- Em caso negativo, emitir `blocked_move` com `reason` e opcionalmente `blocker` (para logs ricos).


## Regras de Bloqueio (fallback por Kind)
Mínimo viável com `KindId` (sem novo componente):
- `structure` bloqueia todos.
- `creature` bloqueia `creature`.
- `corpse`, `item`, `effect`, `trap` NÃO bloqueiam movimento (mas podem acionar triggers).

Pseudocódigo:

```ts
function isBlockingFor(sim, mover, blocker): boolean {
  const moverKind = sim.ecs.kinds.get(mover)?.kind;
  const blockerKind = sim.ecs.kinds.get(blocker)?.kind;
  if (!moverKind || !blockerKind) return false;

  if (blockerKind === 'structure') return true;
  if (blockerKind === 'creature' && moverKind === 'creature') return true;

  // corpse, item, effect, trap → não bloqueiam
  return false;
}
```

`canOccupy` (resumo):
- Checar bounds e `isWalkable(tile)`.
- Iterar `entitiesAt(x,y)` e, se algum `isBlockingFor(...)` for `true`, bloquear com reason `entity_blocker`.


## Evolução: Componente Collider (mais flexível)
Para granularidade real (camadas, visão, triggers), introduzir um componente:

```ts
// Novo componente (opcional, evolução futura)
export interface Collider {
  layer: 'creature' | 'structure' | 'corpse' | 'item' | 'effect' | 'trap';
  blocksMovement: boolean;        // bloqueia deslocamento
  blocksVision?: boolean;         // útil para FoV
  overlaps?: Set<string>;         // camadas com as quais pode compartilhar tile
}
```

Regras então passam a ler `Collider` quando presente, com fallback para o comportamento por `KindId` se ausente (retrocompatível).

Benefícios:
- Controlar separadamente movimento e visão.
- Regras específicas por entidade (ex.: efeito que bloqueia criatura mas não item).
- Triggers derivados de overlap (ex.: `trap` ativa quando uma `creature` entra no tile).


## Integração com Triggers/Effects/Traps
- Não bloquear movimento para `trap`/`effect`.
- Adicionar um sistema de triggers que “escute” `move` e execute lógicas de `onEnterTile`/`onLeaveTile` com base em `Collider`/`Kind`.
- Eventos potenciais: `entity_entered_tile`, `entity_left_tile` (derivados do `move`).


## Índice Espacial (SpatialIndex/ChunkManager)
Para escalar `entitiesAt(x,y)`:

```ts
// spatialIndex.ts (interface)
export interface SpatialIndex {
  getEntitiesAt(x: number, y: number): Iterable<Entity>;
  onSpawn(entity: Entity, x: number, y: number): void;
  onMove(entity: Entity, fromX: number, fromY: number, toX: number, toY: number): void;
  onDespawn(entity: Entity, x: number, y: number): void;
}
```

- Implementação inicial: `LinearIndex` que simplesmente varre `ecs.positions`.
- Futuro: `ChunkedGridIndex` com buckets por célula/chunk.
- O módulo `occupancy.ts` depende apenas da interface, permitindo trocar implementação sem alterar sistemas.

Integração: sistemas que mudam posição (movement/death/spawn) devem notificar `SpatialIndex`.


## Considerações de Log/Diagnóstico
- Incluir `blocker` no `blocked_move` quando aplicável, para mensagens do tipo: “orc #7 foi bloqueado por human #3”.
- Fornecer pequenas funções helpers para debug (`dumpEntitiesAt(x,y)`), úteis em testes.


## Próximas Tarefas (sugeridas)
1. Criar `src/core/physics/occupancy.ts` com `entitiesAt`, `isTileWalkable`, `isBlockingFor`, `canOccupy` (fallback por Kind).
2. Integrar `movementSystem` para usar `canOccupy` e propagar `blocker` no evento `blocked_move`.
3. (Opcional) Adicionar `SpatialIndex` (interface) e uma implementação linear inicial; adaptar `occupancy.ts` para usar a interface.
4. (Futuro) Introduzir componente `Collider` e migrar regras de bloqueio, separando movimento/visão.
5. (Futuro) Criar sistema de triggers baseado em `move` para `trap/effect`.


## Impacto no Código Existente
- `movementSystem`: simplifica checagens; delega a `occupancy` a regra de ocupação.
- `deathSystem`: se cadáver deve ser sobreposto, manter `positions` (permitido pela regra); se preferir removê-lo do grid, emitir `onDespawn` no `SpatialIndex`.
- `perceptionSystem`: no futuro, pode usar `blocksVision` do `Collider` para FoV.


## Notas Finais
- Manter as regras neste módulo melhora testabilidade (testes unitários para `isBlockingFor`/`canOccupy`).
- Evitar “espalhar” decisões de ocupação em múltiplos sistemas aumenta consistência e reduz bugs.

