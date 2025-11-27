Etapa 0 — Estado Atual do Código (auditoria)

Esta seção descreve exatamente o que existe hoje na codebase para o ciclo de vida e como está integrado ao loop da simulação.

Sistemas presentes (src/main.ts):
- advanceTick → incrementa world.tick.
- chunkManager.updateSimulationLevels(viewport) → define simulationLevel por chunk.
- perceptionSystem → emite entity_seen.
- aiDecisionSystem → decide idle/chase/flee/engaged; emite entity_engaged e ai_mode_changed.
- combatSystem → emite entity_attacked, entity_damaged, entity_died.
- movementSystem → emite move e blocked_move; sincroniza posição via chunkManager.moveEntity.
- deathSystem → recebe entity_died; marca Kind = 'corpse' e remove stats de combate.
- storySystem → triggers (Auron drift/decay); emite story_event_created.
- logSystem → percorre todos os eventos e loga; inclui story handler.

EventBus (src/core/events/eventBus.ts, src/core/simulationRunner.ts):
- events.clear() é chamado no início de cada tick (SimulationRunner.tick()).
- Os eventos do tick corrente ficam disponíveis até o próximo início de tick.

Ocorrência/ocupação (src/core/world/occupancy.ts):
- Apenas 'creature' e 'structure' bloqueiam (corpses são não-bloqueantes).
- Todos os movimentos usam canEntityWalkTo + chunkManager.moveEntity (regra do projeto).

⸻

Etapa 1 — Objetivos, Escopo e Restrições (V1 revisado)

🎯 Objetivos do Life Cycle V1
1. Introduzir fome/necessidades (Needs) com emissões de eventos e efeito real (morte por fome via entity_died).
2. Adicionar decomposição de cadáveres (CorpseDecay) com remoção consistente (ECS + ChunkManager) e evento próprio.
3. Preparar terreno para população controlada por Spawners (V1.2), mantendo determinismo e baixo custo.

🚫 Não-objetivos imediatos
- Busca ativa por comida/água com pathfinding.
- Dieta avançada e nodes de recurso.
- Reproduções biológicas, facções, moods.

⚙️ Restrições
- Respeitar o índice espacial: nunca alterar ecs.positions sem sincronizar via chunkManager.
- Manter custo baixo fora de chunks 'full'.
- Determinismo: novos sistemas devem usar sim.rng; refactor de RNG existente fica fora deste V1.

⸻

Etapa 2 — Arquitetura de Alto Nível

Proposta de organização (V1.1 + V1.2):
```text
core/
  ecs/
    components.ts       // adicionar Needs, Diet (opcional), Spawner, Corpse(decay) opcional
    systems/
      needs.ts          // incrementa fome, emite hunger_critical, emite entity_died ao estourar
      corpseDecay.ts    // decrementa decay, remove entidade com segurança e emite corpse_decayed
      spawner.ts        // (V1.2) controla população e emite entity_spawned
  world/
    occupancy.ts        // já blocos consistentes; corpos não bloqueiam
```

Integração no tick (ordem proposta):
1) advanceTick → 2) updateSimulationLevels → 3) perception → 4) aiDecision → 5) combat →
6) movement → 7) needs → 8) death → 9) corpseDecay → 10) story → 11) log

Racional:
- needs antes de death para gerar entity_died por fome; death processa cadáver.
- corpseDecay após death para poder remover cadáveres criados neste tick.
- story antes de log para story_event_created aparecer no log.

⸻

Etapa 3 — Modelo de Dados e Eventos

Componentes (novos):
```ts
// V1.1
interface NeedsComponent {
  hunger: number;          // 0 = cheio; 1 = morte por fome
  hungerThreshold: number; // acima disto, crítico
  metabolismRate: number;  // incremento por tick
}

// Opcional (placeholder futuro)
interface DietComponent {
  foodTags: string[];      // ex.: ['berries', 'flesh']
}

// V1.2
interface SpawnerComponent {
  archetype: string;       // id de archetype simples
  cooldown: number;        // ticks entre spawns
  cooldownRemaining: number;
  maxAlive: number;        // limite por área
  radius?: number;         // área de controle
}

// Opcional: caso queira controlar via componente
interface CorpseComponent {
  decayTicks: number;
  maxDecayTicks: number;
}
```

