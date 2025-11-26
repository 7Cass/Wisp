# World Generation — Diagramas e Exemplos

Este complemento traz diagramas ASCII do pipeline de geração e exemplos visuais (ASCII) por bioma para referência rápida.

## Pipeline (ASCII)

```
          +--------------------+
          |       seed         |
          +---------+----------+
                    |
                    v
     +--------------+---------------+
     |   Campos escalares (0..1)    |
     |  - Altitude (HeightMap)      |
     |  - Umidade  (MoistureMap)    |
     |  - Temperat.(TemperatureMap) |
     +--------------+---------------+
                    |
                    v
           +--------+---------+
           |     BiomeMap     |
           |  (range-based)   |
           +--------+---------+
                    |
     +--------------+---------------+
     |    Painters por tile        |
     |  - TerrainPainter           |
     |  - VegetationPainter        |
     +--------------+---------------+
                    |
                    v
          +---------+----------+
          |   Chunk tiles      |
          | terrain + veg      |
          +---------+----------+
                    |
                    v
          +---------+----------+
          |  ChunkManager      |<---+ entidades (índice local)
          +----+-----------+---+    |
               |           |        |
               |           +--------+
               |  getVisibleChunks(viewport)
               v
        +------+-------+
        |  Viewport    |
        +------+-------+
               |
               v
     +---------+-----------------+
     |  Sistemas de simulação    |
     | (spawn/move/IA/FoV/story) |
     +---------------------------+
```

Notas:
- Determinismo: os campos escalares usam PRNG determinístico por seed e interpolação contínua (sem costuras entre chunks).
- Camadas adicionais (rios, cavernas, clima) podem entrar após BiomeMap ou como painters extras.

## Exemplos Visuais por Bioma (ASCII)

Legenda (terreno):
- `,` Grass  · `.` Dirt  · `:` Sand  · `~` Water · `≈` Shallow · `%` Swamp · `^` Rock · `*` Snow

Legenda (vegetação) sobreposta (quando houver):
- `Λ` Pine · `♣` Tree · `&` Bush · `$` Berry bush · `"` Tall grass · `,` Grass · `❀` Flower · `|` Reed · `⁕` Lily

Observação: nos exemplos a seguir, a vegetação substitui o caractere do terreno apenas para visualização.

### Tundra
```
***,,*,**,*,**,***,,**
**,,*,***,*,***,*,***
*,,***,**,*,***,*,**,
**,*,**,***,*,***,**,
```
- Terreno base: `*` (Snow) e um pouco de `,` (Grass frio)
- Vegetação: escassa (`,`, `"`, `&` em baixíssima densidade)

### Taiga (Coníferas)
```
,Λ,,Λ,,,Λ,,Λ,,,Λ,,Λ,
,,Λ,,,,Λ,,,,Λ,,,,Λ,,
,Λ,,Λ,,,Λ,,Λ,,,Λ,,Λ,
,,Λ,,,,Λ,,,,Λ,,,,Λ,,
```
- Terreno: `,` (Grass)
- Vegetação: `Λ` (pine) dominante, `,`/`"` ocasionais

### Temperate Forest
```
,♣,&,♣,,♣,&,♣,,♣,&,♣
&,♣,,♣,&,♣,,♣,&,♣,,
,♣,&,♣,,♣,&,♣,,♣,&,
&,♣,,♣,&,♣,,♣,&,♣,,
```
- Terreno: `,` (Grass)
- Vegetação: `♣` (árvore), `&` (arbusto), `,`/`"`

### Grassland / Plains
```
,,,,,",,,,,,,,,",,,,,
,,,,,,,,,",,,,,,,,,,,
,,,,,",,,,,,,,,",,,,,
,,,,,,,,,",,,,,,,,,,,
```
- Terreno: `,` (Grass)
- Vegetação: `,`/`"` (Grass/Tall grass), `❀` ocasional

### Savanna
```
:,,",:,",:,,,,:",:,,,
,,:",:,,",:,,",:,",:,
:,,",:,",:,,,,:",:,,,
,,:",:,,",:,,",:,",:,
```
- Terreno: `.`/`:` (Dirt/Sand)
- Vegetação: `"` (tall grass), `&` (bush) moderado

### Desert
```
::::::::::::::::::::::
::::::::::::::::::::::
::::::::::::::::::::::
::::::::::::::::::::::
```
- Terreno: `:` (Sand)
- Vegetação: `none`

### Swamp
```
%%%%%≈≈%≈≈%%%%≈≈%%%%%
%%≈≈%%%%≈≈%%≈≈%%%%≈≈
%%%%%≈≈%≈≈%%%%≈≈%%%%
%%≈≈%%%%≈≈%%≈≈%%%%≈≈
```
- Terreno: `%` (Swamp) e `≈` (ShallowWater)
- Vegetação: `|` (reed) e `⁕` (lily) em áreas alagadas

### Tropical Forest / Jungle
```
,♣,&,♣,",♣,&,♣,",♣,&,
&,♣,",♣,&,♣,",♣,&,♣,",
,♣,&,♣,",♣,&,♣,",♣,&,
&,♣,",♣,&,♣,",♣,&,♣,",
```
- Terreno: `,` (Grass)
- Vegetação: densa, `♣` (tree), `&` (bush), `"` (tall grass)

### Mountain
```
^^^^^^^***^^^^^***^^^
^^^****^^^^^^***^^^^^
^^^^*^^^^^^^**^^^^^^^
^^^****^^^^^^***^^^^^
```
- Terreno: `^` (Rock) e `*` (Snow) nos picos
- Vegetação: muito escassa

### Shallow Water / Coast
```
~~~~~≈≈≈≈≈≈≈≈≈~~~~~~
~~~~≈≈≈≈≈≈≈≈≈≈≈~~~~~
~~~~~≈≈≈≈≈≈≈≈≈~~~~~~
~~~~≈≈≈≈≈≈≈≈≈≈≈~~~~~
```
- Terreno: `~` (Water) e `≈` (ShallowWater)
- Vegetação: `⁕` (lilies) e `|` (reeds) pontuais

```
Nota: os exemplos são estilizações estáticas para ilustração, não um dump literal da engine.
```

