(function () {
  const OPPONENTS = [
    { name: "Japão", code: "jp", ovr: 79, scorers: ["Kubo", "Ueda", "Minamino"] },
    { name: "Estados Unidos", code: "us", ovr: 80, scorers: ["Pulisic", "Balogun", "McKennie"] },
    { name: "México", code: "mx", ovr: 77, scorers: ["Lozano", "Giménez", "Antuna"] },
    { name: "França", code: "fr", ovr: 88, scorers: ["Mbappé", "Griezmann", "Thuram"] },
    { name: "Marrocos", code: "ma", ovr: 81, scorers: ["En-Nesyri", "Ziyech", "Ounahi"] }
  ];
  const HOME = { name: "Dream Cup FC", ovr: 82, flag: "DC", scorers: ["Messi", "Neymar Jr", "Endrick", "Vini Jr."] };
  const REWARD = 250;
  let state = { opponent: OPPONENTS[0], minute: 0, homeScore: 0, awayScore: 0, events: [], timer: null, history: 3, result: null };

  const $ = (id) => document.getElementById(id);
  const setText = (id, value) => { const node = $(id); if (node) node.textContent = value; };
  const renderFlag = (id, team) => {
    const node = $(id);
    if (!node || !team?.code) return;
    node.innerHTML = `<img class="flag-image" src="https://flagcdn.com/w80/${team.code}.png" alt="Bandeira de ${team.name}" width="80" height="53" loading="eager">`;
    node.setAttribute("aria-label", `Bandeira de ${team.name}`);
  };

  function pickOpponent() {
    const previous = state.opponent?.name;
    const available = OPPONENTS.filter((team) => team.name !== previous);
    return available[Math.floor(Math.random() * available.length)];
  }

  function renderPreview() {
    state.opponent = pickOpponent();
    setText("player-team-name", HOME.name); setText("player-team-ovr", HOME.ovr);
    setText("opponent-team-name", state.opponent.name); setText("opponent-team-ovr", state.opponent.ovr); renderFlag("opponent-flag", state.opponent);
    setText("draft-status", `Próximo adversário: ${state.opponent.name}, OVR ${state.opponent.ovr}.`);
  }

  function weightedResult() {
    const difference = HOME.ovr - state.opponent.ovr;
    const roll = Math.random() * 100;
    if (roll < 42 + difference * 2.2) return "home";
    if (roll < 70 + difference * 1.1) return "draw";
    return "away";
  }

  function createSchedule() {
    const result = weightedResult();
    let homeGoals = result === "home" ? 2 + Math.floor(Math.random() * 3) : result === "draw" ? 1 + Math.floor(Math.random() * 2) : Math.floor(Math.random() * 2);
    let awayGoals = result === "away" ? 2 + Math.floor(Math.random() * 2) : result === "draw" ? homeGoals : Math.floor(Math.random() * 2);
    if (result === "home" && homeGoals <= awayGoals) homeGoals = awayGoals + 1;
    if (result === "away" && awayGoals <= homeGoals) awayGoals = homeGoals + 1;
    const goals = [];
    for (let i = 0; i < homeGoals; i++) goals.push({ team: "home", minute: 8 + Math.floor(Math.random() * 78), scorer: HOME.scorers[Math.floor(Math.random() * HOME.scorers.length)] });
    for (let i = 0; i < awayGoals; i++) goals.push({ team: "away", minute: 11 + Math.floor(Math.random() * 76), scorer: state.opponent.scorers[Math.floor(Math.random() * state.opponent.scorers.length)] });
    return goals.sort((a, b) => a.minute - b.minute);
  }

  function showMode(mode) {
    $("match-preview").hidden = mode !== "preview";
    $("live-match").hidden = mode !== "live";
    $("match-result").hidden = mode !== "result";
  }

  function resetLive() {
    state.minute = 0; state.homeScore = 0; state.awayScore = 0; state.events = createSchedule(); state.result = null;
    setText("player-score", 0); setText("opponent-score", 0); setText("match-minute", "00"); $("match-progress-bar").style.width = "0%";
    $("match-events").innerHTML = ""; setText("live-player-name", HOME.name); setText("live-opponent-name", state.opponent.name); renderFlag("live-opponent-flag", state.opponent);
    setText("live-kicker", "Ao vivo"); setText("live-title", "A partida começou"); setText("live-hint", "A bola está rolando. Os principais lances aparecerão aqui."); $("btn-next-result").hidden = true;
  }

  function addGoal(event) {
    if (event.team === "home") state.homeScore += 1; else state.awayScore += 1;
    setText("player-score", state.homeScore); setText("opponent-score", state.awayScore);
    const row = document.createElement("div"); row.className = "match-event";
    const team = event.team === "home" ? HOME.name : state.opponent.name;
    row.innerHTML = `<span class="match-event__minute">${String(event.minute).padStart(2, "0")}'</span><span class="match-event__icon">⚽</span><span class="match-event__text"><strong>Gol de ${event.scorer}</strong><small>${event.team === "home" ? "Que jogada da sua seleção!" : "A seleção adversária aproveita."}</small></span><span class="match-event__team">${team}</span>`;
    $("match-events").prepend(row);
    setText("draft-status", `Gol aos ${event.minute} minutos: ${event.scorer}, ${team}.`);
  }

  function tick() {
    state.minute += 1; setText("match-minute", String(state.minute).padStart(2, "0")); $("match-progress-bar").style.width = `${(state.minute / 90) * 100}%`;
    state.events.filter((event) => !event.seen && event.minute <= state.minute).forEach((event) => { event.seen = true; addGoal(event); });
    if (state.minute >= 90) finishDraftMatch();
  }

  function startDraftMatch() {
    if (state.timer) clearInterval(state.timer);
    resetLive(); showMode("live"); setText("draft-status", `Partida iniciada: ${HOME.name} contra ${state.opponent.name}.`);
    state.timer = setInterval(tick, 100);
  }

  function renderHistory(result) {
    const row = document.createElement("article"); row.className = `history-row history-row--${result.outcome}`;
    row.innerHTML = `<div class="history-row__phase">AMISTOSO<strong>AGORA</strong></div><div class="history-row__opponent"><span class="flag-icon"><img class="flag-image" src="https://flagcdn.com/w80/${state.opponent.code}.png" alt="Bandeira de ${state.opponent.name}" width="80" height="53" loading="eager"></span><strong>${state.opponent.name}</strong><small>Agora · 90 minutos</small></div><div class="history-row__score"><strong>${state.homeScore}</strong><span>—</span><strong>${state.awayScore}</strong></div><div class="history-row__reward">${result.outcome === "win" ? `+${REWARD}` : "—"} <small>${result.outcome === "win" ? "coins" : "Sem recompensa"}</small></div><span class="history-row__status">${result.label}</span>`;
    $("match-history").prepend(row); state.history += 1; setText("history-count", `${state.history} partidas`);
  }

  function finishDraftMatch() {
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
    const outcome = state.homeScore > state.awayScore ? "win" : state.homeScore < state.awayScore ? "loss" : "draw";
    const result = { outcome, label: outcome === "win" ? "VITÓRIA" : outcome === "loss" ? "DERROTA" : "EMPATE" }; state.result = result;
    setText("live-kicker", "Partida encerrada"); setText("live-title", "Fim de jogo"); setText("live-hint", "Confira os gols e os principais lances antes de avançar."); $("btn-next-result").hidden = false;
    setText("draft-status", `Fim de jogo. ${result.label}: ${state.homeScore} a ${state.awayScore}.`);
  }

  function showResult() {
    const { outcome, label } = state.result;
    $("btn-next-result").hidden = true;
    $("match-result").classList.toggle("result-panel--loss", outcome !== "win"); showMode("result");
    setText("result-title", outcome === "win" ? "Vitória!" : outcome === "loss" ? "Derrota" : "Empate"); setText("result-player-score", state.homeScore); setText("result-opponent-score", state.awayScore);
    setText("result-copy", outcome === "win" ? "Seu elenco foi superior e garantiu mais uma vitória." : outcome === "loss" ? "Hoje não deu. Ajuste seu elenco e tente novamente." : "Equilíbrio total em campo. Tente novamente para buscar a vitória.");
    setText("result-reward", outcome === "win" ? `+ ⚽ ${REWARD}` : "⚽ Nenhuma recompensa nesta partida"); setText("result-icon", outcome === "win" ? "✓" : outcome === "loss" ? "×" : "—");
    renderHistory({ outcome, label });
  }

  function initDraft() {
    if (!$('match-preview')) return;
    if (typeof renderNavbar === "function") renderNavbar("draft");
    renderPreview(); $("btn-start-draft").addEventListener("click", startDraftMatch); $("btn-next-result").addEventListener("click", showResult);
    $("btn-play-again").addEventListener("click", () => { $("match-result").classList.remove("result-panel--loss"); showMode("preview"); renderPreview(); });
  }

  window.initDraft = initDraft; window.startDraftMatch = startDraftMatch; window.finishDraftMatch = finishDraftMatch;
})();