Eventos (novos em src/core/events.ts):
```ts
// V1.1
type HungerCritical = { type: 'hunger_critical'; payload: { entity: number; hunger: number; tick: number } };
// Auxiliar para Story/Log; NUNCA substitui entity_died no core
type EntityStarved = { type: 'entity_starved'; payload: { entity: number; tick: number } };
type CorpseDecayed = { type: 'corpse_decayed'; payload: { entity: number; tick: number } };

// V1.2
type EntitySpawned = { type: 'entity_spawned'; payload: { entity: number; position: {x:number;y:number}; tick: number } };
```

Regras importantes:
- Starvation: NeedsSystem deve emitir `entity_died` quando hunger >= 1. `entity_starved` é opcional/auxiliar para Story/Log.
- CorpseDecay: emissão de `corpse_decayed` após remoção segura da entidade.

⸻

Etapa 4 — Pipeline do Tick (detalhado)

NeedsSystem (V1.1):
```ts
for each entity with Needs:
  hunger += metabolismRate
  if (hunger >= hungerThreshold) emit hunger_critical
  if (hunger >= 1):
    emit entity_died  // deathSystem já converte em cadáver
    // opcional: emit entity_starved (apenas Story/Log)
```

CorpseDecaySystem (V1.1):
```ts
for each entity marcada como cadáver (Kind = 'corpse' ou CorpseComponent):
  decayTicks -= 1
  if (decayTicks <= 0):
    // Remoção consistente (ordem explícita)
    chunkManager.removeEntity(entity)
    ecs.positions.delete(entity)
    ecs.kinds.delete(entity)
    ecs.appearances.delete(entity)
    ecs.visions.delete(entity)
    ecs.aiStates.delete(entity)
    ecs.healths.delete(entity)
    ecs.attacks.delete(entity)
    ecs.behaviors.delete(entity)
    emit corpse_decayed
```

SpawnerSystem (V1.2):
```ts
for each Spawner:
  cooldownRemaining -= 1
  if (cooldownRemaining <= 0):
    if (aliveInArea < maxAlive):
      // escolher posição walkable usando canEntityWalkTo + sim.rng
      // criar entidade via archetype simples
      chunkManager.addEntity(entity, x, y)
      emit entity_spawned
    cooldownRemaining = cooldown
```

⸻

Etapa 5 — Determinismo (escopo)

- Aplicar `sim.rng` nos novos sistemas (Needs/CorpseDecay/Spawner) para qualquer aleatoriedade (ex.: escolha de tile no spawner).
- Manter `Math.random` existente em sistemas atuais fora do escopo desta milestone (refactor posterior).

⸻

Etapa 6 — Testes Recomendados (node:test)

- NeedsSystem: incrementa hunger; emite hunger_critical no threshold; emite entity_died ao atingir 1.
- CorpseDecaySystem: decrementa, remove com `chunkManager.removeEntity` + limpeza de mapas ECS; emite corpse_decayed.
- SpawnerSystem: respeita `maxAlive` e `cooldown`; usa `canEntityWalkTo`; emite entity_spawned.

⸻

Etapa 7 — Roadmap (V1.1 → V2)

V1.1 — Ciclo orgânico mínimo
- Components: Needs (+ opcional Corpse para controle de decay).
- Sistemas: Needs + CorpseDecay.
- Eventos: hunger_critical, entity_starved (aux), corpse_decayed.

V1.2 — População controlada
- Component: Spawner; Sistema: Spawner; Evento: entity_spawned.
- Determinismo no spawn (usar sim.rng), posicionamento walkable.

V2 — Ecologia e narrativa
- Dieta básica, busca simples por alimento, integração Story com spawn/starved/decay.
- Índices e orquestração por região/bioma conforme custo.

⸻

Resumo

O estado atual fornece base sólida (movimento, IA, combate, morte e ocupação consistente). O V1 introduz fome e decomposição com regras determinísticas e remoção segura, e prepara o terreno para spawners no V1.2. Eventos auxiliares (entity_starved) servem para Story/Log, enquanto o core se apoia em entity_died e corpse_decayed. Isso mantém o loop simples, previsível e pronto para evoluções do V2.
