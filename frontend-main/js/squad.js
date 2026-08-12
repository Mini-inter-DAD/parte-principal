/* Meu Elenco */

// ─── Formações: posições (x%, y%) no campo ───────────────────────────────────
// y=0% = gol de baixo (área do jogador), y=100% = gol de cima

renderNavbar('squad');

const FORMATIONS = {
  '4-3-3': [
    { slot: 'GK',  basePosition: 'GK', x: 50, y: 90 },
    { slot: 'LB',  basePosition: 'LB', x: 18, y: 72 }, { slot: 'CB1', basePosition: 'CB', x: 37, y: 72 },
    { slot: 'CB2', basePosition: 'CB', x: 63, y: 72 }, { slot: 'RB',  basePosition: 'RB', x: 82, y: 72 },
    { slot: 'CM1', basePosition: 'CM', x: 25, y: 52 }, { slot: 'CM2', basePosition: 'CM', x: 50, y: 52 },
    { slot: 'CM3', basePosition: 'CM', x: 75, y: 52 },
    { slot: 'LW',  basePosition: 'LW', x: 18, y: 28 }, { slot: 'ST',  basePosition: 'ST', x: 50, y: 24 },
    { slot: 'RW',  basePosition: 'RW', x: 82, y: 28 },
  ],
  '4-4-2': [
    { slot: 'GK',  basePosition: 'GK', x: 50, y: 90 },
    { slot: 'LB',  basePosition: 'LB', x: 18, y: 72 }, { slot: 'CB1', basePosition: 'CB', x: 37, y: 72 },
    { slot: 'CB2', basePosition: 'CB', x: 63, y: 72 }, { slot: 'RB',  basePosition: 'RB', x: 82, y: 72 },
    { slot: 'LM',  basePosition: 'LM', x: 15, y: 52 }, { slot: 'CM1', basePosition: 'CM', x: 37, y: 52 },
    { slot: 'CM2', basePosition: 'CM', x: 63, y: 52 }, { slot: 'RM',  basePosition: 'RM', x: 85, y: 52 },
    { slot: 'ST1', basePosition: 'ST', x: 35, y: 28 }, { slot: 'ST2', basePosition: 'ST', x: 65, y: 28 },
  ],
  '4-2-3-1': [
    { slot: 'GK',   basePosition: 'GK',  x: 50, y: 90 },
    { slot: 'LB',   basePosition: 'LB',  x: 18, y: 72 }, { slot: 'CB1', basePosition: 'CB', x: 37, y: 72 },
    { slot: 'CB2',  basePosition: 'CB',  x: 63, y: 72 }, { slot: 'RB',  basePosition: 'RB', x: 82, y: 72 },
    { slot: 'CDM1', basePosition: 'CDM', x: 37, y: 56 }, { slot: 'CDM2', basePosition: 'CDM', x: 63, y: 56 },
    { slot: 'LW',   basePosition: 'LW',  x: 18, y: 38 }, { slot: 'CAM', basePosition: 'CAM', x: 50, y: 38 },
    { slot: 'RW',   basePosition: 'RW',  x: 82, y: 38 },
    { slot: 'ST',   basePosition: 'ST',  x: 50, y: 20 },
  ],
  '4-2-4': [
    { slot: 'GK',   basePosition: 'GK',  x: 50, y: 90 },
    { slot: 'LB',   basePosition: 'LB',  x: 18, y: 72 }, { slot: 'CB1', basePosition: 'CB', x: 37, y: 72 },
    { slot: 'CB2',  basePosition: 'CB',  x: 63, y: 72 }, { slot: 'RB',  basePosition: 'RB', x: 82, y: 72 },
    { slot: 'CM1',  basePosition: 'CM',  x: 37, y: 54 }, { slot: 'CM2', basePosition: 'CM', x: 63, y: 54 },
    { slot: 'LW',   basePosition: 'LW',  x: 15, y: 26 }, { slot: 'ST1', basePosition: 'ST', x: 37, y: 22 },
    { slot: 'ST2',  basePosition: 'ST',  x: 63, y: 22 }, { slot: 'RW',  basePosition: 'RW', x: 85, y: 26 },
  ],
  '3-5-2': [
    { slot: 'GK',  basePosition: 'GK',  x: 50, y: 90 },
    { slot: 'CB1', basePosition: 'CB',  x: 25, y: 72 }, { slot: 'CB2', basePosition: 'CB', x: 50, y: 72 },
    { slot: 'CB3', basePosition: 'CB',  x: 75, y: 72 },
    { slot: 'LWB', basePosition: 'LWB', x: 12, y: 52 }, { slot: 'CM1', basePosition: 'CM', x: 32, y: 52 },
    { slot: 'CAM', basePosition: 'CAM', x: 50, y: 52 }, { slot: 'CM2', basePosition: 'CM', x: 68, y: 52 },
    { slot: 'RWB', basePosition: 'RWB', x: 88, y: 52 },
    { slot: 'ST1', basePosition: 'ST',  x: 35, y: 26 }, { slot: 'ST2', basePosition: 'ST', x: 65, y: 26 },
  ],
  '5-3-2': [
    { slot: 'GK',  basePosition: 'GK',  x: 50, y: 90 },
    { slot: 'LB',  basePosition: 'LB',  x: 10, y: 72 }, { slot: 'CB1', basePosition: 'CB', x: 28, y: 72 },
    { slot: 'CB2', basePosition: 'CB',  x: 50, y: 72 }, { slot: 'CB3', basePosition: 'CB', x: 72, y: 72 },
    { slot: 'RB',  basePosition: 'RB',  x: 90, y: 72 },
    { slot: 'CM1', basePosition: 'CM',  x: 25, y: 50 }, { slot: 'CAM', basePosition: 'CAM', x: 50, y: 50 },
    { slot: 'CM2', basePosition: 'CM',  x: 75, y: 50 },
    { slot: 'ST1', basePosition: 'ST',  x: 35, y: 26 }, { slot: 'ST2', basePosition: 'ST', x: 65, y: 26 },
  ],
  '4-5-1': [
    { slot: 'GK',  basePosition: 'GK',  x: 50, y: 90 },
    { slot: 'LB',  basePosition: 'LB',  x: 18, y: 72 }, { slot: 'CB1', basePosition: 'CB', x: 37, y: 72 },
    { slot: 'CB2', basePosition: 'CB',  x: 63, y: 72 }, { slot: 'RB',  basePosition: 'RB', x: 82, y: 72 },
    { slot: 'LW',  basePosition: 'LW',  x: 12, y: 50 }, { slot: 'CM1', basePosition: 'CM', x: 30, y: 50 },
    { slot: 'CAM', basePosition: 'CAM', x: 50, y: 50 }, { slot: 'CM2', basePosition: 'CM', x: 70, y: 50 },
    { slot: 'RW',  basePosition: 'RW',  x: 88, y: 50 },
    { slot: 'ST',  basePosition: 'ST',  x: 50, y: 24 },
  ],
  '3-4-3': [
    { slot: 'GK',  basePosition: 'GK',  x: 50, y: 90 },
    { slot: 'CB1', basePosition: 'CB',  x: 25, y: 72 }, { slot: 'CB2', basePosition: 'CB', x: 50, y: 72 },
    { slot: 'CB3', basePosition: 'CB',  x: 75, y: 72 },
    { slot: 'LWB', basePosition: 'LWB', x: 15, y: 54 }, { slot: 'CM1', basePosition: 'CM', x: 37, y: 54 },
    { slot: 'CM2', basePosition: 'CM',  x: 63, y: 54 }, { slot: 'RWB', basePosition: 'RWB', x: 85, y: 54 },
    { slot: 'LW',  basePosition: 'LW',  x: 18, y: 26 }, { slot: 'ST',  basePosition: 'ST', x: 50, y: 22 },
    { slot: 'RW',  basePosition: 'RW',  x: 82, y: 26 },
  ],
};

