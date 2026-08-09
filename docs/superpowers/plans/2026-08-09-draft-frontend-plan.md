# Draft Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar a nova experiência frontend do Draft, mantendo o backend intacto e preparando contratos substituíveis para gols, Copa e histórico.

**Architecture:** `draft.js` continuará orquestrando o ciclo da tela. `draft-data.js` normalizará titulares, OVR, fases e eventos; `draft-events.js` cuidará da apresentação dos eventos ao vivo; `draft-history.js` cuidará dos accordions do histórico. `draft.html` carregará esses módulos antes do orquestrador, e `draft.css` concentrará a linguagem visual compartilhada.

**Tech Stack:** HTML5, CSS vanilla, JavaScript vanilla/IIFE compatível com navegador, Node.js `node:test` para funções puras.

## Global Constraints

- Alterar somente arquivos frontend em `frontend-main/`; o backend atual permanece fonte oficial de resultado, placar, OVR retornado, recompensa, saldo e histórico.
- Os cards Copa do Mundo e Amistoso aparecem nessa ordem e iniciam fechados com `aria-expanded="false"`.
- A Copa expõe oito etapas lineares: 3 jogos de grupos, 16 avos, oitavas, quartas, semifinal e final; não criar tabela, classificação, pontuação ou chaveamento.
- Eventos de gol no frontend devem aceitar `minute`, `playerId`, `playerName`, `position` e `team`; não implementar probabilidade ou autoria oficial no frontend.
- O botão de jogar exige 11 titulares válidos com `is_starter === true` e `squad_position` preenchida.
- O saldo atualizado deve usar `setUserCoins(new_balance)` e atualização reativa; não usar `window.location.reload()`.
- Nenhum teste pode depender de backend real, rede ou dados de produção.

---

### Task 1: Contratos e normalização do Draft

**Files:**
- Create: `frontend-main/js/draft-data.js`
- Create: `frontend-main/tests/draft-data.test.js`

**Interfaces:**
- Produces `DraftData.CUP_PHASES`, `DraftData.getValidStarters(players)`, `DraftData.calculateTeamOvr(players)`, `DraftData.getPhase(index)`, `DraftData.normalizeGoalEvent(event, fallbackTeam)` e `DraftData.normalizeGoals(events, fallbackTeam)`.
- `getValidStarters` considera somente jogadores com `is_starter === true` e `squad_position` não vazia.
- `calculateTeamOvr` devolve `null` sem jogadores válidos e arredonda a média de `overall ?? ovr`.
- `normalizeGoalEvent` aceita dados parciais sem inventar autor; usa `playerName` como string vazia quando ausente e `minute` como `null` quando inválido.

- [ ] **Step 1: Write the failing test**

Adicionar testes Node que verifiquem:

```js
test('conta apenas titulares válidos e calcula o OVR arredondado', () => {
  const players = [
    { is_starter: true, squad_position: 'GK', overall: 80 },
    { is_starter: true, squad_position: 'ST', overall: 91 },
    { is_starter: true, squad_position: '', overall: 99 },
  ];
  assert.equal(DraftData.getValidStarters(players).length, 2);
  assert.equal(DraftData.calculateTeamOvr(players), 86);
});

test('expõe as oito fases da Copa na ordem do fluxo', () => {
  assert.deepEqual(DraftData.CUP_PHASES.map(phase => phase.label), [
    'Fase de Grupos — Jogo 1/3', 'Fase de Grupos — Jogo 2/3',
    'Fase de Grupos — Jogo 3/3', '16 avos', 'Oitavas de Final',
    'Quartas de Final', 'Semifinal', 'Final',
  ]);
});

test('normaliza evento com campos opcionais sem criar dados falsos', () => {
  assert.deepEqual(DraftData.normalizeGoalEvent({ minute: 23, playerName: 'Neymar' }, 'USER'), {
    minute: 23, playerId: null, playerName: 'Neymar', position: null, team: 'USER',
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test frontend-main/tests/draft-data.test.js`

Expected: FAIL because `frontend-main/js/draft-data.js` and `DraftData` do not exist.

- [ ] **Step 3: Write minimal implementation**

