const test = require('node:test');
const assert = require('node:assert/strict');

const DraftData = require('../js/draft-data.js');

test('counts only valid starters and rounds average OVR', () => {
  const players = [
    { is_starter: true, squad_position: 'GK', overall: 80 },
    { is_starter: true, squad_position: 'ST', ovr: 91 },
    { is_starter: true, squad_position: '', overall: 99 },
    { is_starter: false, squad_position: 'CM', overall: 100 },
  ];

  assert.deepEqual(DraftData.getValidStarters(players), [players[0], players[1]]);
  assert.equal(DraftData.calculateTeamOvr(players), 86);
});

test('exposes the eight cup phases in the exact order', () => {
  assert.deepEqual(DraftData.CUP_PHASES, [
    'Fase de Grupos — Jogo 1/3',
    'Fase de Grupos — Jogo 2/3',
    'Fase de Grupos — Jogo 3/3',
    '16 avos',
    'Oitavas de Final',
    'Quartas de Final',
    'Semifinal',
    'Final',
  ]);
});

test('normalizes a partial Neymar goal event', () => {
  const normalized = DraftData.normalizeGoalEvent(
    {
      minute: 23,
      playerName: 'Neymar',
      team: 'USER',
    },
    'OPPONENT',
  );

  assert.deepEqual(normalized, {
    minute: 23,
    playerId: null,
    playerName: 'Neymar',
    position: null,
    team: 'USER',
  });
});