// Posições ofensivas e defensivas para cálculo do OVR breakdown
const SLOT_RULES = Object.freeze({
  GK:   { label: 'GOL', allowedPositions: ['GK'] },
  LB:   { label: 'LE',  allowedPositions: ['LB', 'LWB'] },
  CB1:  { label: 'ZAG', allowedPositions: ['CB', 'DF'] },
  CB2:  { label: 'ZAG', allowedPositions: ['CB', 'DF'] },
  CB3:  { label: 'ZAG', allowedPositions: ['CB', 'DF'] },
  RB:   { label: 'LD',  allowedPositions: ['RB', 'RWB'] },
  LWB:  { label: 'AE',  allowedPositions: ['LWB', 'LM', 'LB'] },
  RWB:  { label: 'AD',  allowedPositions: ['RWB', 'RM', 'RB'] },
  CDM:  { label: 'VOL', allowedPositions: ['CDM'] },
  CDM1: { label: 'VOL', allowedPositions: ['CDM', 'CM'] },
  CDM2: { label: 'VOL', allowedPositions: ['CDM', 'CM'] },
  CM1:  { label: 'MC',  allowedPositions: ['CM', 'MC', 'MF', 'CDM', 'CAM'] },
  CM2:  { label: 'MC',  allowedPositions: ['CM', 'MC', 'MF', 'CDM', 'CAM'] },
  CM3:  { label: 'MC',  allowedPositions: ['CM', 'MC', 'MF', 'CDM', 'CAM'] },
  CAM:  { label: 'MEI', allowedPositions: ['CAM', 'CM'] },
  LM:   { label: 'ME',  allowedPositions: ['LM', 'LW', 'CM'] },
  RM:   { label: 'MD',  allowedPositions: ['RM', 'RW', 'CM'] },
  LW:   { label: 'PE',  allowedPositions: ['LW', 'LM'] },
  RW:   { label: 'PD',  allowedPositions: ['RW', 'RM'] },
  ST:   { label: 'CA',  allowedPositions: ['ST', 'CF', 'FW'] },
  ST1:  { label: 'CA',  allowedPositions: ['ST', 'CF', 'FW'] },
  ST2:  { label: 'CA',  allowedPositions: ['ST', 'CF', 'FW'] },
});

