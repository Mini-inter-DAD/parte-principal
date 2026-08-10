(function (root, factory) {
  const DraftHistory = factory(root?.DraftData, root?.DraftEvents);

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DraftHistory;
  }

  if (root) root.DraftHistory = DraftHistory;
})(typeof window !== 'undefined' ? window : globalThis, function (DraftData, DraftEvents) {
  function getGoals(match) {
    const events = Array.isArray(match?.goal_events)
      ? match.goal_events
      : Array.isArray(match?.goals) ? match.goals : [];
    return DraftData?.normalizeGoals ? DraftData.normalizeGoals(events) : events;
  }

  function createNode(documentRef, tagName, className, text) {
    const node = documentRef.createElement(tagName);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function renderGoals(details, goals, options) {
    const documentRef = details.ownerDocument;
    if (!goals.length) {
      details.appendChild(createNode(documentRef, 'p', 'history-details__empty', options.emptyGoalsLabel));
      return;
    }
    goals.forEach((goal) => {
      const minute = goal.minute === null || goal.minute === undefined ? '—' : `${String(goal.minute).padStart(2, '0')}'`;
      const team = goal.team === 'USER' ? options.teamName : options.opponentName;
      const event = createNode(documentRef, 'div', 'history-goal');
      event.appendChild(createNode(documentRef, 'span', 'history-goal__minute', minute));
      event.appendChild(createNode(documentRef, 'span', 'history-goal__icon', '⚽'));
      event.appendChild(createNode(documentRef, 'strong', 'history-goal__player', goal.playerName || 'Jogador não identificado'));
      event.appendChild(createNode(documentRef, 'small', 'history-goal__team', team || ''));
      details.appendChild(event);
    });
  }

  function render(container, history, options = {}) {
    if (!container?.ownerDocument?.createElement) return [];
    const documentRef = container.ownerDocument;
    const config = {
      teamName: options.teamName || 'Seu elenco',
      opponentName: options.opponentName || '',
      emptyGoalsLabel: options.emptyGoalsLabel || 'A API ainda não forneceu eventos desta partida.',
    };
    const rows = Array.isArray(history) ? history : [];
    return rows.map((match, index) => {
      const row = createNode(documentRef, 'article', `history-row history-row--${match.result || 'draw'}`);
      const detailsId = `history-details-${match.id ?? index}`;
      const toggle = createNode(documentRef, 'button', 'history-row__toggle', `${match.opponent_name || 'Adversário'} · ${match.user_score ?? 0} — ${match.opponent_score ?? 0}`);
      toggle.setAttribute('type', 'button');
      toggle.setAttribute('aria-controls', detailsId);
      toggle.setAttribute('aria-expanded', 'false');
      const details = createNode(documentRef, 'div', 'history-row__details');
      details.id = detailsId;
      details.hidden = true;
      renderGoals(details, getGoals(match), { ...config, opponentName: match.opponent_name || config.opponentName });
      toggle.addEventListener('click', () => {
        const expanded = toggle.getAttribute('aria-expanded') !== 'true';
        toggle.setAttribute('aria-expanded', String(expanded));
        details.hidden = !expanded;
        row.classList.toggle('is-open', expanded);
      });
      row.appendChild(toggle);
      row.appendChild(details);
      container.appendChild(row);
      return row;
    });
  }

  return Object.freeze({ getGoals, render });
});
