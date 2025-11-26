# World Generation

Este documento descreve o subsistema de geração de mundo: objetivos, arquitetura, camadas, geradores, biomas, e como o `ChunkManager` orquestra a criação e acesso dos dados de terreno e vegetação.

## Objetivos
- Determinismo por `seed`: mesmo `(seed, x, y)` gera o mesmo resultado.
- Escalabilidade: geração preguiçosa por chunks, apenas quando necessário.
- Separação de responsabilidades: campos escalares → biomas → pintura de terreno/vegetação.
- Extensibilidade: fácil ajustar parâmetros, trocar componentes e adicionar camadas.

## Espaços de Coordenadas e Chunks
- `WorldGrid` (`src/core/world/world.ts`): contém `width`, `height` e `tick` do mundo.
- `CHUNK_SIZE` (`src/core/world/chunk.ts`): tamanho fixo do chunk em tiles (padrão: `64`).
- Coordenadas:
  - Mundo: `(x, y)` absolutos (0..`worldWidth-1`, 0..`worldHeight-1`).
  - Chunk: `(cx, cy)` = `floor(x / CHUNK_SIZE)`, `floor(y / CHUNK_SIZE)`.
  - Local: `(localX, localY)` relativos ao chunk (0..`CHUNK_SIZE-1`).

`ChunkManager` (`src/core/world/chunkManager.ts`) oferece:
- Conversões `worldToChunk`/`worldToLocal` e `getChunkForTile`.
- Geração preguiçosa: `getChunk(cx, cy)` cria via `WorldGenerator` apenas quando necessário.
- Acesso a camadas: `getTerrainAt`/`getVegetationAt` e os setters correspondentes.
- Índice espacial simples de entidades do chunk: `addEntity`/`moveEntity`/`removeEntity` e `getEntitiesAt` (filtra via `ecs.positions`).
- Visibilidade por viewport: `getVisibleChunks(viewport)` e níveis de simulação via `updateSimulationLevels` (`full`/`macro`/`summary`).

Config de mundo (`src/core/world/config.ts`):
- `chunkSize: 64`, `worldWidth: 384`, `worldHeight: 384` (padrões atuais).

## Camadas do Mundo
- Terreno (`TerrainTile`, `TerrainType` em `src/core/tile.ts`): Grass, Dirt, Sand, Water, ShallowWater, Swamp, Rock, Snow (e `Wall/Empty` legado).
  - Caminhabilidade de terreno: `isWalkableTerrain(tile)`.
- Vegetação (`VegetationTile` em `src/core/world/layers/vegetation.ts`): tipos como `grass`, `bush`, `tree`, `pine_tree`, etc., com `density` e `height`.
  - Sólido/Opaco: `isVegetationSolid` e `isVegetationOpaque` (base para movimento/FoV futuramente).

## Pipeline de Geração
A pipeline é composta por geradores de campos escalares, mapeamento de bioma e pintores de terreno/vegetação. Implementações atuais:

1) Campos escalares (valor normalizado 0..1)
- Altitude: `ValueNoiseHeightMap` (`generators/heightMap.ts`)
  - Parâmetros: `scale`, `octaves`, `persistence`, `lacunarity`.
  - fBm com value-noise 2D interpolado (mulberry32 como PRNG).
- Umidade: `ValueNoiseMoistureMap` (`generators/moistureMap.ts`)
  - Parâmetros similares aos de altitude, tipicamente escalas maiores para regiões climáticas.
- Temperatura: `ValueNoiseTemperatureMap` (`generators/temperatureMap.ts`)
  - Combina latitude (baseada em `y/worldHeight`) + altitude + ruído.
  - Pesos: `latitudeWeight`, `altitudeWeight`, `noiseStrength`.

2) Biomas
- `RangeBasedBiomeMap` (`biome/biomeMap.ts`) classifica (altitude, umidade, temperatura) em um `BiomeDefinition` via penalidades de intervalo.
- Biomas e seus perfis de vegetação/terreno estão em `biome/biomeTypes.ts` (ex.: `tundra`, `desert`, `swamp`, `tropical_forest`, `mountain`, `shallow_water`, `deep_water`).

3) Pintura de Terreno
- `DefaultTerrainPainter` (`generators/terrainPainter.ts`):
  - Garante oceanos/costas por altitude (limiar `seaLevel ~ 0.25` → `Water`/`ShallowWater`).
  - Converte `Rock` em `Snow` em altitudes muito altas (> 0.85).
  - Caso contrário usa `biome.terrain`.

4) Pintura de Vegetação
- `DefaultVegetationPainter` (`generators/vegetationPainter.ts`):
  - Usa um value-noise 2D para decidir presença (`presenceNoise`) com `densityThreshold` (clareiras) e para escolher o tipo (`typeNoise`) com base em `VegetationProfile` do bioma (pesos normalizados).
  - Define `height`/`density` em torno de valores-base por tipo, modulados por `detailNoise` e um fator de umidade.

