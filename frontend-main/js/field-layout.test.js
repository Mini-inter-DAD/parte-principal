const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(
  path.join(__dirname, 'field-layout.js'),
  'utf8',
);
const browser = {};
vm.runInNewContext(source, browser);

test('uses the visual cap for a slot without a same-row neighbor', () => {
  assert.equal(
    browser.calculateFieldNameMaxWidth({ x: 50, y: 90 }, [{ x: 50, y: 90 }], 600),
    110,
  );
});

test('limits adjacent labels to the available center-to-center distance', () => {
  assert.equal(
    browser.calculateFieldNameMaxWidth(
      { x: 18, y: 72 },
      [{ x: 18, y: 72 }, { x: 37, y: 72 }, { x: 63, y: 72 }],
      600,
    ),
    106,
  );
});

test('ignores slots on a different line', () => {
  assert.equal(
    browser.calculateFieldNameMaxWidth(
      { x: 18, y: 28 },
      [{ x: 18, y: 28 }, { x: 50, y: 40 }, { x: 18, y: 72 }],
      600,
    ),
    110,
  );
});

test('keeps a readable minimum and handles invalid field widths', () => {
  assert.equal(
    browser.calculateFieldNameMaxWidth(
      { x: 49, y: 52 },
      [{ x: 49, y: 52 }, { x: 50, y: 52 }],
      600,
    ),
    56,
  );
  assert.equal(
    browser.calculateFieldNameMaxWidth({ x: 50, y: 90 }, [], 0),
    110,
  );
});

test('applies the calculated width to each rendered field slot', () => {
  const names = [{ style: { setProperty() {} } }, { style: { setProperty() {} } }];
  const calls = names.map(() => []);
  names.forEach((node, index) => {
    node.style.setProperty = (...args) => calls[index].push(args);
  });
  const container = {
    clientWidth: 600,
    querySelectorAll() { return names; },
  };
  const slots = [{ x: 18, y: 72 }, { x: 37, y: 72 }];

  browser.applyFieldNameWidths(container, slots);

  assert.deepEqual(calls[0], [['--field-slot-name-max-width', '106px']]);
  assert.deepEqual(calls[1], [['--field-slot-name-max-width', '106px']]);
});

test('keeps the complete player name in the field tooltip', () => {
  const squad = fs.readFileSync(
    path.join(__dirname, 'squad.js'),
    'utf8',
  );
  const titleBlock = squad.match(/el\.setAttribute\(\s*'title',[\s\S]*?\);/);

  assert.ok(titleBlock, 'field player title assignment should exist');
  assert.match(squad, /const fullPlayerName = String\(slot\.player\.name/);
  assert.doesNotMatch(titleBlock[0], /formatPlayerName/);
});
