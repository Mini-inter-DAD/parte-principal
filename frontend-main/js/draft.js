/* Draft conectado à API. A animação só apresenta o resultado já calculado pelo backend. */

(function () {
  const state = {
    opponents: [],
    opponent: null,
    match: null,
    history: [],
    squad: [],
    campaign: null,
    mode: 'cup',
    phaseIndex: 0,
    historyPage: 1,
    startReady: false,
    minute: 0,
    events: [],
    timer: null,
    penalty: null,
    penaltyTimer: null,
    isPenaltyAnimating: false,
    isLoading: true,
    pendingBalance: null,
  };

  const PENALTY_ZONES = [
    'top_left',
    'top_center',
    'top_right',
    'bottom_left',
    'bottom_right',
  ];

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

  function renderPreviewSkeleton() {
    ['player-team-ovr', 'opponent-team-name', 'opponent-team-ovr'].forEach((id) => {
      const node = $(id);
      if (!node) return;
      node.textContent = '';
      node.classList.add('skeleton-block');
    });
    const crest = $('opponent-flag');
    if (crest) {
      crest.innerHTML = '';
      crest.classList.add('skeleton-block');
    }
  }

  function clearPreviewSkeleton() {
    ['player-team-ovr', 'opponent-team-name', 'opponent-team-ovr', 'opponent-flag'].forEach((id) => {
      $(id)?.classList.remove('skeleton-block');
    });
  }

  function renderHistorySkeleton(count = 4) {
    const container = $('match-history');
    if (!container) return;
    container.setAttribute('aria-busy', 'true');
    container.innerHTML = Array.from({ length: count }, () => `
      <article class="history-row history-row--skeleton" aria-hidden="true">
        <span class="skeleton-block history-skeleton__opponent"></span>
        <span class="skeleton-block history-skeleton__score"></span>
        <span class="skeleton-block history-skeleton__competition"></span>
        <span class="skeleton-block history-skeleton__result"></span>
      </article>
    `).join('');
    setText('history-count', 'Carregando');
    const pagination = $('history-pagination');
    if (pagination) pagination.hidden = true;
  }

  async function loadOpponents() {
    state.opponents = await api.getOpponents();
  }

  function currentOpponentStage() {
    if (state.mode !== 'cup') return 'group_stage';
    if (state.phaseIndex <= 2) return 'group_stage';
    if (state.phaseIndex <= 4) return 'round_of_16';
    if (state.phaseIndex === 5) return 'quarter_final';
    if (state.phaseIndex === 6) return 'semi_final';
    return 'final';
  }

  function opponentStorageKey(mode = state.mode) {
    const userId = Number(sessionUser()?.id);
    return userId ? `draft_next_opponent_${userId}_${mode}` : null;
  }

  function clearSavedOpponent(mode = state.mode) {
    const key = opponentStorageKey(mode);
    if (key) localStorage.removeItem(key);
  }

  function restoreSavedOpponent() {
    const key = opponentStorageKey();
    if (!key) return false;

    try {
      const saved = JSON.parse(localStorage.getItem(key) || 'null');
      if (!saved || saved.stage !== currentOpponentStage()) {
        clearSavedOpponent();
        return false;
      }

      const opponent = state.opponents.find((item) => String(item.id) === String(saved.id));
      if (!opponent) {
        clearSavedOpponent();
        return false;
      }

      state.opponent = opponent;
      return true;
    } catch {
      clearSavedOpponent();
      return false;
    }
  }

  function saveCurrentOpponent() {
    const key = opponentStorageKey();
    if (!key || !state.opponent) return;
    localStorage.setItem(key, JSON.stringify({
      id: state.opponent.id,
      stage: currentOpponentStage(),
    }));
  }

  function selectOpponentForCurrentStage({ forceNew = false } = {}) {
    if (!forceNew && restoreSavedOpponent()) return;

    const ranges = {
      group_stage: [65, 75],
      round_of_16: [70, 80],
      quarter_final: [75, 82],
      semi_final: [78, 85],
      final: [82, 90],
    };
    const [minimum, maximum] = ranges[currentOpponentStage()] || ranges.group_stage;
    const candidates = state.opponents.filter((opponent) => {
      const overall = Number(opponent.overall);
      return overall >= minimum && overall <= maximum;
    });
    const available = candidates.length
      ? candidates
      : state.opponents.filter((opponent) => {
        const target = (minimum + maximum) / 2;
        const opponentDistance = Math.abs(Number(opponent.overall) - target);
        return opponentDistance === Math.min(
          ...state.opponents.map((item) => Math.abs(Number(item.overall) - target)),
        );
      });
    state.opponent = available[Math.floor(Math.random() * available.length)] || null;
    saveCurrentOpponent();
  }

  function queueBalance(balance) {
    const parsedBalance = Number(balance);
    state.pendingBalance = Number.isFinite(parsedBalance) ? parsedBalance : null;
  }

  function applyPendingBalance() {
    if (state.pendingBalance === null) return;
    setUserCoins(state.pendingBalance);
    state.pendingBalance = null;
  }

  function completeDisplayedMatch() {
    applyPendingBalance();
    clearSavedOpponent();
  }

  async function loadHistory() {
    const userId = Number(sessionUser()?.id);
    renderHistorySkeleton();
    if (!userId) {
      state.history = [];
      renderHistory();
      return;
    }
    const pageSize = 50;
    const history = [];
    let offset = 0;
    let page;
    try {
      do {
        page = await api.getHistory(userId, { limit: pageSize, offset });
        history.push(...page);
        offset += page.length;
      } while (page.length === pageSize);
      state.history = history;
      state.historyPage = 1;
    } catch (error) {
      renderHistory();
      throw error;
    }
    renderHistory();
  }

  async function loadSquad() {
    const userId = Number(sessionUser()?.id);
    if (!userId || typeof api.getSquad !== 'function') {
      state.squad = [];
      updateStarterGate();
      return;
    }
    state.squad = await api.getSquad(userId);
    updateStarterGate();
  }

  async function loadCampaign() {
    const userId = Number(sessionUser()?.id);
    if (!userId || typeof api.getCampaign !== 'function') return;
    state.campaign = await api.getCampaign(userId);
    state.phaseIndex = Number(state.campaign?.phase_index || 0);
  }

  async function loadActivePenalty() {
    const userId = Number(sessionUser()?.id);
    if (!userId || typeof api.getActivePenalty !== 'function') return null;
    return api.getActivePenalty(userId);
  }

  function updateStarterGate() {
    const starters = typeof DraftData !== 'undefined'
      ? DraftData.getValidStarters(state.squad)
      : state.squad.filter((player) => player?.is_starter && player?.squad_position);
    state.startReady = starters.length === 11;
    const campaignEnded = state.mode === 'cup' && state.campaign && !state.campaign.can_play;
    const ovr = typeof DraftData !== 'undefined' ? DraftData.calculateTeamOvr(state.squad) : null;
    setText('player-team-ovr', ovr ?? '--');
    if (typeof DraftModes !== 'undefined') {
      DraftModes.setStartEnabled(state.startReady, starters.length, campaignEnded);
    }
  }

  function renderCupPhase() {
    if (typeof DraftData === 'undefined') return;
    const phase = DraftData.getPhase(state.phaseIndex);
    setText('cup-phase-label', phase ? `Fase atual: ${phase}` : 'Copa do Mundo');
  }

  function renderPreview() {
    clearPreviewSkeleton();
    setText('player-team-name', teamName());
    updateStarterGate();
    renderCupPhase();

    if (!state.opponent) {
      setText('opponent-team-name', 'Selecione um adversário');
      setText('opponent-team-ovr', '--');
      const flag = $('opponent-flag');
      if (flag) {
        flag.innerHTML = '';
        flag.removeAttribute('aria-label');
      }
      setText('draft-status', 'Escolha o adversário da partida.');
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
    $('penalty-shootout').hidden = mode !== 'penalty';
    $('champion-screen').hidden = mode !== 'champion';
  }

  function clearPenaltyTimer() {
    if (state.penaltyTimer) {
      clearInterval(state.penaltyTimer);
      state.penaltyTimer = null;
    }
  }

  function resetPenaltyAnimation() {
    const keeper = $('penalty-keeper');
    const ball = $('penalty-ball');
    if (keeper) {
      PENALTY_ZONES.forEach((zone) => keeper.classList.remove(`dive-${zone}`));
    }
    if (ball) {
      PENALTY_ZONES.forEach((zone) => ball.classList.remove(`shot-${zone}`));
    }
  }

  function startPenaltyDecisionTimer(seconds) {
    clearPenaltyTimer();
    let remaining = Math.max(3, Number(seconds) || 3);
    setText('penalty-time-left', remaining);
    $('penalty-timer').hidden = false;

    state.penaltyTimer = setInterval(() => {
      remaining -= 1;
      setText('penalty-time-left', Math.max(remaining, 0));
      if (remaining > 0) return;

      clearPenaltyTimer();
      const randomZone = PENALTY_ZONES[Math.floor(Math.random() * PENALTY_ZONES.length)];
      handlePenaltyZone(randomZone);
    }, 1000);
  }

  function renderPenaltyState() {
    const penalty = state.penalty;
    if (!penalty) return;

    const isShooting = penalty.current_turn === 'user_shoot';
    const availableZones = new Set(
      isShooting ? penalty.available_zones || [] : PENALTY_ZONES,
    );

    setText('penalty-user-name', state.match?.team_name || teamName());
    setText('penalty-opponent-name', state.match?.opponent?.name || 'Adversário');
    setText('penalty-user-score', penalty.user_penalties ?? 0);
    setText('penalty-opponent-score', penalty.opponent_penalties ?? 0);
    setText('penalty-actor-name', penalty.shooter_name || 'Cobrador');
    setText('penalty-turn-label', isShooting ? 'Sua cobrança' : 'Sua defesa');
    setText(
      'penalty-instruction',
      isShooting
        ? 'Escolha onde bater. As zonas apagadas estão bloqueadas pelo goleiro.'
        : 'Escolha rapidamente para onde seu goleiro deve pular.',
    );
    setText(
      'penalty-match-label',
      `${state.match?.stage_label || 'Mata-mata'} · ${state.match?.score?.user ?? 0} a ${state.match?.score?.opponent ?? 0}`,
    );
    setText('penalty-attempt-result', '');

    document.querySelectorAll('[data-penalty-zone]').forEach((button) => {
      const enabled = availableZones.has(button.dataset.penaltyZone);
      button.disabled = state.isPenaltyAnimating || !enabled;
      button.setAttribute('aria-disabled', String(button.disabled));
    });

    resetPenaltyAnimation();
    if (isShooting) {
      clearPenaltyTimer();
      $('penalty-timer').hidden = true;
    } else if (!state.isPenaltyAnimating) {
      startPenaltyDecisionTimer(penalty.decision_time_seconds);
    }
  }

  function showPenaltyShootout() {
    if (!state.match?.penalty) return;
    state.penalty = state.match.penalty;
    state.isPenaltyAnimating = false;
    showMode('penalty');
    renderPenaltyState();
  }

  async function animatePenaltyAttempt(attempt) {
    const keeper = $('penalty-keeper');
    const ball = $('penalty-ball');
    resetPenaltyAnimation();
    void keeper?.offsetWidth;
    keeper?.classList.add(`dive-${attempt.keeper_dive_zone}`);
    ball?.classList.add(`shot-${attempt.shoot_zone}`);

    await new Promise((resolve) => setTimeout(resolve, 700));
    setText('penalty-user-score', attempt.user_penalties);
    setText('penalty-opponent-score', attempt.opponent_penalties);
    setText(
      'penalty-attempt-result',
      attempt.scored
        ? `Gol de ${attempt.attempt_shooter_name}.`
        : `Defesa de ${attempt.attempt_goalkeeper_name}.`,
    );
    await new Promise((resolve) => setTimeout(resolve, 850));
  }

  async function handlePenaltyZone(zone) {
    if (state.isPenaltyAnimating || !state.penalty || !PENALTY_ZONES.includes(zone)) return;

    const isShooting = state.penalty.current_turn === 'user_shoot';
    if (isShooting && !state.penalty.available_zones?.includes(zone)) return;

    clearPenaltyTimer();
    state.isPenaltyAnimating = true;
    document.querySelectorAll('[data-penalty-zone]').forEach((button) => {
      button.disabled = true;
      button.setAttribute('aria-disabled', 'true');
    });

    const userId = Number(sessionUser()?.id);
    const baseBody = { user_id: userId, match_id: state.match.match_id };

    try {
      const attempt = isShooting
        ? await api.shootPenalty({ ...baseBody, shoot_zone: zone })
        : await api.savePenalty({ ...baseBody, dive_zone: zone });
      await animatePenaltyAttempt(attempt);

      state.penalty = attempt;
      state.match.penalty = attempt;
      if (attempt.is_finished) {
        state.match.requires_penalties = false;
        state.match.decided_on_penalties = true;
        state.match.penalties_user_score = attempt.user_penalties;
        state.match.penalties_opponent_score = attempt.opponent_penalties;
        state.match.result = attempt.result;
        state.match.result_label = attempt.result_label;
        state.match.coins_earned = attempt.coins_earned;
        state.match.new_balance = attempt.new_balance;
        state.match.campaign = attempt.campaign;
        if (attempt.campaign) {
          state.campaign = attempt.campaign;
          state.phaseIndex = Number(attempt.campaign.phase_index || 0);
        }
        queueBalance(attempt.new_balance);
        completeDisplayedMatch();
        state.isPenaltyAnimating = false;
        clearPenaltyTimer();
        await showResult();
        return;
      }

      state.isPenaltyAnimating = false;
      renderPenaltyState();
    } catch (error) {
      state.isPenaltyAnimating = false;
      showError(error.message || 'Não foi possível registrar a cobrança.');
      renderPenaltyState();
    }
  }

  function createEvents(match) {
    const apiEvents = Array.isArray(match.goal_events) ? match.goal_events : [];
    if (apiEvents.length && typeof DraftData !== 'undefined') {
      return DraftData.normalizeGoals(apiEvents).map((event) => ({
        team: event.team === 'USER' ? 'home' : 'away',
        minute: event.minute,
        scorer: event.playerName,
        playerName: event.playerName,
      }));
    }

    return [];
  }

  function resetLive(match) {
    state.minute = 0;
    state.events = createEvents(match);
    state.penalty = match.penalty || null;
    clearPenaltyTimer();
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
    $('btn-next-result').innerHTML = 'PRÓXIMO <span>→</span>';
    $('btn-next-result').hidden = true;
  }

  function renderSecondHalfDivider(hasSecondHalfEvent = false) {
    // Insere o divisor "2º Tempo" na timeline de eventos.
    const container = $('match-events');
    if (!container) return;

    const divider = container.querySelector('.match-half-divider') || document.createElement('div');
    if (!divider.parentNode) {
      divider.className = 'match-half-divider';
      divider.textContent = '2º Tempo';
    }

    if (!hasSecondHalfEvent) {
      container.appendChild(divider);
      return;
    }

    const firstHalfEvent = Array.from(container.querySelectorAll('.match-event'))
      .find((event) => Number(event.dataset.minute) <= 45);
    if (firstHalfEvent) container.insertBefore(divider, firstHalfEvent);
    else container.appendChild(divider);
  }

  function addGoal(event) {
    const scoreId = event.team === 'home' ? 'player-score' : 'opponent-score';
    const score = Number($(scoreId).textContent || 0) + 1;
    setText(scoreId, score);
    const team = event.team === 'home' ? state.match.team_name : state.match.opponent.name;
    if (typeof DraftEvents !== 'undefined') {
      const container = $('match-events');
      DraftEvents.renderGoalEvent(container, {
        minute: event.minute,
        playerName: event.playerName || event.scorer,
        team: event.team === 'home' ? 'USER' : 'OPPONENT',
      }, {
        teamName: state.match.team_name,
        opponentName: state.match.opponent.name,
      });
      const rendered = container.lastElementChild;
      if (rendered) {
        container.prepend(rendered);
        if (Number(event.minute) > 45) renderSecondHalfDivider(true);
      }
      setText('draft-status', `Gol aos ${event.minute} minutos: ${event.scorer}.`);
      return;
    }
    const row = document.createElement('div');
    row.className = 'match-event match-event--goal ' + (event.team === 'home' ? 'goal-left' : 'goal-right');
    row.dataset.team = event.team === 'home' ? 'USER' : 'OPPONENT';
    if (event.minute !== null && event.minute !== undefined) row.dataset.minute = String(event.minute);
    row.innerHTML = `<span class="match-event__minute">${String(event.minute).padStart(2, '0')}'</span><span class="match-event__icon">⚽</span><span class="match-event__text"><strong>Gol de ${escapeHtml(event.scorer)}</strong><small>${event.team === 'home' ? 'Que jogada do seu elenco!' : 'O adversário aproveita.'}</small></span><span class="match-event__team">${escapeHtml(team)}</span>`;
    $('match-events').prepend(row);
    if (Number(event.minute) > 45) renderSecondHalfDivider(true);
    setText('draft-status', `Gol aos ${event.minute} minutos: ${event.scorer}.`);
  }

  function tick() {
    state.minute += 1;
    setText('match-minute', String(state.minute).padStart(2, '0'));
    $('match-progress-bar').style.width = `${(state.minute / 90) * 100}%`;
    state.events
      .filter((event) => !event.seen && (event.minute === null || event.minute <= state.minute))
      .forEach((event) => {
        event.seen = true;
        addGoal(event);
      });
    if (state.minute === 46) renderSecondHalfDivider();
    if (state.minute >= 90) finishDraftMatch();
  }

  async function startDraftMatch() {
    if (state.timer) return;
    const userId = Number(sessionUser()?.id);
    if (!userId) {
      showError('Entre com uma conta real para jogar o Draft.');
      return;
    }

    updateStarterGate();
    if (!state.startReady) {
      showError('Complete seu time antes de jogar. É necessário escalar 11 titulares.');
      return;
    }

    const button = $('btn-start-draft');
    if (button) {
      button.disabled = true;
      button.setAttribute('aria-disabled', 'true');
    }
    try {
      // Campanha encerrada: reinicia a Copa antes de jogar a próxima partida.
      if (state.mode === 'cup' && state.campaign && !state.campaign.can_play) {
        state.campaign = await api.restartCampaign(userId);
        state.phaseIndex = Number(state.campaign.phase_index || 0);
        clearSavedOpponent();
        selectOpponentForCurrentStage({ forceNew: true });
        renderCupPhase();
      }
      if (!state.opponent) {
        throw new Error('Nenhum adversário disponível para esta fase.');
      }
      state.match = await api.playDraft(
        userId,
        state.opponent.id,
        state.mode,
        currentOpponentStage(),
      );
      // A resposta do backend define o confronto efetivamente jogado.
      state.opponent = state.match.opponent || state.opponent;
      if (state.match.campaign) {
        state.campaign = state.match.campaign;
        state.phaseIndex = Number(state.match.campaign.phase_index || 0);
        renderCupPhase();
      }
      if (state.mode === 'cup' && state.match.stage_label) {
        setText('cup-phase-label', 'Fase atual: ' + state.match.stage_label);
      }
      queueBalance(state.match.new_balance);
      resetLive(state.match);
      showMode('live');
      state.timer = setInterval(tick, 100);
    } catch (error) {
      showError(error.message || 'Não foi possível iniciar o Draft.');
    } finally {
      if (button) {
        button.disabled = false;
        button.setAttribute('aria-disabled', 'false');
      }
      updateStarterGate();
    }
  }

  function finishDraftMatch() {
    if (state.timer) {
      clearInterval(state.timer);
      state.timer = null;
    }
    setText('live-kicker', 'Partida encerrada');
    setText('live-title', state.match.requires_penalties ? 'Empate no mata-mata' : state.match.result_label);
    setText(
      'live-hint',
      state.match.requires_penalties
        ? 'A vaga será decidida em uma disputa de pênaltis.'
        : `Resultado final: ${state.match.score.user} a ${state.match.score.opponent}.`,
    );
    if (state.match.requires_penalties) {
      $('btn-next-result').innerHTML = 'DISPUTAR PÊNALTIS <span>→</span>';
    } else {
      completeDisplayedMatch();
    }
    $('btn-next-result').hidden = false;
    setText(
      'draft-status',
      state.match.requires_penalties
        ? 'Empate no mata-mata. Disputa de pênaltis disponível.'
        : `${state.match.result_label}: ${state.match.score.user} a ${state.match.score.opponent}.`,
    );
  }

  function resultClass(result) {
    return result === 'W' ? 'win' : result === 'L' ? 'loss' : 'draw';
  }

  function formatPlayedAt(value) {
    if (!value) return 'Agora';
    return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  }

  function setResultActionLabel(label) {
    const button = $('btn-play-again');
    if (!button) return;
    const textNode = Array.from(button.childNodes).find((node) => node.nodeType === Node.TEXT_NODE);
    if (textNode) textNode.nodeValue = `${label} `;
  }

  function renderHistory() {
    const container = $('match-history');
    const pagination = $('history-pagination');
    if (!container) return;
    container.innerHTML = '';
    container.setAttribute('aria-busy', 'false');
    setText('history-count', `${state.history.length} partidas`);

    if (!state.history.length) {
      container.innerHTML = '<p class="history-empty">Nenhuma partida disputada ainda.</p>';
      if (pagination) pagination.hidden = true;
      return;
    }

    const pageSize = 5;
    const totalPages = Math.max(1, Math.ceil(state.history.length / pageSize));
    state.historyPage = Math.min(Math.max(state.historyPage, 1), totalPages);
    const start = (state.historyPage - 1) * pageSize;
    const visibleHistory = state.history.slice(start, start + pageSize);

    if (typeof DraftHistory !== 'undefined') {
      DraftHistory.render(container, visibleHistory, { teamName: teamName() });
      renderHistoryPagination(totalPages);
      return;
    }

    visibleHistory.forEach((match) => {
      const opponent = state.opponents.find((item) => item.name === match.opponent_name);
      const code = opponent?.code || 'un';
      const row = document.createElement('article');
      row.className = `history-row history-row--${resultClass(match.result)}`;
      row.innerHTML = `<div class="history-row__phase">DRAFT<strong>FINALIZADO</strong></div><div class="history-row__opponent"><span class="flag-icon"><img class="flag-image" src="https://flagcdn.com/w80/${code}.png" alt="Bandeira de ${escapeHtml(match.opponent_name)}" width="80" height="53" loading="lazy"></span><strong>${escapeHtml(match.opponent_name)}</strong><small>${formatPlayedAt(match.played_at)}</small></div><div class="history-row__score"><strong>${match.user_score}</strong><span>—</span><strong>${match.opponent_score}</strong></div><div class="history-row__reward">${match.coins_earned ? `+${formatCoins(match.coins_earned)} ⚽` : '—'} </div><span class="history-row__status">${escapeHtml(match.result_label)}</span>`;
      container.appendChild(row);
    });
    renderHistoryPagination(totalPages);
  }

  function renderHistoryPagination(totalPages) {
    const container = $('history-pagination');
    if (!container) return;
    container.innerHTML = '';
    container.hidden = totalPages <= 1;
    if (totalPages <= 1) return;

    const previous = document.createElement('button');
    previous.type = 'button';
    previous.className = 'history-pagination__button';
    previous.textContent = '\u2190 Anterior';
    previous.disabled = state.historyPage === 1;
    previous.addEventListener('click', () => {
      state.historyPage -= 1;
      renderHistory();
    });

    const indicator = document.createElement('span');
    indicator.className = 'history-pagination__page';
    indicator.textContent = `P\u00e1gina ${state.historyPage} de ${totalPages}`;

    const next = document.createElement('button');
    next.type = 'button';
    next.className = 'history-pagination__button';
    next.textContent = 'Pr\u00f3xima \u2192';
    next.disabled = state.historyPage === totalPages;
    next.addEventListener('click', () => {
      state.historyPage += 1;
      renderHistory();
    });

    container.appendChild(previous);
    container.appendChild(indicator);
    container.appendChild(next);
  }

  function isWorldCupChampion() {
    return state.match?.mode === 'cup'
      && state.match?.stage === 'final'
      && state.match?.result === 'W';
  }

  function renderChampion() {
    const reward = Number(state.match?.coins_earned || 0);
    setText('champion-team', `${teamName()} levantou a taça!`);
    setText('champion-reward', `Recompensa: ${formatCoins(reward)} coins`);
    showMode('champion');
  }

  async function showResult() {
    if (state.match?.requires_penalties && !state.penalty?.is_finished) {
      $('btn-next-result').hidden = true;
      showPenaltyShootout();
      return;
    }

    completeDisplayedMatch();
    clearPenaltyTimer();
    $('btn-next-result').hidden = true;
    $('match-result').classList.toggle('result-panel--loss', state.match.result !== 'W');
    setText('result-title', state.match.result_label);
    setText('result-player-score', state.match.score.user);
    setText('result-opponent-score', state.match.score.opponent);
    setText(
      'result-copy',
      state.match.decided_on_penalties
        ? `Pênaltis: ${state.match.penalties_user_score} a ${state.match.penalties_opponent_score}. OVR do seu elenco: ${state.match.user_ovr}.`
        : `OVR do seu elenco: ${state.match.user_ovr}.`,
    );
    const reward = Number(state.match.coins_earned || 0);
    setText('result-reward', reward > 0 ? `+ ⚽ ${formatCoins(reward)}` : '⚽ 0 coins');
    setText('result-icon', state.match.result === 'W' ? '✓' : state.match.result === 'L' ? '×' : '—');
    setText('result-kicker', state.match.decided_on_penalties ? 'Decisão por pênaltis' : 'Fim de jogo');
    if (state.match.campaign) {
      state.campaign = state.match.campaign;
      state.phaseIndex = Number(state.match.campaign.phase_index || 0);
      setResultActionLabel(
        state.match.campaign.status === 'ACTIVE'
          ? 'PRÓXIMA PARTIDA'
          : state.match.campaign.status === 'COMPLETED'
            ? 'NOVA COPA'
            : 'RECOMEÇAR COPA',
      );
    } else {
      setResultActionLabel('JOGAR NOVAMENTE');
    }
    renderCupPhase();
    if (isWorldCupChampion()) {
      renderChampion();
    } else {
      showMode('result');
    }
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
    if (typeof DraftModes !== 'undefined') {
      DraftModes.bind({
        onModeChange: (mode, expanded) => {
          if (expanded) state.mode = mode;
          if (expanded && state.opponents.length) selectOpponentForCurrentStage();
          renderCupPhase();
          renderPreview();
        },
      });
    }
    renderCupPhase();
    setText('player-team-name', teamName());
    state.isLoading = true;
    $('main-content')?.setAttribute('aria-busy', 'true');
    renderPreviewSkeleton();
    renderHistorySkeleton();
    try {
      const [, , , , activePenalty] = await Promise.all([
        loadOpponents(),
        loadHistory(),
        loadSquad(),
        loadCampaign(),
        loadActivePenalty(),
      ]);
      if (activePenalty) {
        state.match = activePenalty;
        state.opponent = activePenalty.opponent;
        state.mode = activePenalty.mode;
        state.penalty = activePenalty.penalty;
        state.campaign = activePenalty.campaign || state.campaign;
        state.phaseIndex = Number(activePenalty.phase_index || 0);
        renderCupPhase();
        showPenaltyShootout();
      } else {
        selectOpponentForCurrentStage();
        renderPreview();
      }
    } catch (error) {
      showError(error.message || 'Não foi possível carregar o Draft.');
    } finally {
      state.isLoading = false;
      $('main-content')?.setAttribute('aria-busy', 'false');
      clearPreviewSkeleton();
    }
    $('btn-start-draft').addEventListener('click', startDraftMatch);
    $('btn-next-result').addEventListener('click', showResult);
    $('btn-play-again').addEventListener('click', async () => {
      const userId = Number(sessionUser()?.id);
      if (state.mode === 'cup' && state.campaign && !state.campaign.can_play) {
        try {
          state.campaign = await api.restartCampaign(userId);
          state.phaseIndex = Number(state.campaign.phase_index || 0);
          clearSavedOpponent();
        } catch (error) {
          showError(error.message || 'Não foi possível reiniciar a Copa.');
          return;
        }
      }

      $('match-result').classList.remove('result-panel--loss');
      state.match = null;
      state.penalty = null;
      state.pendingBalance = null;
      state.events = [];
      state.minute = 0;
      showMode('preview');
      selectOpponentForCurrentStage({ forceNew: true });
      renderCupPhase();
      renderPreview();
    });

    $('btn-champion-new-cup')?.addEventListener('click', () => $('btn-play-again')?.click());

    document.querySelectorAll('[data-penalty-zone]').forEach((button) => {
      button.addEventListener('click', () => handlePenaltyZone(button.dataset.penaltyZone));
    });
  }

  window.initDraft = initDraft;
  window.startDraftMatch = startDraftMatch;
  window.finishDraftMatch = finishDraftMatch;
})();