Implement a browser/CommonJS-compatible IIFE in `draft-data.js`, keeping the phase array immutable and exporting the five functions through `window.DraftData` or `module.exports`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test frontend-main/tests/draft-data.test.js`

Expected: all contract tests PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend-main/js/draft-data.js frontend-main/tests/draft-data.test.js
git commit -m "feat: add draft frontend data contracts"
```

### Task 2: Cards dos modos, preview e estilos compartilhados

**Files:**
- Modify: `frontend-main/draft.html`
- Modify: `frontend-main/css/draft.css`

**Interfaces:**
- Produces DOM nodes `#draft-modes`, `#mode-card-cup`, `#mode-card-friendly`, `#mode-content-cup`, `#mode-content-friendly`, `#cup-phase-label`, `#starter-status`, `#player-team-ovr` and `#btn-start-draft`.
- `draft.js` will bind mode headers using `[data-mode-toggle]`, read `data-mode`, and update `aria-expanded` plus `is-open`.

- [ ] **Step 1: Write the failing test**

Create a static Node assertion in `frontend-main/tests/draft-markup.test.js` that reads `draft.html` and verifies Copa occurs before Amistoso, both toggles have `aria-expanded="false"`, and there is no group-table/classification markup.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test frontend-main/tests/draft-markup.test.js`

Expected: FAIL against the current single-preview markup.

- [ ] **Step 3: Write minimal implementation**

Wrap the current preview in two closed mode cards. Keep the existing match preview markup reusable, add Copa phase copy and a visible starter/OVR summary, use semantic buttons for headers, and add CSS for collapsed/expanded states, chevron rotation, disabled CTA feedback, scoreboard stacking and mobile layout. Do not add group tables or new backend calls.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test frontend-main/tests/draft-markup.test.js`

Expected: all static markup assertions PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend-main/draft.html frontend-main/css/draft.css frontend-main/tests/draft-markup.test.js
git commit -m "feat: add collapsible draft modes"
```

### Task 3: Eventos de gol durante a partida

**Files:**
- Create: `frontend-main/js/draft-events.js`
- Modify: `frontend-main/css/draft.css`
- Create: `frontend-main/tests/draft-events.test.js`

**Interfaces:**
- Produces `DraftEvents.renderGoalEvent(container, event, context)` and `DraftEvents.renderGoalEvents(container, events, context)`.
- Consumes normalized `GoalEvent` objects from `DraftData`; `context` contains `teamName` and `opponentName` only.
- The renderer must create text nodes/DOM properties rather than interpolating untrusted player names into HTML.

- [ ] **Step 1: Write the failing test**

Add a Node test using a minimal DOM fixture or exported formatter helper that verifies a goal renders minute `23'`, player name `Neymar`, a goal indicator and the correct team label, while a missing minute renders `—` instead of `undefined`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test frontend-main/tests/draft-events.test.js`

Expected: FAIL because `draft-events.js` does not exist.

- [ ] **Step 3: Write minimal implementation**

Implement the renderer and event row classes used by `draft.css`. It must support a sequence arriving incrementally, preserve accessible `role="log"` behavior, and leave official scorer probability/simulation to the API. Include a clearly named adapter path for optional `goal_events`; the adapter may return an empty list when absent.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test frontend-main/tests/draft-events.test.js`

Expected: all event-rendering tests PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend-main/js/draft-events.js frontend-main/css/draft.css frontend-main/tests/draft-events.test.js
git commit -m "feat: render draft goal events"
```

### Task 4: Histórico expansível com gols

**Files:**
- Create: `frontend-main/js/draft-history.js`
- Modify: `frontend-main/css/draft.css`
- Create: `frontend-main/tests/draft-history.test.js`

**Interfaces:**
- Produces `DraftHistory.render(container, history, options)` and `DraftHistory.getGoals(match)`.
- Consumes current history fields plus optional `goal_events` or `goals` arrays.
- Each row uses a unique details id, starts closed, toggles `aria-expanded`, and keeps the compact summary visible.

- [ ] **Step 1: Write the failing test**