const BENCH_POSITION_ORDER = Object.freeze([
  'GK', 'LB', 'LWB', 'CB', 'DF', 'RB', 'RWB',
  'CDM', 'CM', 'MC', 'MF', 'CAM', 'LM', 'RM',
  'LW', 'RW', 'CF', 'ST', 'FW',
]);

function getBenchPositionOrder(player) {
  const position = String(player?.position || '').trim().toUpperCase();
  const index = BENCH_POSITION_ORDER.indexOf(position);
  return index === -1 ? BENCH_POSITION_ORDER.length : index;
}

function compareBenchPlayers(left, right) {
  const positionDifference = getBenchPositionOrder(left) - getBenchPositionOrder(right);
  if (positionDifference) return positionDifference;

  const overallDifference = Number(right.overall ?? right.ovr ?? 0)
    - Number(left.overall ?? left.ovr ?? 0);
  if (overallDifference) return overallDifference;

  return String(left.name || '').localeCompare(String(right.name || ''), 'pt-BR');
}

Object.values(FORMATIONS).forEach(slots => {
  slots.forEach(slot => {
    const rule = SLOT_RULES[slot.slot];
    slot.slotId = slot.slot;
    slot.label = rule.label;
    slot.allowedPositions = rule.allowedPositions;
  });
});

const ATTACK_SLOTS = ['LW', 'RW', 'ST', 'ST1', 'ST2'];
const DEFENSE_SLOTS = ['GK', 'LB', 'CB1', 'CB2', 'CB3', 'RB', 'LWB', 'RWB'];

// ─── Estado ───────────────────────────────────────────────────────────────────
const SQUAD_STATE = {
  formation: '4-3-3',
  players: [],       // todos os jogadores do elenco
  lineup: [],        // 11 titulares mapeados por slot
  bench: [],
  selectedPlayerId: null,
  selectedSlotPosition: null,
  loading: true,
};

let fieldNameLayoutFrame = null;

// ─── Init ─────────────────────────────────────────────────────────────────────
function initSquad() {
  ensureAuth();
  renderSquadName();
  bindFormationButtons();
  bindReserveTarget();
  bindFieldNameResize();
  loadSquad();
}

