(function (root, factory) {
  const DraftEvents = factory();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DraftEvents;
  }

  if (root) root.DraftEvents = DraftEvents;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function normalize(event) {
    const source = event && typeof event === 'object' ? event : {};
    const minute = source.minute === null || source.minute === undefined || source.minute === ''
      ? NaN
      : Number(source.minute);
    const team = source.team === 'USER' ? 'USER' : 'OPPONENT';
    return {
      minute: Number.isFinite(minute) ? minute : null,
      playerName: String(source.playerName || ''),
      team,
    };
  }

  function makeText(documentRef, className, value) {
    const node = documentRef.createElement('span');
    node.className = className;
    node.textContent = value;
    return node;
  }

  function renderGoalEvent(container, event, context = {}) {
    if (!container?.ownerDocument?.createElement) return null;
    const documentRef = container.ownerDocument;
    const normalized = normalize(event);
    const row = documentRef.createElement('div');
    row.className = 'match-event';
    row.setAttribute('role', 'article');
    row.setAttribute('data-team', normalized.team);

    const minute = normalized.minute === null ? '—' : `${String(normalized.minute).padStart(2, '0')}'`;
    const teamName = normalized.team === 'USER' ? context.teamName : context.opponentName;
    const text = normalized.playerName || 'Jogador não identificado';
    row.appendChild(makeText(documentRef, 'match-event__minute', minute));
    row.appendChild(makeText(documentRef, 'match-event__icon', '⚽'));
    const description = makeText(documentRef, 'match-event__text', `Gol de ${text}`);
    row.appendChild(description);
    row.appendChild(makeText(documentRef, 'match-event__team', String(teamName || '')));
    container.appendChild(row);
    return row;
  }

  function renderGoalEvents(container, events, context = {}) {
    if (!Array.isArray(events)) return [];
    return events.map((event) => renderGoalEvent(container, event, context));
  }

  return Object.freeze({ renderGoalEvent, renderGoalEvents });
});
