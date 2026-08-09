const test = require('node:test');
const assert = require('node:assert/strict');

const DraftEvents = require('../js/draft-events.js');

function createNode(tagName = 'div') {
  return {
    tagName: String(tagName).toUpperCase(),
    className: '',
    attributes: {},
    children: [],
    textContent: '',
    appendChild(child) {
      this.children.push(child);
      if (typeof child?.textContent === 'string' && child.textContent) {
        this.textContent += child.textContent;
      }
      return child;
    },
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    querySelector(selector) {
      const className = selector.startsWith('.') ? selector.slice(1) : selector;
      return this.children.find((child) => child.className === className) || null;
    },
  };
}

function createContainer() {
  const container = createNode('div');
  container.ownerDocument = {
    createElement: createNode,
  };
  return container;
}

test('renders a goal event with minute, scorer, goal marker, and team', () => {
  const container = createContainer();

  DraftEvents.renderGoalEvent(
    container,
    {
      minute: 23,
      playerId: 'neymar',
      playerName: 'Neymar',
      position: 'FW',
      team: 'USER',
    },
    {
      teamName: 'Brasil',
      opponentName: 'França',
    },
  );

  assert.equal(container.children.length, 1);
  const row = container.children[0];
  assert.equal(row.className.includes('match-event'), true);
  assert.equal(row.attributes.role, 'article');
  assert.equal(row.attributes['data-team'], 'USER');
  assert.equal(row.children[0].textContent, "23'");
  assert.equal(row.children[1].textContent, '⚽');
  assert.match(row.children[2].textContent, /Neymar/);
  assert.equal(row.children[3].textContent, 'Brasil');
});

test('renders missing minute as an em dash and appends events in order', () => {
  const container = createContainer();

  DraftEvents.renderGoalEvents(
    container,
    [
      {
        minute: null,
        playerId: 'player-1',
        playerName: 'Player One',
        position: 'MF',
        team: 'OPPONENT',
      },
      {
        minute: 45,
        playerId: 'player-2',
        playerName: 'Player Two',
        position: 'FW',
        team: 'USER',
      },
    ],
    {
      teamName: 'Brasil',
      opponentName: 'França',
    },
  );

  assert.equal(container.children.length, 2);
  assert.equal(container.children[0].children[0].textContent, '—');
  assert.equal(container.children[1].children[0].textContent, "45'");
  assert.equal(container.children[0].attributes['data-team'], 'OPPONENT');
  assert.equal(container.children[1].attributes['data-team'], 'USER');
});