function recalculateFieldNameWidths() {
  const container = document.getElementById('field-players');
  if (!container) return;
  applyFieldNameWidths(container, SQUAD_STATE.lineup);
}

function scheduleFieldNameLayout() {
  if (fieldNameLayoutFrame !== null) return;

  const schedule = typeof window.requestAnimationFrame === 'function'
    ? window.requestAnimationFrame.bind(window)
    : callback => window.setTimeout(callback, 0);
  fieldNameLayoutFrame = schedule(() => {
    fieldNameLayoutFrame = null;
    recalculateFieldNameWidths();
  });
}

function bindFieldNameResize() {
  if (typeof window === 'undefined') return;
  window.addEventListener('resize', scheduleFieldNameLayout, { passive: true });
}

// ─── Auth guard ───────────────────────────────────────────────────────────────
function ensureAuth() {
  if (typeof requireAuth === 'function') requireAuth();
}

// ─── Formações ────────────────────────────────────────────────────────────────
function bindFormationButtons() {
  document.querySelectorAll('.formation-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const f = btn.dataset.formation;
      if (f === SQUAD_STATE.formation) return;

      // Atualiza estado e botões
      SQUAD_STATE.formation = f;
      document.querySelectorAll('.formation-btn').forEach(b => {
        b.classList.toggle('formation-btn--active', b.dataset.formation === f);
        b.setAttribute('aria-pressed', String(b.dataset.formation === f));
      });

      renderField();
      renderBoxscore();
    });
  });
}

function bindReserveTarget() {
  const reserveTarget = document.getElementById('reserve-target');
  if (!reserveTarget) return;
  reserveTarget.addEventListener('click', sendSelectedPlayerToBench);
  reserveTarget.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      sendSelectedPlayerToBench();
    }
  });
}

async function loadSquad({ failOnError = false } = {}) {
  const userId = Number(getSession().user?.id);
  if (!userId) {
    SQUAD_STATE.loading = false;
    SQUAD_STATE.players = [];
    renderField();
    renderBoxscore();
    return;
  }

  setSquadLoading(true);
  try {
    const data = await api.getSquad(userId);
    SQUAD_STATE.players = Array.isArray(data) ? data : [];
  } catch (error) {
    if (failOnError) {
      renderField();
      renderBoxscore();
      updateOVR();
      throw error;
    }
    SQUAD_STATE.players = [];
    console.error('Não foi possível carregar o elenco:', error);
  } finally {
    setSquadLoading(false);
  }

  buildLineup();
  renderField();
  renderBoxscore();
  updateOVR();
}

function setSquadLoading(isLoading) {
  SQUAD_STATE.loading = isLoading;
  const main = document.getElementById('main-content');
  if (main) main.setAttribute('aria-busy', String(isLoading));

  document.querySelectorAll('.formation-btn').forEach((button) => {
    button.disabled = isLoading;
  });

  ['squad-ovr-value', 'ovr-attack', 'ovr-defense'].forEach((id) => {
    document.getElementById(id)?.classList.toggle('skeleton-block', isLoading);
  });

  if (isLoading) renderSquadSkeleton();
}

function renderSquadSkeleton() {
  const field = document.getElementById('field-players');
  const starters = document.getElementById('titulares-list');
  const reserves = document.getElementById('reservas-list');
  if (!field || !starters || !reserves) return;

  field.innerHTML = '';
  FORMATIONS[SQUAD_STATE.formation].forEach((slot) => {
    const item = document.createElement('div');
    item.className = 'field-slot field-slot--skeleton';
    item.style.left = `${slot.x}%`;
    item.style.top = `${slot.y}%`;
    item.setAttribute('aria-hidden', 'true');
    item.innerHTML = `
      <span class="field-slot__token skeleton-block"></span>
      <span class="field-slot__name skeleton-block"></span>
    `;
    field.appendChild(item);
  });

  starters.innerHTML = Array.from({ length: 11 }, () => `
    <li class="boxscore-item boxscore-item--skeleton" aria-hidden="true">
      <span class="skeleton-block squad-skeleton__position"></span>
      <span class="skeleton-block squad-skeleton__name"></span>
      <span class="skeleton-block squad-skeleton__ovr"></span>
    </li>
  `).join('');
  reserves.innerHTML = Array.from({ length: 5 }, () => `
    <li class="boxscore-item boxscore-item--skeleton" aria-hidden="true">
      <span class="skeleton-block squad-skeleton__position"></span>
      <span class="skeleton-block squad-skeleton__name"></span>
      <span class="skeleton-block squad-skeleton__ovr"></span>
    </li>
  `).join('');
}

