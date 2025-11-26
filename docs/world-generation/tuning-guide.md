# World Generation — Tuning Guide (Presets)

Guia prático para ajustar parâmetros de geração. Use como ponto de partida; combine presets conforme o estilo de mundo desejado.

Legenda de parâmetros
- HeightMap: `scale`, `octaves`, `persistence`, `lacunarity` (continentes/altitude)
- MoistureMap: idem (umidade/clima)
- TemperatureMap: idem + `latitudeWeight`, `altitudeWeight`, `noiseStrength`
- TerrainPainter: `seaLevel`
- VegetationPainter: `noiseScale`, `densityThreshold`
- WorldConfig: `worldWidth`, `worldHeight`, `chunkSize`

Valores padrão atuais (createSimulation)
- Height: scale 400, oct 4, pers 0.55, lac 2.1
- Moist.: scale 450, oct 3, pers 0.5,  lac 2.0
- Temp.:  scale 500, oct 4, pers 0.55, lac 2.2, latW 0.7, altW 0.3, noise 0.25
- SeaLevel (terrain): 0.25
- Veg.: noiseScale 0.3, densityThreshold 0.23
- World: 384x384, chunk 64

## Presets de Altitude (continentes)
- Continentes grandes (suaves):
  - Height: scale 600–900, oct 3–4, pers 0.5, lac 2.0
- Arquipélagos (ilhas pequenas):
  - Height: scale 200–300, oct 4–5, pers 0.55–0.6, lac 2.1–2.3
- Montanhoso:
  - Height: scale 400–600, oct 5–6, pers 0.6–0.7, lac 2.2–2.4
- Planícies:
  - Height: scale 700–1000, oct 3, pers 0.45–0.55, lac 2.0–2.2

## Presets de Costas e mares (nível do mar)
- Mais água (oceanos profundos):
  - SeaLevel: 0.3–0.35
- Menos água (costas retraídas):
  - SeaLevel: 0.18–0.22

## Presets de Umidade (clima)
- Mundo seco (mais desertos/savanas):
  - Moisture: scale 500–700, oct 2–3, pers 0.45–0.55, lac 2.0–2.2
- Mundo úmido (florestas/pântanos):
  - Moisture: scale 350–500, oct 3–4, pers 0.55–0.65, lac 2.2–2.4

## Presets de Temperatura
- Mais frio (polos mais amplos, montanhas geladas):
  - Temp: latW 0.8, altW 0.4, noise 0.2, scale 600–800
- Mais quente (trópicos prevalentes):
  - Temp: latW 0.6, altW 0.2, noise 0.3, scale 400–550
- Clima errático (microclimas):
  - Temp: noiseStrength 0.4–0.55 (mantendo lat/alt), oct 5, lac 2.3

## Presets de Vegetação
- Densa (selvas/campos altos):
  - Veg: densityThreshold 0.15–0.2 (maior presença), noiseScale 0.4–0.6
- Rala (clareiras/campo aberto):
  - Veg: densityThreshold 0.3–0.4, noiseScale 0.2–0.3
- Patches amplos (manchas grandes):
  - Veg: noiseScale 0.8–1.4
- Patches pequenos (pontilhado):
  - Veg: noiseScale 0.15–0.25

## Presets Combinados
- “Ilhas Tropicais”:
  - Height: scale 250, oct 4, pers 0.58, lac 2.2
  - SeaLevel: 0.28
  - Moisture: scale 400, oct 3, pers 0.55, lac 2.1
  - Temp: latW 0.6, altW 0.25, noise 0.3, scale 450, oct 4
  - Veg: densityThreshold 0.18, noiseScale 0.45
- “Continente Temperado”:
  - Height: scale 800, oct 3, pers 0.5, lac 2.0
  - SeaLevel: 0.22
  - Moisture: scale 500, oct 3, pers 0.5, lac 2.1
  - Temp: latW 0.7, altW 0.3, noise 0.22, scale 600, oct 4
  - Veg: densityThreshold 0.25, noiseScale 0.35
- “Desértico Montanhoso”:
  - Height: scale 500, oct 5, pers 0.65, lac 2.3
  - SeaLevel: 0.2
  - Moisture: scale 650, oct 2, pers 0.48, lac 2.0
  - Temp: latW 0.65, altW 0.35, noise 0.25, scale 550, oct 4
  - Veg: densityThreshold 0.35, noiseScale 0.25

## Tamanho do Mundo e Chunks
- Mundos pequenos (rápidos p/ testes):
  - worldWidth/worldHeight: 128–256, chunkSize 32–64
- Mundos grandes (exploração):
  - worldWidth/worldHeight: 512–1024+, chunkSize 64

## Boas Práticas
- Ajuste uma dimensão por vez (altura → mares → umidade → temperatura → vegetação).
- Fixe `seed` durante tuning para comparação justa.
- Inspecione bordas de chunk para verificar continuidade.
- Salve presets usados (JSON futuro) para reproduzir mundos.

