# Player Name Display Abbreviation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Abbreviate player names consistently across the market, cart, squad, draft, and draft history screens without changing API data or search behavior.

**Architecture:** Add one browser-global `formatPlayerName(name)` helper to `frontend-main/js/formatters.js`. Replace the market-local duplicate and route every visible player-name render in market, squad, draft events, and draft history through the shared helper while retaining raw names for search, image alt text, and internal state.

**Tech Stack:** Plain browser JavaScript, Node.js built-in test runner, existing static HTML script loading.

## Global Constraints

- The change applies to market, cart, squad, field, draft, and draft history.
- The API, search, and internal objects continue using the full name.
- Single-term names remain unchanged.
- Repeated or surrounding whitespace is normalized.
- Empty, null, or undefined inputs must not break rendering.
- No database or API response contract changes.

---

### Task 1: Add and test the shared player-name formatter

**Files:**
- Create: `frontend-main/js/formatters.test.js`
- Modify: `frontend-main/js/formatters.js:1-5`

**Interfaces:**
- Consumes: any string-like player name from frontend data.
- Produces: browser-global `formatPlayerName(name)` returning a display string.

- [ ] **Step 1: Write the failing formatter tests**

Create a Node built-in test file that loads the browser script in a VM context and tests real behavior:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(
  path.join(__dirname, 'formatters.js'),
  'utf8',
);
const browser = {};
vm.runInNewContext(source, browser);

test('abbreviates a two-term player name', () => {
  assert.equal(browser.formatPlayerName('Kyllian Mbappe'), 'K. Mbappe');
});

test('uses only the first surname for a multi-term name', () => {
  assert.equal(
    browser.formatPlayerName('Lamine Yamal Nasraoui Ebana'),
    'L. Yamal',
  );
});

test('preserves one-term names and normalizes whitespace', () => {
  assert.equal(browser.formatPlayerName('  Neymar  '), 'Neymar');
  assert.equal(browser.formatPlayerName('  Kyllian   Mbappe  '), 'K. Mbappe');
});

test('handles empty values and already abbreviated names', () => {
  assert.equal(browser.formatPlayerName(''), '');
  assert.equal(browser.formatPlayerName(null), '');
  assert.equal(browser.formatPlayerName(undefined), '');
  assert.equal(browser.formatPlayerName('K. Mbappe'), 'K. Mbappe');
});
```

- [ ] **Step 2: Run the tests and verify the expected failure**

Run:

```bash
node --test frontend-main/js/formatters.test.js
```

Expected: the tests fail because `formatPlayerName` is not defined yet.

- [ ] **Step 3: Implement the minimal formatter**

Add this browser-global function near `formatCoins` in `frontend-main/js/formatters.js`:

```js
function formatPlayerName(name) {
  const terms = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (terms.length <= 1) return terms[0] || '';
  if (/^[^\s.]+\.$/.test(terms[0])) return `${terms[0]} ${terms[1]}`;
  return `${terms[0][0]}. ${terms[1]}`;
}
```

- [ ] **Step 4: Run the formatter tests and verify they pass**

Run:

```bash
node --test frontend-main/js/formatters.test.js
```

Expected: all formatter tests pass with zero failures.

- [ ] **Step 5: Commit the isolated helper change**

```bash
git add frontend-main/js/formatters.js frontend-main/js/formatters.test.js
git commit -m "feat: add shared player name formatter"
```

### Task 2: Apply the shared formatter to market and squad displays

**Files:**
- Modify: `frontend-main/js/market.js:490-645,726-733`
- Modify: `frontend-main/js/squad.js:342-437`
- Modify: `frontend-main/js/formatters.test.js`

**Interfaces:**
- Consumes: `formatPlayerName(name)` from `formatters.js` and full player objects already used by each screen.
- Produces: abbreviated visible names in market cards, cart rows, field slots, starting players, and reserves.

- [ ] **Step 1: Add failing wiring assertions**

Append source-level regression tests that fail against the current code:

```js
test('market delegates visible names to the shared formatter', () => {
  const market = fs.readFileSync(
    path.join(__dirname, 'market.js'),
    'utf8',
  );
  assert.match(market, /formatPlayerName\(player\.name \|\| 'Jogador'\)/);
  assert.doesNotMatch(market, /function formatPlayerName\(name\)/);
});