5) Geração por Chunk
- `ProceduralWorldGenerator` (`generators/worldGenerator.ts`):
  - Para cada tile local do chunk, calcula `worldX/worldY`, avalia campos escalares, escolhe bioma, pinta terreno e vegetação.
  - Fora dos limites do mundo, preenche com `Wall` e vegetação `none`.

## Determinismo e RNG
- PRNG: `mulberry32(seed:number)` em `src/core/random/prng.ts`.
- Hashes determinísticos:
  - `hashStringToInt(seed)` e `seed + '|moisture'`/`'|temperature'`/`'|vegetation'` para diferenciar camadas.
- Os value-noises são determinísticos por célula; a interpolação garante continuidade entre células/chunks (sem costuras).
- Resultado: mesma `seed` e configurações → mesmo mundo, independentemente da ordem/tempo de acesso aos chunks.

## Integração com Simulação
- Criação (ver `src/core/simulation.ts`):
  - Constrói `ValueNoiseHeightMap`, `ValueNoiseMoistureMap`, `ValueNoiseTemperatureMap` com parâmetros (ex.: `scale`, `octaves` etc.).
  - Instancia `RangeBasedBiomeMap`, `DefaultTerrainPainter`, `DefaultVegetationPainter`.
  - Cria `ProceduralWorldGenerator` e o `ChunkManager` com o `WorldGrid`.
  - `viewport` inicial (`createViewport`) e uso de `ChunkManager.getVisibleChunks`/`updateSimulationLevels` para priorização.
- Uso em gameplay:
  - `isWalkableTerrain(chunkManager.getTerrainAt(x,y))` para spawn e movimento.
  - Futuro: `isVegetationSolid`/`isVegetationOpaque` para custo/bloqueio de movimento e FoV.

## Parâmetros Atuais (padrões no createSimulation)
- Altitude: `scale: 400`, `octaves: 4`, `persistence: 0.55`, `lacunarity: 2.1`.
- Umidade: `scale: 450`, `octaves: 3`, `persistence: 0.5`, `lacunarity: 2.0`.
- Temperatura: `scale: 500`, `octaves: 4`, `persistence: 0.55`, `lacunarity: 2.2`, `latitudeWeight: 0.7`, `altitudeWeight: 0.3`, `noiseStrength: 0.25`.
- Vegetação: `noiseScale: 0.3`, `densityThreshold: 0.23`.
- Mundo: `worldWidth: 384`, `worldHeight: 384`, `CHUNK_SIZE: 64`.

Observação: `noiseScale` pequeno gera variação mais rápida (blocos menores); valores maiores suavizam os “blobs” de vegetação.

## Performance e Escalonamento
- Geração preguiçosa por chunk evita carregar o mundo inteiro.
- `getVisibleChunks` retorna apenas os chunks intersectados pelo `viewport` atual.
- `updateSimulationLevels` marca o chunk central como `full`, vizinhos como `macro` e demais como `summary` para guiar throttling de sistemas.
- O `ChunkManager` mantém os tiles gerados em memória; políticas de descarte/limpeza podem ser adicionadas (LRU por distância do viewport).

## Extensões Planejadas
- Rios e erosão: seguir gradiente de altitude, escoamento e carving em `terrain`.
- Suavização de costas: antialiasing entre `Water`/`ShallowWater`/terrenos adjacentes.
- Cavernas/dungeons: subcamada procedural ou subníveis (z-levels).
- `SpatialIndex` dedicado para entidades (substitui varredura no chunk).
- Clima/estações: variar temperatura/vegetação com o tempo (tick → estações).
- Data‑driven: presets de mundo (small/medium/large), perfis de biomas e parâmetros em JSON.
- Story hooks: ancorar POIs e eventos narrativos aos biomas/faixas de altitude/umidade.

## Dicas de Teste/Depuração
- Fixar `seed` para reproduzir mundos; alterar incrementalmente `scale`/`octaves`/`persistence`/`lacunarity`.
- Visualizar separadamente cada camada (terreno/vegetação) no renderer.
- Logar `viewport` e os chunks visíveis para validar `getVisibleChunks`.
- Garantir continuidade entre chunks inspecionando bordas (mesmo `worldX/worldY` leva à mesma saída).

## Pontos de Integração
- Movimento/Spawn: usar `isWalkableTerrain` do terreno; no futuro refinar com serviço de ocupação (corpos, traps, effects).
- Visão/FoV: `isVegetationOpaque` e tipos de terreno podem afetar a linha de visão.
- Rendering: `terrainToChar` e `vegetationToChar` hoje estão nas camadas; podem migrar para adaptadores de UI.

---

Qualquer ajuste ou otimização (ex.: tuning de `seaLevel`, ranges de biomas, ou política de cache de chunks) pode ser feito de forma localizada nos respectivos módulos sem impacto amplo na simulação.

