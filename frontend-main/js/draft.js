/* Draft conectado à API. A animação só apresenta o resultado já calculado pelo backend. */

(function () {
  const state = {
    opponents: [],
    opponent: null,
    match: null,
    history: [],
    minute: 0,
    events: [],
    timer: null,
  };

  const $ = (id) => document.getElementById(id);
  const setText = (id, value) => {
    const node = $(id);
    if (node) node.textContent = value;
  };

  function sessionUser() {
    return getSession().user || null;
  }

  function teamName() {
    return sessionUser()?.username || 'Seu elenco';
  }

  function showError(message) {
    if (typeof notify !== 'undefined' && notify.error) {
      notify.error(message);
      return;
    }
    setText('draft-status', message);
  }

  function renderFlag(id, opponent) {
    const node = $(id);
    if (!node || !opponent?.code) return;
    node.innerHTML = `<img class="flag-image" src="https://flagcdn.com/w80/${opponent.code}.png" alt="Bandeira de ${escapeHtml(opponent.name)}" width="80" height="53" loading="eager">`;
    node.setAttribute('aria-label', `Bandeira de ${opponent.name}`);
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async function loadOpponents() {
    state.opponents = await api.getOpponents();
    state.opponent = state.opponents[Math.floor(Math.random() * state.opponents.length)] || null;
  }

  async function loadHistory() {
    const userId = Number(sessionUser()?.id);
    if (!userId) return;
    state.history = await api.getHistory(userId);
    renderHistory();
  }

  function renderPreview() {
    setText('player-team-name', teamName());
    setText('player-team-ovr', '--');

    if (!state.opponent) {
      setText('opponent-team-name', 'Nenhum adversário');
      setText('opponent-team-ovr', '--');
      return;
    }

    setText('opponent-team-name', state.opponent.name);
    setText('opponent-team-ovr', state.opponent.overall);
    renderFlag('opponent-flag', state.opponent);
    setText('draft-status', `Próximo adversário: ${state.opponent.name}, OVR ${state.opponent.overall}.`);
  }

  function showMode(mode) {
    $('match-preview').hidden = mode !== 'preview';
    $('live-match').hidden = mode !== 'live';
    $('match-result').hidden = mode !== 'result';
  }

  function createEvents(match) {
    const events = [];
    const addEvents = (team, total, scorer) => {
      for (let index = 0; index < total; index += 1) {
        events.push({
          team,
          minute: Math.min(89, 8 + Math.floor(Math.random() * 80)),
          scorer,
        });
      }
    };

    addEvents('home', match.score.user, match.team_name);
    addEvents('away', match.score.opponent, match.opponent.name);
    return events.sort((left, right) => left.minute - right.minute);
  }

  function resetLive(match) {
    state.minute = 0;
    state.events = createEvents(match);
    setText('player-score', 0);
    setText('opponent-score', 0);
    setText('match-minute', '00');
    $('match-progress-bar').style.width = '0%';
    $('match-events').innerHTML = '';
    setText('live-player-name', match.team_name);
    setText('live-opponent-name', match.opponent.name);
    renderFlag('live-opponent-flag', match.opponent);
    setText('live-kicker', 'Ao vivo');
    setText('live-title', 'A partida começou');
    setText('live-hint', 'A bola está rolando. Os principais lances aparecerão aqui.');
    $('btn-next-result').hidden = true;
  }

  function addGoal(event) {
    const scoreId = event.team === 'home' ? 'player-score' : 'opponent-score';
    const score = Number($(scoreId).textContent || 0) + 1;
    setText(scoreId, score);
    const team = event.team === 'home' ? state.match.team_name : state.match.opponent.name;
    const row = document.createElement('div');
    row.className = 'match-event';
    row.innerHTML = `<span class="match-event__minute">${String(event.minute).padStart(2, '0')}'</span><span class="match-event__icon">⚽</span><span class="match-event__text"><strong>Gol de ${escapeHtml(event.scorer)}</strong><small>${event.team === 'home' ? 'Que jogada do seu elenco!' : 'O adversário aproveita.'}</small></span><span class="match-event__team">${escapeHtml(team)}</span>`;
    $('match-events').prepend(row);
    setText('draft-status', `Gol aos ${event.minute} minutos: ${event.scorer}.`);
  }

  function tick() {
    state.minute += 1;
    setText('match-minute', String(state.minute).padStart(2, '0'));
    $('match-progress-bar').style.width = `${(state.minute / 90) * 100}%`;
    state.events
      .filter((event) => !event.seen && event.minute <= state.minute)
      .forEach((event) => {
        event.seen = true;
        addGoal(event);
      });
    if (state.minute >= 90) finishDraftMatch();
  }

  async function startDraftMatch() {
    if (state.timer) return;
    const userId = Number(sessionUser()?.id);
    if (!userId) {
      showError('Entre com uma conta real para jogar o Draft.');
      return;
    }

    const button = $('btn-start-draft');
    if (button) button.disabled = true;
    try {
      state.match = await api.playDraft(userId, state.opponent?.id);
      setUserCoins(state.match.new_balance);
      resetLive(state.match);
      showMode('live');
      state.timer = setInterval(tick, 100);
    } catch (error) {
      showError(error.message || 'Não foi possível iniciar o Draft.');
    } finally {
      if (button) button.disabled = false;
    }
  }

  function finishDraftMatch() {
    if (state.timer) {
      clearInterval(state.timer);
      state.timer = null;
    }
    setText('live-kicker', 'Partida encerrada');
    setText('live-title', state.match.result_label);
    setText('live-hint', `Resultado final: ${state.match.score.user} a ${state.match.score.opponent}.`);
    $('btn-next-result').hidden = false;
    setText('draft-status', `${state.match.result_label}: ${state.match.score.user} a ${state.match.score.opponent}.`);
  }

  function resultClass(result) {
    return result === 'W' ? 'win' : result === 'L' ? 'loss' : 'draw';
  }

  function formatPlayedAt(value) {
    if (!value) return 'Agora';
    return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  }

  function renderHistory() {
    const container = $('match-history');
    if (!container) return;
    container.innerHTML = '';
    setText('history-count', `${state.history.length} partidas`);

    if (!state.history.length) {
      container.innerHTML = '<p class="history-empty">Nenhuma partida disputada ainda.</p>';
      return;
    }

    state.history.forEach((match) => {
      const opponent = state.opponents.find((item) => item.name === match.opponent_name);
      const code = opponent?.code || 'un';
      const row = document.createElement('article');
      row.className = `history-row history-row--${resultClass(match.result)}`;
      row.innerHTML = `<div class="history-row__phase">DRAFT<strong>FINALIZADO</strong></div><div class="history-row__opponent"><span class="flag-icon"><img class="flag-image" src="https://flagcdn.com/w80/${code}.png" alt="Bandeira de ${escapeHtml(match.opponent_name)}" width="80" height="53" loading="lazy"></span><strong>${escapeHtml(match.opponent_name)}</strong><small>${formatPlayedAt(match.played_at)}</small></div><div class="history-row__score"><strong>${match.user_score}</strong><span>—</span><strong>${match.opponent_score}</strong></div><div class="history-row__reward">${match.coins_earned ? `+${match.coins_earned} ⚽` : '—'} </div><span class="history-row__status">${escapeHtml(match.result_label)}</span>`;
      container.appendChild(row);
    });
  }

  async function showResult() {
    $('btn-next-result').hidden = true;
    $('match-result').classList.toggle('result-panel--loss', state.match.result !== 'W');
    setText('result-title', state.match.result_label);
    setText('result-player-score', state.match.score.user);
    setText('result-opponent-score', state.match.score.opponent);
    setText('result-copy', `OVR do seu elenco: ${state.match.user_ovr}.`);
    setText('result-reward', state.match.coins_earned ? `+ ⚽ ${state.match.coins_earned}` : '⚽ Nenhuma recompensa');
    setText('result-icon', state.match.result === 'W' ? '✓' : state.match.result === 'L' ? '×' : '—');
    showMode('result');
    try {
      await loadHistory();
    } catch (error) {
      showError(error.message || 'Não foi possível atualizar o histórico.');
    }
  }

  async function initDraft() {
    if (!$('match-preview')) return;
    if (typeof requireAuth === 'function') requireAuth();
    if (typeof renderNavbar === 'function') renderNavbar('draft');
    setText('player-team-name', teamName());
    try {
      await Promise.all([loadOpponents(), loadHistory()]);
      renderPreview();
    } catch (error) {
      showError(error.message || 'Não foi possível carregar o Draft.');
    }
    $('btn-start-draft').addEventListener('click', startDraftMatch);
    $('btn-next-result').addEventListener('click', showResult);
    $('btn-play-again').addEventListener('click', () => {
      $('match-result').classList.remove('result-panel--loss');
      showMode('preview');
      state.opponent = state.opponents[Math.floor(Math.random() * state.opponents.length)] || null;
      renderPreview();
    });
  }

  window.initDraft = initDraft;
  window.startDraftMatch = startDraftMatch;
  window.finishDraftMatch = finishDraftMatch;
})();