test('squad delegates field and roster names to the shared formatter', () => {
  const squad = fs.readFileSync(path.join(__dirname, 'squad.js'), 'utf8');
  assert.match(squad, /formatPlayerName\(slot\.player\.name\)/);
  assert.match(squad, /formatPlayerName\(player\.name\)/);
});
```

- [ ] **Step 2: Run the wiring tests and verify they fail for missing call sites**

Run:

```bash
node --test frontend-main/js/formatters.test.js
```

Expected: the new market/squad wiring assertions fail while the formatter behavior tests remain green.

- [ ] **Step 3: Update market renderers**

Keep `player.name` unchanged in filtering and image `alt` text. Use the shared helper for the visible card name and visible cart item name, then delete the local `formatPlayerName` declaration at the end of `market.js`.

- [ ] **Step 4: Update squad renderers**

Use `formatPlayerName` for the field-slot title, field-slot name, starter boxscore name, and reserve boxscore name. Leave IDs, selected-player state, and OVR reads unchanged.

- [ ] **Step 5: Run the wiring tests and verify they pass**

Run:

```bash
node --test frontend-main/js/formatters.test.js
```

Expected: all formatter and market/squad wiring tests pass.

- [ ] **Step 6: Commit the market and squad integration**

```bash
git add frontend-main/js/market.js frontend-main/js/squad.js frontend-main/js/formatters.test.js
git commit -m "feat: abbreviate player names in market and squad"
```

### Task 3: Apply the formatter to draft events and history

**Files:**
- Modify: `frontend-main/js/draft-events.js:47-53`
- Modify: `frontend-main/js/draft-history.js:70-76`
- Modify: `frontend-main/js/formatters.test.js`

**Interfaces:**
- Consumes: full `playerName` values from normalized live events and persisted draft history.
- Produces: abbreviated player names in current match event descriptions and historical goal rows.

- [ ] **Step 1: Add failing draft wiring assertions**

Append source-level tests:

```js
test('draft event and history displays use the shared formatter', () => {
  const events = fs.readFileSync(path.join(__dirname, 'draft-events.js'), 'utf8');
  const history = fs.readFileSync(path.join(__dirname, 'draft-history.js'), 'utf8');
  assert.match(events, /formatPlayerName\(normalized\.playerName\)/);
  assert.match(history, /formatPlayerName\(goal\.playerName/);
});
```

- [ ] **Step 2: Run the draft wiring test and verify it fails**

Run:

```bash
node --test frontend-main/js/formatters.test.js
```

Expected: the new draft assertion fails because the current renderers use raw `playerName` values.

- [ ] **Step 3: Update draft event and history rendering**

Wrap only the visible player text with `formatPlayerName`. Keep event normalization, persisted values, team names, minutes, and fallback text unchanged:

```js
const text = formatPlayerName(normalized.playerName) || 'Jogador não identificado';
```

```js
createNode(
  documentRef,
  'strong',
  'history-goal__player',
  formatPlayerName(goal.playerName) || 'Jogador não identificado',
);
```

- [ ] **Step 4: Run the complete frontend validation**

Run:

```bash
node --test frontend-main/js/formatters.test.js
node --check frontend-main/js/formatters.js
node --check frontend-main/js/market.js
node --check frontend-main/js/squad.js
node --check frontend-main/js/draft-events.js
node --check frontend-main/js/draft-history.js
rg -n "slot\.player\.name|player\.name|playerName|goal\.playerName" frontend-main/js/market.js frontend-main/js/squad.js frontend-main/js/draft-events.js frontend-main/js/draft-history.js
```

Expected: all Node tests and syntax checks pass; the final search shows raw values only in filtering, accessibility, normalization, or arguments passed into `formatPlayerName`, not in visible player-name assignments.

- [ ] **Step 5: Commit the draft integration**

```bash
git add frontend-main/js/draft-events.js frontend-main/js/draft-history.js frontend-main/js/formatters.test.js
git commit -m "feat: abbreviate player names in draft history"
```

### Task 4: Final requirement verification

**Files:**
- Inspect: `frontend-main/js/formatters.js`
- Inspect: `frontend-main/js/market.js`
- Inspect: `frontend-main/js/squad.js`
- Inspect: `frontend-main/js/draft-events.js`
- Inspect: `frontend-main/js/draft-history.js`

**Interfaces:**
- Consumes: the completed implementation and regression tests from Tasks 1–3.
- Produces: evidence that the approved design is fully implemented without touching the unrelated existing change in `database/connection.py`.

- [ ] **Step 1: Run the full test command again from a clean implementation state**

```bash
node --test frontend-main/js/formatters.test.js
```

Expected: all tests pass with zero failures.

- [ ] **Step 2: Inspect the final diff and working tree**

```bash
git diff HEAD~3..HEAD -- frontend-main/js/formatters.js frontend-main/js/formatters.test.js frontend-main/js/market.js frontend-main/js/squad.js frontend-main/js/draft-events.js frontend-main/js/draft-history.js
git status --short
```

Expected: the diff contains only the approved name-display work, and the pre-existing `database/connection.py` modification remains untouched.

- [ ] **Step 3: Commit any required final cleanup only after tests pass**

If the final inspection finds no cleanup, do not create an empty commit. If a small cleanup is required, run the tests again and commit only the affected frontend files with:

```bash
git add frontend-main/js/formatters.js frontend-main/js/formatters.test.js frontend-main/js/market.js frontend-main/js/squad.js frontend-main/js/draft-events.js frontend-main/js/draft-history.js
git commit -m "chore: finalize player name display verification"
```
