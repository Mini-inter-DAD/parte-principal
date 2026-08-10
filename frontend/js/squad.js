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
    { pos: 'ADE', x: 12, y: 52 }, { pos: 'MC',  x: 32, y: 52 },
    { pos: 'MEI', x: 50, y: 52 }, { pos: 'MC',  x: 68, y: 52 },
    { pos: 'ADD', x: 88, y: 52 },
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
    { pos: 'ADE', x: 15, y: 54 }, { pos: 'MC',  x: 37, y: 54 },
    { pos: 'MC',  x: 63, y: 54 }, { pos: 'ADD', x: 85, y: 54 },
    { pos: 'PE',  x: 18, y: 26 }, { pos: 'CA',  x: 50, y: 22 },
    { pos: 'PD',  x: 82, y: 26 },
  ],
};

// Posições ofensivas e defensivas para cálculo do OVR breakdown
const ATTACK_POS  = ['CA', 'PE', 'PD', 'MEI', 'ADE', 'ADD'];
const DEFENSE_POS = ['GOL', 'ZAG', 'LD', 'LE', 'VOL'];

// ─── Estado ───────────────────────────────────────────────────────────────────
const SQUAD_STATE = {
  formation: '4-3-3',
  players: [],       // todos os jogadores do elenco
  lineup: [],        // 11 titulares mapeados por slot
};

// ─── Init ─────────────────────────────────────────────────────────────────────
function initSquad() {
  ensureAuth();
  // renderNavbar('squad');
  bindFormationButtons();
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

// ─── Carrega elenco da API ────────────────────────────────────────────────────
// TODO: usar o comentado ao inves do mock qnd a api tiver pronta
// async function loadSquad() {
//   try {
//     const data = await api.getSquad();

//     const players = Array.isArray(data.players) ? data.players : data;

//     if (!players || players.length === 0) {
//       SQUAD_STATE.players = getMockPlayers();
//     } else {
//       SQUAD_STATE.players = players;
//     }

//   } catch (error) {
//     console.log("Usando mock:", error);
//     SQUAD_STATE.players = getMockPlayers();
//   }

//   buildLineup();
//   renderField();
//   renderBoxscore();
//   updateOVR();
// }

async function loadSquad() {

  // MOCK FIXO PARA TESTE
  SQUAD_STATE.players = getMockPlayers();

  buildLineup();
  renderField();
  renderBoxscore();
  updateOVR();
}

// Mapeia jogadores nos slots da formação atual
function buildLineup() {
  const slots   = FORMATIONS[SQUAD_STATE.formation];
  const players = [...SQUAD_STATE.players];

  // Limpa o array antes de reconstruir
  SQUAD_STATE.lineup = slots.map(slot => {
    const idx = players.findIndex(p => matchPosition(p.position, slot.pos));
    if (idx !== -1) {
      const player = players.splice(idx, 1)[0];
      return { ...slot, player };
    }
    return { ...slot, player: null };
  });

  // O que sobrou da API/Mock vira reserva
  SQUAD_STATE.bench = players.slice(0, 5); 
}

// Match flexível entre posição do jogador e label do slot
function matchPosition(playerPos, slotPos) {
  if (!playerPos) return false;
  const p = playerPos.toUpperCase();
  const s = slotPos.toUpperCase();
  const MAP = {
    GOL: ['GOL', 'GK', 'GOLEIRO'],
    ZAG: ['ZAG', 'CB', 'ZAGUEIRO'],
    LD:  ['LD', 'RB', 'LATERAL DIREITO'],
    LE:  ['LE', 'LB', 'LATERAL ESQUERDO'],
    VOL: ['VOL', 'CDM', 'VOLANTE'],
    MC:  ['MC', 'CM', 'MEIA CENTRAL'],
    MEI: ['MEI', 'CAM', 'MEIA ATACANTE'],
    PE:  ['PE', 'LW', 'PONTA ESQUERDA'],
    PD:  ['PD', 'RW', 'PONTA DIREITA'],
    CA:  ['CA', 'ST', 'CF', 'CENTRO AVANTE', 'ATACANTE'],
    ADE: ['ADE', 'LM', 'ALA ESQUERDO'],
    ADD: ['ADD', 'RM', 'ALA DIREITO'],
  };
  return (MAP[s] || [s]).includes(p);
}

// ─── Renderiza o campo ────────────────────────────────────────────────────────
// ─── Renderiza o campo ────────────────────────────────────────────────────────
function renderField() {
  buildLineup();

  const container = document.getElementById('field-players');
  container.innerHTML = '';

  SQUAD_STATE.lineup.forEach(slot => {

    const el = document.createElement('div');
    el.className = `field-slot${slot.player ? '' : ' field-slot--empty'}`;
    el.style.left = `${slot.x}%`;
    el.style.top = `${slot.y}%`;

    const token = document.createElement('div');
    token.className = 'field-slot__token';


    if (slot.player) {
      // mostra APENAS a posição dentro da bolinha
      token.textContent = slot.pos;
      el.setAttribute(
        'title',
        `${slot.player.name} · ${slot.pos}`
      );
    } else {
      token.textContent = slot.pos;
    }

    const nameEl = document.createElement('span');
    nameEl.className = 'field-slot__name';

    // mostra nome completo
    nameEl.textContent = slot.player
      ? slot.player.name
      : slot.pos;

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

    const pos = document.createElement('span');
    pos.className = 'boxscore-item__pos-badge';
    pos.textContent = slot.pos;

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

      const pos = document.createElement('span');
      pos.className = 'boxscore-item__pos-badge';
      pos.textContent = player.position;

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
