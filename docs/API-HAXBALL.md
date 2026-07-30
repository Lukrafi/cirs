# API de Integração HaxBall ↔ CIRS

## Visão Geral

A API permite que o script do HaxBall envie dados das partidas em tempo real para o site CIRS. Toda comunicação é autenticada por **API Key**.

## Autenticação

Todas as rotas exigem o header:

```
x-api-key: <sua-api-key>
```

A API Key é criada pelo admin no painel ou diretamente no banco (tabela `ApiKey`).

## Rotas

### 1. `POST /api/hx/start` — Início da partida

**Body:**
```json
{
  "matchId": "id-opcional-da-partida-no-site",
  "redTeamName": "Vermelho",
  "blueTeamName": "Azul"
}
```

**Resposta:**
```json
{ "reportId": "abc123...", "status": "live" }
```

Guarde o `reportId` para enviar eventos e o resultado final.

---

### 2. `POST /api/hx/event` — Evento durante a partida

**Body:**
```json
{
  "reportId": "abc123...",
  "type": "GOL_VERM|GOL_AZUL|GC_VERMELHO|GC_AZUL|CART_AMAR|CART_2AM|CART_VERM",
  "time": "90:00",
  "msg": "Jogador X marcou",
  "team": 1
}
```

---

### 3. `POST /api/hx/end` — Fim da partida (envio completo)

**Body:**
```json
{
  "reportId": "abc123...",
  "redScore": 3,
  "blueScore": 2,
  "redPossession": 55.3,
  "bluePossession": 44.7,
  "mvpPlayerName": "Jogador X",
  "mvpRating": 9.2,
  "events": [...],
  "playerStats": [...],
  "teamStats": [...],
  "penaltyShootout": {...}
}
```

---

## Integração com o script `real soccer pen (8).txt`

Adicione as linhas abaixo nos seguintes pontos do script:

### Configuração no topo do script (após linha 20):
```javascript
const CIRS_API_URL = "https://cirs-five.vercel.app";
const CIRS_API_KEY = "SUA_API_KEY_AQUI";
let currentReportId = null;
```

### 1. Início da partida — `onGameStart` (após linha 284):
```javascript
// Envia início para a API CIRS
fetch(`${CIRS_API_URL}/api/hx/start`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-api-key": CIRS_API_KEY },
  body: JSON.stringify({ redTeamName: "Vermelho", blueTeamName: "Azul" })
}).then(r => r.json()).then(data => { currentReportId = data.reportId; })
  .catch(e => console.log("CIRS API error:", e));
```

### 2. Gol — `onTeamGoal` (após linha 1219, após `matchLog.addEvent`):
```javascript
if (currentReportId) {
  fetch(`${CIRS_API_URL}/api/hx/event`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": CIRS_API_KEY },
    body: JSON.stringify({
      reportId: currentReportId,
      type: team === 1 ? "GOL_VERM" : "GOL_AZUL",
      time: `${Math.floor(game.time/60)}:${String(game.time%60).padStart(2,'0')}`,
      msg: `${player.name} marcou para ${team === 1 ? "Vermelho" : "Azul"}`,
      team: team
    })
  }).catch(e => console.log("CIRS API error:", e));
}
```

### 3. Cartões — `giveCard` (após linha 1775, após cada `matchLog.addEvent`):
```javascript
if (currentReportId) {
  fetch(`${CIRS_API_URL}/api/hx/event`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": CIRS_API_KEY },
    body: JSON.stringify({
      reportId: currentReportId,
      type: cardType, // "CART_AMAR", "CART_2AM", ou "CART_VERM"
      time: `${Math.floor(game.time/60)}:${String(game.time%60).padStart(2,'0')}`,
      msg: playerName,
      team: team
    })
  }).catch(e => console.log("CIRS API error:", e));
}
```

### 4. Fim da partida — `endMatchReport` (após linha 1934, após `printStatsReport`):
```javascript
if (currentReportId) {
  const payload = {
    reportId: currentReportId,
    redScore: game.redScore,
    blueScore: game.blueScore,
    redPossession: game.redPossessionTicks / (game.redPossessionTicks + game.bluePossessionTicks) * 100,
    bluePossession: game.bluePossessionTicks / (game.redPossessionTicks + game.bluePossessionTicks) * 100,
    mvpPlayerName: mvpPlayer?.name,
    mvpRating: mvpRating,
    events: matchLog.events,
    playerStats: Object.values(game.playerStats),
    teamStats: game.teamStats
  };
  fetch(`${CIRS_API_URL}/api/hx/end`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": CIRS_API_KEY },
    body: JSON.stringify(payload)
  }).then(() => { currentReportId = null; })
    .catch(e => console.log("CIRS API error:", e));
}
```

## Notas

- As chamadas `fetch` não bloqueiam o jogo (são assíncronas)
- Se a API estiver offline, o jogo continua normalmente
- O `currentReportId` garante que eventos vão para a partida correta
- Todos os dados ficam salvos na tabela `MatchReport` e podem ser visualizados no admin
