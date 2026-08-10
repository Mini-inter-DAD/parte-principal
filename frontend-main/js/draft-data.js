(function (root, factory) {
  const DraftData = factory();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DraftData;
  }

  if (root) {
    root.DraftData = DraftData;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const CUP_PHASES = Object.freeze([
    'Fase de Grupos — Jogo 1/3',
    'Fase de Grupos — Jogo 2/3',
    'Fase de Grupos — Jogo 3/3',
    '16 avos',
    'Oitavas de Final',
    'Quartas de Final',
    'Semifinal',
    'Final',
  ]);

  function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim() !== '';
  }

  function normalizeTeam(team, fallbackTeam) {
    if (team === 'USER' || team === 'OPPONENT') {
      return team;
    }

    if (fallbackTeam === 'USER' || fallbackTeam === 'OPPONENT') {
      return fallbackTeam;
    }

    return 'OPPONENT';
  }

  function getValidStarters(players) {
    if (!Array.isArray(players)) {
      return [];
    }

    return players.filter((player) => player?.is_starter === true && isNonEmptyString(player?.squad_position));
  }

  function calculateTeamOvr(players) {
    const starters = getValidStarters(players);
    if (!starters.length) {
      return null;
    }

    const total = starters.reduce((sum, player) => {
      const value = player?.overall ?? player?.ovr;
      return sum + (Number.isFinite(Number(value)) ? Number(value) : 0);
    }, 0);

    return Math.round(total / starters.length);
  }

  function getPhase(index) {
    const safeIndex = Number.isFinite(Number(index)) ? Math.trunc(Number(index)) : 0;
    const clamped = Math.min(Math.max(safeIndex, 0), CUP_PHASES.length - 1);
    return CUP_PHASES[clamped];
  }

  function normalizeGoalEvent(event, fallbackTeam) {
    const source = event && typeof event === 'object' ? event : {};
    const minute = Number(source.minute);

    return {
      minute: Number.isFinite(minute) ? minute : null,
      playerId: isNonEmptyString(source.playerId) ? source.playerId.trim() : null,
      playerName: isNonEmptyString(source.playerName) ? source.playerName.trim() : '',
      position: isNonEmptyString(source.position) ? source.position.trim() : null,
      team: normalizeTeam(source.team, fallbackTeam),
    };
  }

  function normalizeGoals(events, fallbackTeam) {
    if (!Array.isArray(events)) {
      return [];
    }

    return events.map((event) => normalizeGoalEvent(event, fallbackTeam));
  }

  return Object.freeze({
    CUP_PHASES,
    getValidStarters,
    calculateTeamOvr,
    getPhase,
    normalizeGoalEvent,
    normalizeGoals,
  });
});
