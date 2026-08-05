/* Meu Elenco */

// ─── Formações: posições (x%, y%) no campo ───────────────────────────────────
// y=0% = gol de baixo (área do jogador), y=100% = gol de cima

renderNavbar('squad');

const FORMATIONS = {
  '4-3-3': [
    { pos: 'GOL', x: 50, y: 90 },
    { pos: 'LE',  x: 18, y: 72 }, { pos: 'ZAG', x: 37, y: 72 },
    { pos: 'ZAG', x: 63, y: 72 }, { pos: 'LD',  x: 82, y: 72 },
    { pos: 'MC',  x: 25, y: 52 }, { pos: 'MC',  x: 50, y: 52 },
    { pos: 'MC',  x: 75, y: 52 },
    { pos: 'PE',  x: 18, y: 28 }, { pos: 'CA',  x: 50, y: 24 },
    { pos: 'PD',  x: 82, y: 28 },
  ],
  '4-4-2': [
    { pos: 'GOL', x: 50, y: 90 },
    { pos: 'LE',  x: 18, y: 72 }, { pos: 'ZAG', x: 37, y: 72 },
    { pos: 'ZAG', x: 63, y: 72 }, { pos: 'LD',  x: 82, y: 72 },
    { pos: 'PE',  x: 15, y: 52 }, { pos: 'MC',  x: 37, y: 52 },
    { pos: 'MC',  x: 63, y: 52 }, { pos: 'PD',  x: 85, y: 52 },
    { pos: 'CA',  x: 35, y: 28 }, { pos: 'CA',  x: 65, y: 28 },
  ],
  '4-2-3-1': [
    { pos: 'GOL', x: 50, y: 90 },
    { pos: 'LE',  x: 18, y: 72 }, { pos: 'ZAG', x: 37, y: 72 },
    { pos: 'ZAG', x: 63, y: 72 }, { pos: 'LD',  x: 82, y: 72 },
    { pos: 'VOL', x: 37, y: 56 }, { pos: 'VOL', x: 63, y: 56 },
    { pos: 'PE',  x: 18, y: 38 }, { pos: 'MEI', x: 50, y: 38 },
    { pos: 'PD',  x: 82, y: 38 },
    { pos: 'CA',  x: 50, y: 20 },
  ],
  '4-2-4': [
    { pos: 'GOL', x: 50, y: 90 },
    { pos: 'LE',  x: 18, y: 72 }, { pos: 'ZAG', x: 37, y: 72 },
    { pos: 'ZAG', x: 63, y: 72 }, { pos: 'LD',  x: 82, y: 72 },
    { pos: 'VOL', x: 37, y: 54 }, { pos: 'VOL', x: 63, y: 54 },
    { pos: 'PE',  x: 15, y: 26 }, { pos: 'CA',  x: 37, y: 22 },
    { pos: 'CA',  x: 63, y: 22 }, { pos: 'PD',  x: 85, y: 26 },
  ],
  '3-5-2': [
    { pos: 'GOL', x: 50, y: 90 },
    { pos: 'ZAG', x: 25, y: 72 }, { pos: 'ZAG', x: 50, y: 72 },
    { pos: 'ZAG', x: 75, y: 72 },
    { pos: 'AE',  x: 12, y: 52 }, { pos: 'MC',  x: 32, y: 52 },
    { pos: 'MEI', x: 50, y: 52 }, { pos: 'MC',  x: 68, y: 52 },
    { pos: 'AD',  x: 88, y: 52 },
    { pos: 'CA',  x: 35, y: 26 }, { pos: 'CA',  x: 65, y: 26 },
  ],
  '5-3-2': [
    { pos: 'GOL', x: 50, y: 90 },
    { pos: 'LE',  x: 10, y: 72 }, { pos: 'ZAG', x: 28, y: 72 },
    { pos: 'ZAG', x: 50, y: 72 }, { pos: 'ZAG', x: 72, y: 72 },
    { pos: 'LD',  x: 90, y: 72 },
    { pos: 'MC',  x: 25, y: 50 }, { pos: 'MEI', x: 50, y: 50 },
    { pos: 'MC',  x: 75, y: 50 },
    { pos: 'CA',  x: 35, y: 26 }, { pos: 'CA',  x: 65, y: 26 },
  ],
  '4-5-1': [
    { pos: 'GOL', x: 50, y: 90 },
    { pos: 'LE',  x: 18, y: 72 }, { pos: 'ZAG', x: 37, y: 72 },
    { pos: 'ZAG', x: 63, y: 72 }, { pos: 'LD',  x: 82, y: 72 },
    { pos: 'PE',  x: 12, y: 50 }, { pos: 'MC',  x: 30, y: 50 },
    { pos: 'MEI', x: 50, y: 50 }, { pos: 'MC',  x: 70, y: 50 },
    { pos: 'PD',  x: 88, y: 50 },
    { pos: 'CA',  x: 50, y: 24 },
  ],
  '3-4-3': [
    { pos: 'GOL', x: 50, y: 90 },
    { pos: 'ZAG', x: 25, y: 72 }, { pos: 'ZAG', x: 50, y: 72 },
    { pos: 'ZAG', x: 75, y: 72 },
    { pos: 'AE',  x: 15, y: 54 }, { pos: 'MC',  x: 37, y: 54 },
    { pos: 'MC',  x: 63, y: 54 }, { pos: 'AD',  x: 85, y: 54 },
    { pos: 'PE',  x: 18, y: 26 }, { pos: 'CA',  x: 50, y: 22 },
    { pos: 'PD',  x: 82, y: 26 },
  ],
};