// Mapeia jogadores nos slots da formação atual
function buildLineup() {
  const slots = FORMATIONS[SQUAD_STATE.formation];
  const starters = SQUAD_STATE.players.filter(
    player => player.is_starter && player.squad_position
  );
  const renderedPlayerIds = new Set();

  // Limpa o array antes de reconstruir
  SQUAD_STATE.lineup = slots.map(slot => {
    const player = starters.find(
      current => !renderedPlayerIds.has(Number(current.id))
        && String(current.squad_position).toUpperCase() === slot.slotId
    );
    if (player) renderedPlayerIds.add(Number(player.id));
    return { ...slot, player: player || null };
  });

  // Todo jogador que nao entrou no campo continua visivel no elenco.
  SQUAD_STATE.bench = SQUAD_STATE.players.filter(
    player => !renderedPlayerIds.has(Number(player.id))
  ).sort(compareBenchPlayers);
}

function renderSquadName() {
  const name = getSession().user?.username;
  const element = document.getElementById('squad-name');
  if (element && name) element.textContent = `Elenco de ${name}`;
}

// ─── Renderiza o campo ────────────────────────────────────────────────────────
function renderField() {
  buildLineup();

  const container = document.getElementById('field-players');
  container.innerHTML = '';
  const selectedPlayer = getSelectedPlayer();

  SQUAD_STATE.lineup.forEach(slot => {

    const el = document.createElement('div');
    const selected = slot.slotId === SQUAD_STATE.selectedSlotPosition;
    const incompatible = selectedPlayer
      && !canPlayerEnterSlot(selectedPlayer, slot);
    el.className = [
      'field-slot',
      slot.player ? '' : 'field-slot--empty',
      selected ? 'field-slot--selected' : '',
      incompatible ? 'field-slot--incompatible' : '',
    ].filter(Boolean).join(' ');
    el.style.left = `${slot.x}%`;
    el.style.top = `${slot.y}%`;
    el.addEventListener('click', () => handleSlotClick(slot));

    const token = document.createElement('div');
    token.className = 'field-slot__token';


    if (slot.player) {
      // mostra APENAS a posição dentro da bolinha
      token.textContent = slot.label;
      const fullPlayerName = String(slot.player.name ?? '').trim() || 'Jogador';
      el.setAttribute(
        'title',
        `${fullPlayerName} · ${slot.label}`
      );
    } else {
      token.textContent = slot.label;
    }

    const nameEl = document.createElement('span');
    nameEl.className = 'field-slot__name';

    // mostra nome adaptado ao espaço disponível no campo
    nameEl.textContent = slot.player
      ? formatPlayerNameForField(slot.player.name)
      : slot.label;

    el.appendChild(token);
    el.appendChild(nameEl);
    container.appendChild(el);
  });

  recalculateFieldNameWidths();
}

