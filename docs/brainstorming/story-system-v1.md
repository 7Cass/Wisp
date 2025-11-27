Etapa 0 — Estado Atual do Código (auditoria)

Esta seção descreve exatamente o que existe hoje na codebase para o StorySystem e como está integrado ao loop da simulação.

Arquivos relevantes (src/core/story/**):
- storyEvent.ts: define StoryEventType apenas para 'auron_drift' e o tipo concreto AuronDriftStoryEvent.
- storyState.ts: StoryState com nextEventId e auron (presenceIntensity, lastDriftTick). Não há timeline de eventos.
- storyTrigger.ts: base de triggers (StoryTrigger/Context) e helper runStoryTriggers().
- triggers/auronDriftTrigger.ts: trigger randômico/decay de Auron que aumenta presenceIntensity e emite 'auron_drift'.
- storyRegistry.ts: registra triggers padrão (AuronDriftTrigger).
- storySystem.ts: StoryEngine que roda triggers, emite 'story_event_created' no EventBus; aplica decay de Auron quando não há drift.

Integração com o loop do tick:
- SimulationRunner.tick() limpa o EventBus no início do tick e executa os sistemas em ordem.
- Em main.ts, a ordem é: advanceTick → updateSimulationLevels → perception → aiDecision → combat → movement → death → storySystem → logSystem → UI systems.
- LogSystem percorre sim.events.events e roteia para handlers; story_event_created é tratado em log/handlers/story.ts, que formata o drift de Auron.

Observações importantes do estado atual:
- StoryState não mantém uma timeline (events[]); apenas ID e estado de Auron.
- StoryEvent é específico de Auron ('auron_drift'); não há forma genérica (kind/actors/location/tags/summary).
- Não existem padrões derivados de eventos brutos (morte/combate/movimento/percepção) ainda.
- Emissão: o StorySystem emite story_event_created no EventBus, e o LogSystem consome e loga.

⸻

Etapa 1 — Objetivos, Escopo e Restrições (atualizado)

🎯 Objetivos do Story System V1 (recalibrado ao estado atual + refactor curto)
1. Converter eventos brutos em “eventos de história” e manter uma timeline em memória.
   - Continuar emitindo story_event_created para integração com LogSystem.
   - Adicionar uma timeline em StoryState (events[]) com StoryEvent genérico.
2. Manter uma “Story Timeline” independente do log de debug.
   - LogSystem segue separado; StoryState armazena o que é relevante para UI e replays.
3. Ser read-only em relação à simulação no V1.
   - Observa eventos e atualiza StoryState; não altera o mundo.
4. Ser chunk-agnostic (full/macro/summary).
   - Consumir apenas dados presentes nos eventos + consultas leves, evitando custo fora de chunks full.

🚫 Não-objetivos do V1
- Sagas/arcos longos, capítulos e progressão narrativa complexa.
- Persistência em disco.
- Decisões de gameplay (spawn/buffs/maldições) dirigidas pela história.
- Sofisticação por factions/regiões.

⚙️ Restrições / Considerações de integração
- Usamos EventBus único (simulation + story) no V1.
- O EventBus é limpo no início do tick; storySystem e logSystem leem sim.events.events dentro do mesmo tick.
- O StorySystem roda antes do LogSystem para que story_event_created esteja disponível aos handlers.

⸻

Etapa 2 — Arquitetura de Alto Nível (atual + proposta)

Estado atual (resumo):
- Engine baseada em triggers (StoryEngine + StoryTrigger + AuronDriftTrigger).
- Emite story_event_created no EventBus; LogSystem formata o texto.

Proposta de organização (V1 refactor curto, preparando V2):
```text
core/
  story/
    storyState.ts          // incluir timeline + índices futuros
    storyTypes.ts          // tipos genéricos: StoryEvent, Actor, Tag, Location
    storyText.ts           // helpers determinísticos de formatação
    storySystem.ts         // processa eventos brutos + executa triggers
    registry.ts            // triggers registrados (Auron, etc.)
    triggers/
      auronDriftTrigger.ts // permanece como fonte “mística”
    patterns/
      combatPatterns.ts    // entity_attacked/damaged/died → death/kill
      movementPatterns.ts  // blocked_move significativo → blocked_path
      perceptionPatterns.ts// entity_seen → encounter
```

⸻

Etapa 3 — Modelo de Dados (atual vs. proposto)

Atual (código):
```ts
// storyState.ts
export interface StoryState {
  nextEventId: number;
  auron: { presenceIntensity: number; lastDriftTick: number | null };
}

// storyEvent.ts
export type StoryEventType = 'auron_drift';
export interface AuronDriftStoryEvent { id: number; type: 'auron_drift'; tick: number; intensityDelta: number; }
```

Proposto (V1 refactor):
```ts
// storyTypes.ts
export type StoryEventKind =
  | 'kill'
  | 'death'
  | 'encounter'
  | 'blocked_path'
  | 'environment'
  | 'misc';

export interface StoryActorRef { entity: number; race?: string; kind?: string }
export interface StoryLocation { x: number; y: number; biomeId?: string; terrain?: string }
export interface StoryTag { type: 'violence' | 'travel' | 'exploration' | 'survival' | 'mystic' | 'auron_hint' | string }

export interface StoryEvent {
  id: number;
  tick: number;
  kind: StoryEventKind;
  actors: StoryActorRef[];
  location: StoryLocation;
  summary: string;
  details?: string;
  tags: StoryTag[];
  meta?: Record<string, unknown>;
}

// storyState.ts (refactor)
export interface StoryState {
  nextId: number;              // rename de nextEventId
  events: StoryEvent[];        // timeline global
  auron: { presenceIntensity: number; lastDriftTick: number | null };
}
```

Ajuste do evento de Auron (compatível):
- Transformar o drift de Auron em StoryEvent genérico com kind: 'environment' e tag: 'auron_hint'.
- Manter um helper para mapear o trigger atual para o formato genérico (sem quebrar LogSystem).

⸻

Etapa 4 — Pipeline do Tick (atualizado)

Fluxo real no código hoje:
1. SimulationRunner.tick(): limpa EventBus no começo do tick.
2. Roda systems fundamentais (perception/ai/combat/movement/death) que emitem eventos.
3. storySystem(sim):
   - Cria StoryRuntimeContext (tick, rng, story, events).
   - Executa triggers (Auron) via StoryEngine → emite story_event_created.
   - Aplica decay de Auron quando não há drift no tick.
4. logSystem.process(sim): consome todos os events do tick (inclusive story_event_created) e loga.

Refactor curto para V1:
- Em storySystem(sim): além dos triggers, processar eventos brutos em padrões (combat/movement/perception) e produzir StoryEvents genéricos.
- Adicionar cada StoryEvent à timeline (sim.story.events) e emitir story_event_created.

⸻

Etapa 5 — Padrões do V1 (mínimo útil)

1) Death / Kill
- Entrada: entity_died; contexto recente opcional de entity_attacked/entity_damaged.
- Saída: StoryEvent kind 'death' e/ou 'kill'; actors: morto, killer (se houver); tags: ['violence']; summary via storyText.ts.

2) Blocked path significativo
- Entrada: blocked_move quando a entidade está engajada/caçando/fugindo (usar entity_engaged recente ou ai_mode_changed para to: 'engaged', se aplicável).
- Saída: StoryEvent kind 'blocked_path' com tags: ['travel'] ou ['survival']. Ignorar colisão trivial sem contexto.

3) Encounter simples
- Entrada: entity_seen com distância pequena e espécies diferentes.
- Saída: StoryEvent kind 'encounter'; tags: ['exploration'] ou indício de perigo se combinação sugerir risco.

Observação: manter custo baixo em chunks não-full. Evitar consultas caras; preferir dados já presentes nos eventos e acessos O(1) em ECS.

⸻

Etapa 6 — Texto (summary/details)

- Adicionar core/story/storyText.ts com helpers determinísticos (baseados em event.id) para variações estáveis.
- Mover o texto do drift de Auron de log/handlers/story.ts para storyText.ts e consumi-lo ali.
- Log handler deve apenas receber StoryEvent e delegar formatação para storyText.

⸻

Etapa 7 — V2 (roadmap e mudanças maiores)

Motor de padrões e arcos:
- “StoryWatchers”/“Rules” que leem a timeline e disparam arcos (multi-eventos, thresholds por região/bioma).
- Auron como watcher que reage a combinações (ex.: 3 massacres em florestas frias → omen).

Estrutura de dados e índices:
- Índices por entidade/região/bioma para consultas rápidas (byEntity, byRegion).
- Compactação/sumário por chunk/simulationLevel (full/macro/summary) com budgets de CPU.

Infra de eventos:
- Separar bus de SimulationEvents e StoryEvents (evita poluição e simplifica handlers).
- API de observação para UI timeline (paginada/filtrável por tags/atores/região).

Persistência e replays:
- Persistir timeline (opcional) e seeds de eventos para replays determinísticos.
- Export de “crônicas” com templates (detalhes fora do escopo imediato).

Qualidade e testes:
- Testes com node:test para padrões (combate/movimento/percepção) e determinismo do texto.
- Fakes de EventBus e Rng (usar sim.rng, evitar Math.random).

⸻

Etapa 8 — Refactors Recomendados (explícitos e agressivos onde necessário)

1) Modelo de dados
- Renomear StoryState.nextEventId → nextId.
- Adicionar StoryState.events: StoryEvent[].
- Introduzir storyTypes.ts com o shape genérico; manter compatibilidade no LogSystem.

2) Evento de Auron
- Mapear AuronDrift para StoryEvent genérico (kind 'environment', tag 'auron_hint', meta: { intensityDelta }).
- Opcional: manter tipo específico apenas internamente ao trigger para cálculo; externo sempre genérico.

3) Pipeline em storySystem.ts
- Antes/depois de triggers, rodar extratores de padrões (patterns/*) sobre sim.events.events.
- Para cada StoryEvent criado: push em sim.story.events e emitir story_event_created.

4) Organização de arquivos
- Criar pastas story/patterns e story/storyText.ts.
- storyRegistry.ts → registry.ts (opcional) para nome consistente.
- Manter imports com extensões explícitas (.js) conforme NodeNext.

5) Log handler
- Simplificar: consumir StoryEvent genérico e chamar storyText.ts para texto.
- Variantes determinísticas por event.id (como já feito no drift).

6) Custos e níveis de simulação
- Garantir que extratores verifiquem simulationLevel/chunk quando necessário e evitem trabalho caro.

7) Testes
- Adicionar testes unitários mínimos para: morte/kill, encounter, blocked_path significativo, e texto determinístico.

Compatibilidade e migração
- Passo 1: introduzir tipos genéricos e timeline; adaptar Auron para emitir ambos (antigo + genérico) se for necessário numa transição curta; alvo final é apenas o genérico.
- Passo 2: mover formatação para storyText.ts; atualizar story handler para usar o novo módulo.
- Passo 3: adicionar padrões do V1 e validar timeline + logs.

⸻

Resumo

O que temos hoje é um esqueleto sólido (triggers + emissão + log) com um primeiro evento de Auron. Para cumprir o V1 definido e preparar o V2, precisamos:
- Generalizar o modelo de StoryEvent e introduzir a timeline.
- Extrair padrões mínimos (death/kill, blocked_path, encounter) a partir de eventos brutos.
- Centralizar a formatação textual e manter determinismo.
Com isso, abrimos espaço para V2 (watchers/arcos, índices, persistência e bus separado) sem reescrever o núcleo.
