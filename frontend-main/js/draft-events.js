(function (root, factory) {
  const DraftEvents = factory();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DraftEvents;
  }

  if (root) {
    root.DraftEvents = DraftEvents;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function getDocument(container) {
    if (container && container.ownerDocument && typeof container.ownerDocument.createElement === 'function') {
      return container.ownerDocument;
    }

    if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
      return document;
    }

    throw new Error('DraftEvents requires a DOM-like document');
  }

  function safeText(value, fallback) {
    if (value === null || value === undefined || value === '') {
      return fallback;
    }

    return String(value);
  }

  function formatMinute(minute) {
    if (minute === null || minute === undefined || minute === '') {
      return '—';
    }

    const numericMinute = Number(minute);
    return Number.isFinite(numericMinute) ? `${Math.trunc(numericMinute)}'` : '—';
  }

  function getTeamLabel(event, context) {
    if (event?.team === 'USER') {
      return safeText(context?.teamName, 'Seu time');
    }

    if (event?.team === 'OPPONENT') {
      return safeText(context?.opponentName, 'Adversário');
    }

    return safeText(event?.team, '—');
  }

  function createTextElement(documentRef, tagName, className, text) {
    const node = documentRef.createElement(tagName);
    if (className) {
      node.className = className;
    }
    node.textContent = text;
    return node;
  }

  function renderGoalEvent(container, event, context) {
    if (!container || typeof container.appendChild !== 'function') {
      throw new Error('DraftEvents.renderGoalEvent requires a container element');
    }

    const documentRef = getDocument(container);
    const source = event && typeof event === 'object' ? event : {};
    const row = documentRef.createElement('div');
    row.className = 'match-event match-event--goal';
    row.setAttribute('role', 'article');
    row.setAttribute('data-team', safeText(source.team, ''));

    const minute = createTextElement(documentRef, 'span', 'match-event__minute', formatMinute(source.minute));
    const icon = createTextElement(documentRef, 'span', 'match-event__icon', '⚽');
    const text = documentRef.createElement('span');
    text.className = 'match-event__text';

    const title = documentRef.createElement('strong');
    title.textContent = safeText(source.playerName, 'Gol');

    const details = documentRef.createElement('small');
    const position = safeText(source.position, '');
    details.textContent = position ? position : 'Gol';

    text.appendChild(title);
    text.appendChild(details);

    const team = createTextElement(documentRef, 'span', 'match-event__team', getTeamLabel(source, context));

    row.appendChild(minute);
    row.appendChild(icon);
    row.appendChild(text);
    row.appendChild(team);
    container.appendChild(row);

    return row;
  }

  function renderGoalEvents(container, events, context) {
    if (!Array.isArray(events) || !events.length) {
      return [];
    }

    return events.map((event) => renderGoalEvent(container, event, context));
  }

  return Object.freeze({
    renderGoalEvent,
    renderGoalEvents,
  });
});
