# Adapter: Ink (CLI React)

Este documento descreve a opção de adapter usando Ink (React para terminal), com foco em por que/como adotar, impactos e um plano incremental. A arquitetura atual de ports-and-adapters facilita plugar o Ink mantendo o core intocado.

## Visão Geral
- Quando usar: TUI rica em terminal, com layout declarativo, painéis, scroll e atalhos de teclado.
- Benefício central: ergonomia do React (componentização, estado, reconciliação) aplicada ao TTY, mantendo baixo acoplamento com o core.

## Complexidade
- Baixa–média: adicionar dependência `ink`, criar componente raiz e mapear o view-model existente.
- Curva de aprendizado: leve para quem já conhece React; APIs de input (`useInput`) e layout (`<Box>`) são diretas.

## O que melhora
- Layout declarativo e responsivo (painéis HUD, Log, Focus, Mapa).
- Re-render controlado (diff automático do React) → menos flicker que `console.clear()`.
- Melhor UX: scroll no log, ajuda/atalhos, destaque de foco, cores/estilos por tile.
- Componentização rápida: trocar apenas a árvore de componentes para experimentar novas UIs.

## O que pode piorar
- Overhead de React no TTY: grandes grids podem custar mais que `console.log` puro.
- Controle fino de performance por linha/char é mais indireto do que libs TUI imperativas.
- Debug de layout baseado em Yoga pode exigir ajustes (padding/margins) em grades muito amplas.

## Usabilidade
- Excelente para TUI rica: atalhos declarativos, barras de status, janelas com scroll e painéis lado a lado.
- Bom caminho para protótipos rápidos e evolução incremental da UI sem sair do terminal.

## Necessidade de Refactor (mínimo e opcional)
1) Contrato de UI (Port)
- Introduzir uma interface leve para adapters:

```ts
export interface UIAdapter {
  mount(sim: Simulation, clock: SimulationClock): void;
  render(sim: Simulation): void;
  dispose(): void;
}
```
- O adapter atual de terminal passa a implementá-la; o adapter Ink também. `main.ts` só escolhe e injeta um.

2) Controller de Ações de UI (opcional)
- Expor um `uiController` com comandos: `moveViewport`, `togglePause`, `focusNext/Previous`, `centerOnFocus`, `setTickDuration(ms)`.
- Vantagem: unifica semântica de ações entre diferentes adapters, evitando que cada um importe helpers do core diretamente.

3) View-Model Compartilhado
- Promover `buildFullView` para um módulo compartilhado (`core/ui/viewModel.ts`).
- Extensões opcionais (compatível com TUI):
  - `world.grid` permanece como `string[][]` (glyphs),
  - opcional: `world.styles?: TileStyle[][]` com `{ fg?, bg?, bold?, dim? }` (para cores no Ink),
  - manter `hud`, `log`, `focus` como já estão.

4) Performance (opcional)
- Se a viewport for muito grande, considerar diff por linha (ex.: memorizar linhas previas e só atualizar as alteradas). Ink geralmente é suficiente sem isso.

## Implementação sugerida (passos)
- Passo 1: Criar `UIAdapter` e adaptar o adapter de terminal para ele (sem mudar comportamento).
- Passo 2: Criar `adapters/ink/InkApp.tsx` e `adapters/ink/index.ts`:
  - `mount`: `render(<InkApp sim={sim} clock={clock} />)`;
  - `render`: opcional (Ink re-renderiza por estado; podemos disparar setState em cada tick);
  - `dispose`: desmontar árvore do Ink.
- Passo 3: Componente `InkApp`:
  - Hooks: `useInput` para teclas (WASD, [, ], f, p, 1/2/3, q), chamando `uiController`.
  - Estado: `view` vindo de `buildFullView(sim, logLines)`; atualizar a cada tick.
  - Layout: `<Box flexDirection="column">` com HUD, Focus, Mapa (render de linhas), Log com scroll.
- Passo 4: Cores/estilos (opcional): usar `chalk` integrado do Ink ou props de cor por linha/tile se expusermos estilos no view-model.

## Mapeamento de teclas (paridade com terminal atual)
- Navegação: `w/s/a/d` → mover viewport.
- Foco: `[` / `]` → anterior/próximo; `f` → centralizar no foco.
- Clock: `p` → pausar/retomar; `1/2/3` → 1000/500/100 ms.
- Sair: `q` (e `Ctrl+C`).

## Notas de Integração
- Node 18+; TS `module: nodenext`: manter imports com extensão `.js` nos `.ts` do projeto.
- Determinismo: evitar `Math.random` no core; preferir `rng` já exposto (facilita replays/depuração visual).
- Render loop: manter `runner.tick()` no clock e disparar atualização de estado no Ink por tick; não bloquear o event loop.

## Roadmap Futuro
- Enriquecer `world.grid` com estilos por tile (fg/bg/bold) para destacar terreno/vegetação/entidades.
- Adicionar painel de ajuda/atalhos e um status de performance (ms por tick, fps render aproximado).
- Se necessário, otimizar grandes viewports com memorization/diff por linha.

## Trade-offs resumidos
- Prós: DX alta, velocidade de entrega, UX superior no TTY, baixo refactor.
- Contras: overhead em grades gigantes; menos controle de micro-performance que soluções TUI imperativas.

## Comandos úteis
- `npm install` (adicionando `ink` quando for implementar).
- `npm run dev` para hot-reload (`tsx --watch src/main.ts`).
- `npx tsc --noEmit` para type-check.

---

Com esse plano, o Ink vira um adapter plugável com alterações mínimas no core e caminho claro para evoluir a experiência TUI sem comprometer a arquitetura.
