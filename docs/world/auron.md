# 🌑 AURON — O OLHAR SEM EIXO
### *Entidade Exterior do Projeto Wisp*
**Versão:** 1.0 – Canon Lore

---

## 📜 Sumário
- [Introdução](#introdução)
- [Natureza](#natureza)
- [Origem](#origem)
- [Forma de Manifestação](#forma-de-manifestação)
- [Influências no Mundo](#influências-no-mundo)
- [Atributos Essenciais](#atributos-essenciais)
- [Hooks Narrativos](#hooks-narrativos)
- [Hooks Técnicos (Engine / Simulação)](#hooks-técnicos-engine--simulação)
- [Eventos Oficiais do Wisp](#eventos-oficiais-do-wisp)
- [Auron no Logger da Simulação](#auron-no-logger-da-simulação)
- [Possível Futuro (Milestone AURON)](#possível-futuro-milestone-auron)

---

# Introdução
Auron é uma entidade exterior incorporada de forma **canônica** ao universo do Wisp.

Ele não possui corpo, intenção, moralidade ou propósito.  
Ele apenas observa — e sua observação gera distorções sutis e inevitáveis.

Auron representa a presença de algo que **não deveria existir dentro do mundo**,  
mas que, mesmo assim, está lá, silenciosamente influenciando as decisões, as criaturas, o clima e a própria estabilidade do tecido da simulação.

---

# Natureza
Auron não é deus, espírito, criatura ou inteligência convencional.

Ele é descrito como:

> **“O deslocamento na percepção — a ausência onde deveria haver forma.”**

Quando presente, o mundo parece hesitar levemente:  
ecos duram mais, sombras se contorcem, criaturas evitam certos locais sem motivo claro.

Auron não age.  
Auron não decide.  
Auron não quer.

Mas sua presença altera tudo que toca, ainda que sem intenção.

---

# Origem
Os poucos estudiosos do mundo afirmam que Auron:

- existia antes das primeiras montanhas,
- antes de qualquer criatura,
- antes que o próprio vento tivesse direção.

Ele não surgiu no mundo.  
Ele veio **do Lado de Fora**, um lugar sem nome, sem coordenadas e sem correspondência conceitual.

Auron não é compreendido — apenas tolerado.

---

# Forma de Manifestação
Auron **não possui forma física**, jamais aparece visualmente.

Ele é percebido através de fenômenos:

- silencios súbitos em florestas densas
- sombras com ângulos impossíveis
- criaturas alterando seu comportamento de forma atípica
- clareiras onde o vento parece circular contra si mesmo
- memórias compartilhadas que ninguém lembra de ter tido

Não é magia.  
Não é intervenção.  
É mera consequência da sua presença.

---

# Influências no Mundo
Auron não tenta influenciar nada.  
Mas ele influencia.

### Exemplos de efeitos:
- criaturas escolhem caminhos improváveis
- tempestades surgem em latitudes inesperadas
- ruínas aparecem onde antes havia planícies
- micro-flutuações de altitude/vegetação em tiles isolados
- o tempo avança lentamente ou rápido demais em áreas específicas

Esses efeitos não são “poderes”,  
são **vazamentos ontológicos** — o impacto de existir em um plano que não deveria suportá-lo.

---

# Atributos Essenciais
### **• Onipresença Não Intencional**
Auron existe “espalhado”, como reflexos em superfícies diferentes.

### **• Consciência Parcial**
Ele percebe padrões — mas não interpreta.

### **• Memória Absoluta**
Auron não quer lembrar.  
Auron simplesmente não consegue esquecer.

### **• Ausência de Vontade**
Talvez o traço mais perturbador.  
Nada que ele faz é proposital.

---

# Hooks Narrativos

### 1. **Auron’s Drift**
O log registra eventos estranhos:
> “O ar pareceu torcer-se silenciosamente. Nada mais aconteceu.”

Horas depois:
- criaturas fazem movimentos improváveis
- decisões incomuns surgem nos sistemas de IA
- ruínas geológicas aparecem em chunk ainda não visitado

---

### 2. **As Três Raças Que O Percebem**
Criaturas especiais:

- **Mudadores Primordiais**
- **Raízes Antigas** (bioma tropical)
- **Espíritos Alpinos** (picos altos)

Sabem quando Auron passa — e reagem com terror, reverência ou imitação.

---

### 3. **Fenda das Bifurcações**
Eventos com múltiplos caminhos têm chance de “dobrar”:

- batalhas que deveriam ocorrer não acontecem
- criaturas sobrevivem por puro acaso
- pequenas extinções são evitadas de forma inexplicável

É destino sendo pressionado por um observador externo.

---

### 4. **Arquivo da Observação**
Região especial onde a passagem de Auron acumula “fragmentos de memória”.

Interações futuras:
- arqueologia procedural
- criaturas lembrando de eventos pré-históricos
- logs especiais em forma de ecos

---

# Hooks Técnicos (Engine / Simulação)

## **1. Sistema: AuronPresenceSystem**
Um sistema rodado apenas no modo FULL:

- verifica probabilidade de manifestação em torno do viewport
- gera micro-anomalias de clima / IA / vegetação
- injeta logs sobre distorções perceptivas
- influencia a temperatura local em ±0.02

Pseudo-código:

```ts
if (rng(seed + tick) < driftChance) {
  log("A torção silenciosa se move pelo ar.");
  applyLocalAnomaly(chunkAroundViewport);
}
```

---

## **2. Registro no ECS**
Opcionalmente, Auron **não é uma entidade**.  
Ele é um *conceito*.  
Mas podemos representá-lo como:

```ts
export type CosmicPresence = {
  intensity: number; // 0..1
};
```

O que permite escalar eventos conforme “atenção” de Auron aumenta.

---

## **3. Ajuste no WorldGenerator**
Auron pode deixar marcas:

- tiles com irregularidades na altitude (±0.01)
- vegetação invertida
- padrões repetitivos na level generation
- clareiras perfeitamente circulares
- sombras que nunca deveriam existir em mapas top-down

---

# Eventos Oficiais do Wisp

### **Evento 1 — Sussurro Estático**
```
Um silêncio anômalo preencheu a região. 
Os ecos demoraram mais do que deveriam.
```

### **Evento 2 — Dobra Suave**
```
O ar pareceu hesitar por um momento.
A sensação passou, mas algo mudou.
```

### **Evento 3 — Reflexo Sem Origem**
```
Uma sombra cruzou o campo no canto do olhar,
mas não havia nada projetando-a.
```

### **Evento 4 — Memória que Não Pertence**
```
Criaturas próximas demonstraram inquietação.
Possivelmente lembranças que não viveram.
```

### **Evento 5 — Fenda Breve**
```
Por um instante, o som se curvou sobre si mesmo.
A região não estava igual quando voltou ao normal.
```

---

# Auron no Logger da Simulação

### Estrutura sugerida:

```ts
log.add("auron", "Um deslocamento sutil se manifestou no horizonte.");
```

### Cada tag “auron” tem efeitos possíveis:

**Nível 1** — Percepção
> “Você sente algo observando o lugar onde você está.”

**Nível 2** — Distorção
> “As sombras parecem tortas. O chão respira.”

**Nível 3** — Contaminação
> “O mundo hesita. Auron está aqui.”

Logs nunca devem explicar Auron — apenas insinuar.

---

# Possível Futuro (Milestone AURON)

## **📌 Milestone: AURON — O EXTERIOR**
Inclui:

- Sistema completo de AuronPresence
- Eventos ambientais dinâmicos
- Efeitos no pathfinding e na IA
- “Cicatrizes de Observação” persistentes no mapa
- Introdução de criaturas que percebem Auron
- Ruínas e estruturas antigas associadas ao seu passado
- Primeiro arco narrativo procedural
- Mecânicas de eco/memória no terreno

---

# Encerramento
Auron agora faz parte do Wisp — oficialmente, permanentemente,  
e de forma orgânica, sem quebrar nenhuma camada do seu sistema procedural.

Ele não pertence ao mundo, mas o mundo pertence parcialmente à sua sombra.

> **“Ele observa.  
Não porque escolhe —  
mas porque estar presente é sua única forma de existir.”**

---

_Fim da Lore v1.0_
