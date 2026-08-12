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

test('uses familiar aliases for famous players', () => {
  assert.equal(browser.formatPlayerName('Vinícius Júnior'), 'Vini Jr.');
  assert.equal(
    browser.formatPlayerName('vinicius jose de oliveira junior'),
    'Vini Jr.',
  );
  assert.equal(browser.formatPlayerName('Raphael Dias Belloli'), 'Raphinha');
  assert.equal(browser.formatPlayerName('Virgil van Dijk'), 'Van Dijk');
  assert.equal(
    browser.formatPlayerName('Rúben Santos Gato Alves Dias'),
    'Rúben Dias',
  );
});

test('normalizes case, accents, punctuation, and spaces for alias lookup', () => {
  assert.equal(browser.formatPlayerName('  VINICIUS   JUNIOR  '), 'Vini Jr.');
  assert.equal(browser.formatPlayerName('C. Ronaldo dos Santos Aveiro'), 'Cristiano Ronaldo');
  assert.equal(browser.formatPlayerName('Rodrigo Hernández Cascante'), 'Rodri');
});

test('keeps the generic abbreviation for names without a curated alias', () => {
  assert.equal(
    browser.formatPlayerName('Lamine Yamal Nasraoui Ebana'),
    'L. Yamal',
  );
  assert.equal(browser.formatPlayerName('Kyllian Mbappe'), 'K. Mbappe');
});

test('keeps two-term names complete for the field layout', () => {
  assert.equal(
    browser.formatPlayerNameForField('Dayot Upamecano'),
    'Dayot Upamecano',
  );
  assert.equal(
    browser.formatPlayerNameForField('  Dayot   Upamecano  '),
    'Dayot Upamecano',
  );
});

test('keeps curated aliases for multi-term field names', () => {
  assert.equal(
    browser.formatPlayerNameForField('Marc Cucurella Saseta'),
    'Marc Cucurella',
  );
});

test('replaces the o-slash character before displaying the name', () => {
  assert.equal(browser.formatPlayerName('Martin Ødegaard'), 'M. Odegaard');
  assert.equal(browser.formatPlayerName('Ørjan Nyland'), 'O. Nyland');
});

test('market delegates visible names to the shared formatter', () => {
  const market = fs.readFileSync(
    path.join(__dirname, 'market.js'),
    'utf8',
  );
  assert.match(market, /formatPlayerName\(player\.name \|\| 'Jogador'\)/);
  assert.doesNotMatch(market, /function formatPlayerName\(name\)/);
});

test('market uses one label for nationality aliases', () => {
  const market = fs.readFileSync(path.join(__dirname, 'market.js'), 'utf8');
  const browser = {};
  browser.window = browser;
  vm.runInNewContext(market, browser);

  assert.equal(
    browser.marketTranslateNationality('Cape Verde Islands'),
    'Cabo Verde',
  );
  assert.equal(
    browser.marketTranslateNationality('Cape Verde'),
    'Cabo Verde',
  );
  assert.equal(
    browser.marketMatchesNationalityFilter('Cape Verde Islands', 'Cabo Verde'),
    true,
  );
  assert.equal(
    browser.marketMatchesNationalityFilter('Cape Verde', 'Cabo Verde'),
    true,
  );
  assert.equal(
    browser.marketMatchesNationalityFilter('Ghana', 'Cabo Verde'),
    false,
  );
  assert.equal(browser.marketTranslateNationality('Cura?ao'), 'Curaçao');
});

test('squad delegates field and roster names to the shared formatter', () => {
  const squad = fs.readFileSync(path.join(__dirname, 'squad.js'), 'utf8');
  assert.match(squad, /formatPlayerNameForField\(slot\.player\.name\)/);
  assert.match(squad, /formatPlayerName\(player\.name\)/);
});

test('draft event and history displays use the shared formatter', () => {
  const events = fs.readFileSync(path.join(__dirname, 'draft-events.js'), 'utf8');
  const history = fs.readFileSync(path.join(__dirname, 'draft-history.js'), 'utf8');
  assert.match(events, /formatPlayerName\(normalized\.playerName\)/);
  assert.match(history, /formatPlayerName\(goal\.playerName/);
});
