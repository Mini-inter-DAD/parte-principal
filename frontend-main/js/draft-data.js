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

  const DRAFT_STARTER_SLOTS = Object.freeze([
    'GK', 'LB', 'CB1', 'CB2', 'RB',
    'CM1', 'CM2', 'CM3', 'LW', 'ST', 'RW',
  ]);

  function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim() !== '';
  }

  function normalizeTeam(team, fallbackTeam) {
    const normalizedTeam = String(team || '').trim().toUpperCase();
    if (normalizedTeam === 'USER' || normalizedTeam === 'OPPONENT') {
      return normalizedTeam;
    }

    const normalizedFallback = String(fallbackTeam || '').trim().toUpperCase();
    if (normalizedFallback === 'USER' || normalizedFallback === 'OPPONENT') {
      return normalizedFallback;
    }

    return 'OPPONENT';
  }

  function getValidStarters(players) {
    if (!Array.isArray(players)) {
      return [];
    }

    const usedSlots = new Set();
    return players.filter((player) => {
      if (player?.is_starter !== true || !isNonEmptyString(player?.squad_position)) {
        return false;
      }

      const slot = player.squad_position.trim().toUpperCase();
      if (!DRAFT_STARTER_SLOTS.includes(slot) || usedSlots.has(slot)) {
        return false;
      }

      usedSlots.add(slot);
      return true;
    });
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
      playerId: isNonEmptyString(source.playerId || source.player_id)
        ? String(source.playerId || source.player_id).trim()
        : null,
      playerName: isNonEmptyString(
        source.playerName || source.player_name || source.scorerName || source.scorer_name,
      )
        ? String(source.playerName || source.player_name || source.scorerName || source.scorer_name).trim()
        : '',
      position: isNonEmptyString(source.position) ? source.position.trim() : null,
      team: normalizeTeam(source.team || source.side, fallbackTeam),
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
    DRAFT_STARTER_SLOTS,
    getValidStarters,
    calculateTeamOvr,
    getPhase,
    normalizeGoalEvent,
    normalizeGoals,
  });
});