// ─── Renderiza o boxscore (coluna direita) ────────────────────────────────────
function renderBoxscore() {
  const titularesContainer = document.getElementById('titulares-list');
  const reservasContainer = document.getElementById('reservas-list');
  
  titularesContainer.innerHTML = '';
  reservasContainer.innerHTML = '';

  // 1. Renderiza os 11 slots (Titulares)
  SQUAD_STATE.lineup.forEach(slot => {
    const li = document.createElement('li');
    li.className = 'boxscore-item';

    if (slot.player) {
      const isSelected = Number(slot.player.id) === SQUAD_STATE.selectedPlayerId;
      li.classList.toggle('boxscore-item--selected', isSelected);
      li.setAttribute('role', 'button');
      li.setAttribute('aria-pressed', String(isSelected));
      li.tabIndex = 0;
      li.addEventListener('click', () => handlePlayerClick(slot.player.id));
      li.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handlePlayerClick(slot.player.id);
        }
      });
    }

    const pos = document.createElement('span');
    pos.className = 'boxscore-item__pos-badge';
    pos.textContent = slot.label;

    const name = document.createElement('span');
    name.className = `boxscore-item__name${slot.player ? '' : ' boxscore-item__name--empty'}`;
    name.textContent = slot.player ? formatPlayerName(slot.player.name) : 'Vazio';

    const ovr = document.createElement('span');
    ovr.className = `boxscore-item__ovr${slot.player ? '' : ' boxscore-item__ovr--empty'}`;
    ovr.textContent = slot.player ? (slot.player.overall ?? slot.player.ovr ?? '--') : '--';

    li.appendChild(pos);
    li.appendChild(name);
    li.appendChild(ovr);
    titularesContainer.appendChild(li);
  });

  // 2. Renderiza os Reservas (Até 5)
  if (SQUAD_STATE.bench && SQUAD_STATE.bench.length > 0) {
    SQUAD_STATE.bench.forEach(player => {
      const li = document.createElement('li');
      li.className = 'boxscore-item';
      const isSelected = Number(player.id) === SQUAD_STATE.selectedPlayerId;
      li.classList.toggle('boxscore-item--selected', isSelected);
      li.setAttribute('role', 'button');
      li.setAttribute('aria-pressed', String(isSelected));
      li.tabIndex = 0;
      li.addEventListener('click', () => handlePlayerClick(player.id));
      li.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handlePlayerClick(player.id);
        }
      });

      const pos = document.createElement('span');
      pos.className = 'boxscore-item__pos-badge';
      pos.textContent = formatPosition(player.position);

      const name = document.createElement('span');
      name.className = 'boxscore-item__name';
      name.textContent = formatPlayerName(player.name);

      const ovr = document.createElement('span');
      ovr.className = 'boxscore-item__ovr';
      ovr.textContent = player.overall ?? player.ovr ?? '--';

      li.appendChild(pos);
      li.appendChild(name);
      li.appendChild(ovr);
      reservasContainer.appendChild(li);
    });
  } else {
    // Caso não tenha nenhum reserva no banco
    const li = document.createElement('li');
    li.className = 'boxscore-item boxscore-item__name--empty';
    li.textContent = 'Sem reservas disponíveis';
    reservasContainer.appendChild(li);
  }

  updateOVR();
}

// ─── Cálculo de OVR ──────────────────────────────────────────────────────────
function getSelectedPlayer() {
  return SQUAD_STATE.players.find(
    player => Number(player.id) === SQUAD_STATE.selectedPlayerId
  ) || null;
}

function canPlayerEnterSlot(player, slot) {
  const naturalPosition = String(player?.position || '').trim().toUpperCase();
  return slot.allowedPositions.includes(naturalPosition);
}

function showToast(message, isError = false) {
  let toast = document.getElementById('squad-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'squad-toast';
    toast.className = 'squad-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.toggle('squad-toast--error', isError);
  toast.classList.add('squad-toast--visible');
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toast.classList.remove('squad-toast--visible'), 2400);
}

function clearSelection() {
  SQUAD_STATE.selectedPlayerId = null;
  SQUAD_STATE.selectedSlotPosition = null;
}

function handlePlayerClick(playerId) {
  const id = Number(playerId);
  const clickedPlayer = SQUAD_STATE.players.find(player => Number(player.id) === id);
  if (!clickedPlayer) return;

  if (SQUAD_STATE.selectedPlayerId === id) {
    clearSelection();
  } else {
    SQUAD_STATE.selectedPlayerId = id;
    SQUAD_STATE.selectedSlotPosition = null;
  }
  renderField();
  renderBoxscore();
}

async function handleSlotClick(slot) {
  const selectedPlayer = getSelectedPlayer();
  SQUAD_STATE.selectedSlotPosition = slot.slotId;

  if (!selectedPlayer) {
    renderField();
    renderBoxscore();
    return;
  }

  if (!canPlayerEnterSlot(selectedPlayer, slot)) {
    showToast('Posição incompatível para este jogador.', true);
    clearSelection();
    renderField();
    renderBoxscore();
    return;
  }
  await assignSelectedPlayer(slot.slotId);
}