// Posições ofensivas e defensivas para cálculo do OVR breakdown
const ATTACK_POS  = ['CA', 'PE', 'PD', 'MEI', 'AE', 'AD'];
const DEFENSE_POS = ['GOL', 'ZAG', 'LD', 'LE', 'VOL'];

// ─── Estado ───────────────────────────────────────────────────────────────────
const SQUAD_STATE = {
  formation: '4-3-3',
  players: [],       // todos os jogadores do elenco
  lineup: [],        // 11 titulares mapeados por slot
  bench: [],
  selectedPlayerId: null,
  selectedSlotPosition: null,
};

// ─── Init ─────────────────────────────────────────────────────────────────────
function initSquad() {
  ensureAuth();
  // renderNavbar('squad');
  bindFormationButtons();
  bindReserveTarget();
  loadSquad();
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

async function loadSquad() {
  const userId = Number(getSession().user?.id);
  if (!userId) {
    SQUAD_STATE.players = [];
    renderField();
    renderBoxscore();
    return;
  }

  try {
    const data = await api.getSquad(userId);
    SQUAD_STATE.players = Array.isArray(data) ? data : [];
  } catch (error) {
    SQUAD_STATE.players = [];
    console.error('Não foi possível carregar o elenco:', error);
  }

  buildLineup();
  renderField();
  renderBoxscore();
  updateOVR();
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
        && formatPosition(current.squad_position) === formatPosition(slot.pos)
    );
    if (player) renderedPlayerIds.add(Number(player.id));
    return { ...slot, player: player || null };
  });

  // Todo jogador que nao entrou no campo continua visivel no elenco.
  SQUAD_STATE.bench = SQUAD_STATE.players.filter(
    player => !renderedPlayerIds.has(Number(player.id))
  );
}

// ─── Renderiza o campo ────────────────────────────────────────────────────────
// ─── Renderiza o campo ────────────────────────────────────────────────────────
function renderField() {
  buildLineup();

  const container = document.getElementById('field-players');
  container.innerHTML = '';
  const selectedPlayer = getSelectedPlayer();

  SQUAD_STATE.lineup.forEach(slot => {

    const el = document.createElement('div');
    const selected = slot.pos === SQUAD_STATE.selectedSlotPosition;
    const incompatible = selectedPlayer && !canPlayInPosition(selectedPlayer.position, slot.pos);
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
      token.textContent = formatPosition(slot.pos);
      el.setAttribute(
        'title',
        `${slot.player.name} · ${slot.pos}`
      );
    } else {
      token.textContent = formatPosition(slot.pos);
    }

    const nameEl = document.createElement('span');
    nameEl.className = 'field-slot__name';

    // mostra nome completo
    nameEl.textContent = slot.player
      ? slot.player.name
      : formatPosition(slot.pos);

    el.appendChild(token);
    el.appendChild(nameEl);
    container.appendChild(el);
  });
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
    pos.textContent = formatPosition(slot.pos);

    const name = document.createElement('span');
    name.className = `boxscore-item__name${slot.player ? '' : ' boxscore-item__name--empty'}`;
    name.textContent = slot.player ? slot.player.name : 'Vazio';

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
      name.textContent = player.name;

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
  SQUAD_STATE.selectedSlotPosition = slot.pos;

  if (!selectedPlayer) {
    renderField();
    renderBoxscore();
    return;
  }

  if (!canPlayInPosition(selectedPlayer.position, slot.pos)) {
    showToast('Posição incompatível para este jogador.', true);
    clearSelection();
    renderField();
    renderBoxscore();
    return;
  }
  await assignSelectedPlayer(slot.pos);
}

async function assignSelectedPlayer(targetPosition) {
  const userId = Number(getSession().user?.id);
  const player = getSelectedPlayer();
  if (!userId || !player) return;
  try {
    await api.assignPosition({
      user_id: userId,
      player_id: Number(player.id),
      target_position: targetPosition,
    });
    clearSelection();
    await loadSquad();
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
    .filter(s => ATTACK_POS.includes(s.pos))
    .map(s => Number(s.player.overall ?? s.player.ovr ?? 0));
  const defense = withPlayers
    .filter(s => DEFENSE_POS.includes(s.pos))
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