Add tests that verify a history match with two goals exposes both player names/minutes in its details payload and that a match without goal data returns an empty list without fabricating scorers.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test frontend-main/tests/draft-history.test.js`

Expected: FAIL because `draft-history.js` does not exist.

- [ ] **Step 3: Write minimal implementation**

Move history row creation out of `draft.js` into the module, preserving existing opponent flag, score, result and reward content. Add an accessible details button/panel and use `DraftEvents` for goal rows when available; otherwise show a concise “eventos não fornecidos pela API” state.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test frontend-main/tests/draft-history.test.js`

Expected: all history contract tests PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend-main/js/draft-history.js frontend-main/css/draft.css frontend-main/tests/draft-history.test.js
git commit -m "feat: expand draft history goals"
```

### Task 5: Orquestração, titulares, Copa e saldo reativo

**Files:**
- Modify: `frontend-main/draft.html`
- Modify: `frontend-main/js/draft.js`
- Modify: `frontend-main/js/api.js`
- Modify: `frontend-main/js/auth.js`
- Create: `frontend-main/tests/draft-state.test.js`

**Interfaces:**
- Consumes `DraftData`, `DraftEvents`, `DraftHistory`, current `api.getSquad`, current `api.playDraft`, current `api.getHistory`, and `setUserCoins`.
- Produces one shared match flow with `state.mode`, `state.phaseIndex`, `state.squad`, `state.events`, `state.history`, `state.match` and `state.timer`.
- `startDraftMatch` must refuse to call `api.playDraft` when `DraftData.getValidStarters(state.squad).length !== 11`.

- [ ] **Step 1: Write the failing test**

Add pure state tests for: an incomplete squad disabling start and exposing `9/11`; a complete squad enabling start and calculating OVR; Copa phase advancement from index 0 through index 7; and `setUserCoins(2750)` persisting the new session balance without reload.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test frontend-main/tests/draft-state.test.js`

Expected: FAIL against the current orchestrator because it does not load squad state, mode state or phase progression.

- [ ] **Step 3: Write minimal implementation**

Load the current squad with `api.getSquad(userId)`, render starter count and OVR, bind mode cards closed by default, keep the Amistoso API flow intact, map Copa phase copy to the eight visual steps, and advance only the frontend phase after the result/next action. Use `goal_events` from the API when present; otherwise use a clearly isolated demo adapter only to exercise the event UI. After `api.playDraft`, call `setUserCoins(state.match.new_balance)` and update the navbar header through the existing reactive session path. Wire history rendering through `DraftHistory` and preserve error/status handling.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test frontend-main/tests/draft-data.test.js frontend-main/tests/draft-markup.test.js frontend-main/tests/draft-events.test.js frontend-main/tests/draft-history.test.js frontend-main/tests/draft-state.test.js`

Expected: all frontend contract tests PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend-main/draft.html frontend-main/js/draft.js frontend-main/js/api.js frontend-main/js/auth.js frontend-main/tests/draft-state.test.js
git commit -m "feat: integrate draft modes and squad state"
```

### Task 6: Integração final e validação frontend

**Files:**
- Modify: only frontend files needed to resolve verified integration findings.
- Test: all files under `frontend-main/tests/`.

- [ ] **Step 1: Run the complete frontend test command**

Run: `node --test frontend-main/tests/*.test.js`

Expected: zero failing tests.

- [ ] **Step 2: Validate JavaScript syntax**

Run: `Get-ChildItem frontend-main\js\*.js | ForEach-Object { node --check $_.FullName }`

Expected: exit code 0 for every frontend script.

- [ ] **Step 3: Check project scripts and build availability**

Inspect `frontend-main/package.json` and `frontend-main/Dockerfile`; if no frontend lint/build scripts exist, record that fact instead of inventing a command.

- [ ] **Step 4: Verify frontend-only diff**

Run: `git status --short` and `git diff --name-only HEAD~5..HEAD`.

Expected: implementation paths are under `frontend-main/` plus the approved `docs/superpowers/` planning artifacts; no `backend/`, `database/`, `models/` or other server files appear.

- [ ] **Step 5: Review the requirements checklist**

Manually verify cards/order/closed state, eight Copa phases without group table, live goal events, history details, 11-starter lock, OVR, immediate coins update, responsive CSS and backend untouched. Record backend-dependent gaps in the final report.