async function assignSelectedPlayer(targetSlot) {
  const userId = Number(getSession().user?.id);
  const player = getSelectedPlayer();
  if (!userId || !player) return;
  try {
    await api.assignPosition({
      user_id: userId,
      player_id: Number(player.id),
      target_slot: targetSlot,
    });
    clearSelection();
    await loadSquad({ failOnError: true });
    const updatedPlayer = SQUAD_STATE.players.find(
      current => Number(current.id) === Number(player.id)
    );
    if (
      !updatedPlayer
      || !updatedPlayer.is_starter
      || String(updatedPlayer.squad_position).toUpperCase() !== targetSlot.toUpperCase()
    ) {
      throw new Error('O jogador não foi confirmado na posição escolhida.');
    }
    showToast('Escalação atualizada.');
  } catch (error) {
    showToast(error.message || 'Não foi possível atualizar a escalação.', true);
    clearSelection();
    renderField();
    renderBoxscore();
  }
}

async function sendSelectedPlayerToBench() {
  const userId = Number(getSession().user?.id);
  const player = getSelectedPlayer();
  if (!userId || !player) return;
  if (!player.is_starter) {
    clearSelection();
    renderField();
    renderBoxscore();
    return;
  }
  try {
    await api.moveToBench({
      user_id: userId,
      player_id: Number(player.id),
    });
    clearSelection();
    await loadSquad();
    showToast('Jogador enviado para as reservas.');
  } catch (error) {
    showToast(error.message || 'Não foi possível enviar o jogador para as reservas.', true);
    clearSelection();
    renderField();
    renderBoxscore();
  }
}

function updateOVR() {
  const withPlayers = SQUAD_STATE.lineup.filter(s => s.player);
  if (!withPlayers.length) {
    setOVRDisplay('--', '--', '--');
    return;
  }

  const avg = arr => arr.length
    ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
    : '--';

  const all     = withPlayers.map(s => Number(s.player.overall ?? s.player.ovr ?? 0));
  const attack  = withPlayers
    .filter(s => ATTACK_SLOTS.includes(s.slotId))
    .map(s => Number(s.player.overall ?? s.player.ovr ?? 0));
  const defense = withPlayers
    .filter(s => DEFENSE_SLOTS.includes(s.slotId))
    .map(s => Number(s.player.overall ?? s.player.ovr ?? 0));

  setOVRDisplay(avg(all), avg(attack), avg(defense));
}

function setOVRDisplay(overall, attack, defense) {
  const elOvr = document.getElementById('squad-ovr-value');
  const elAtk = document.getElementById('ovr-attack');
  const elDef = document.getElementById('ovr-defense');

  if (elOvr) elOvr.textContent = overall;
  if (elAtk) elAtk.textContent = attack;
  if (elDef) elDef.textContent = defense;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function collectInitials(name) {
  return String(name).split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
}

function getMockPlayers() {
  return [
    { id: 1, name: 'Alisson',      position: 'GOL', overall: 89, photo_url: '' },
    { id: 5, name: 'Danilo S.',   position: 'LE',  overall: 80, photo_url: '' },
    { id: 3, name: 'Marquinhos',   position: 'ZAG', overall: 87, photo_url: '' },
    { id: 4, name: 'Gabriel M.',      position: 'ZAG', overall: 85, photo_url: '' },
    { id: 2, name: 'Ibañez',       position: 'LD',  overall: 83, photo_url: '' },
    { id: 6, name: 'Casemiro', position: 'MC', overall: 88 },
    { id: 7, name: 'Bruno Guimarães', position: 'MC', overall: 86 },
    { id: 8, name: 'Lucas Paquetá', position: 'MC', overall: 85 },
    { id: 9, name: 'Neymar Jr.', position: 'PE', overall: 91 },
    { id: 10, name: 'Vini Jr.', position: 'PD', overall: 94 },
    { id: 11, name: 'Endrick', position: 'CA', overall: 87 }
  ];
}

window.initSquad = initSquad;
