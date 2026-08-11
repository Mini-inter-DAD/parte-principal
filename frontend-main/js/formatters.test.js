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

test('draft event and history displays use the shared formatter', () => {
  const events = fs.readFileSync(path.join(__dirname, 'draft-events.js'), 'utf8');
  const history = fs.readFileSync(path.join(__dirname, 'draft-history.js'), 'utf8');
  assert.match(events, /formatPlayerName\(normalized\.playerName\)/);
  assert.match(history, /formatPlayerName\(goal\.playerName/);
});
