/* Mercado da Bola */

const MARKET_STATE = {
  filters: {
    section: '',
    nation: '',
    position: '',
    ovrMin: 70,
    ovrMax: 99,
    priceMin: 0,
    priceMax: 999999,
    query: '',
  },
  sections: [],
  players: [],
};

const FALLBACK_SECTIONS = ['Estrelas', 'Destaques da Copa', 'Veteranos'];
const FALLBACK_PLAYERS = [
  {
    id: '1',
    name: 'Lionel Messi',
    nationality: 'Argentina',
    position: 'Meia',
    ovr: 97,
    price: 1850,
    photo: '',
    section: 'Estrelas',
  },
  {
    id: '2',
    name: 'Neymar Jr.',
    nationality: 'Brasil',
    position: 'Atacante',
    ovr: 94,
    price: 1720,
    photo: '',
    section: 'Destaques da Copa',
  },
  {
    id: '3',
    name: 'Kylian Mbappé',
    nationality: 'França',
    position: 'Atacante',
    ovr: 96,
    price: 1780,
    photo: '',
    section: 'Estrelas',
  },
  {
    id: '4',
    name: 'Virgil van Dijk',
    nationality: 'Holanda',
    position: 'Zagueiro',
    ovr: 92,
    price: 1410,
    photo: '',
    section: 'Veteranos',
  },
  {
    id: '5',
    name: 'Luka Modrić',
    nationality: 'Croácia',
    position: 'Meia',
    ovr: 91,
    price: 1370,
    photo: '',
    section: 'Veteranos',
  },
  {
    id: '6',
    name: 'Thibaut Courtois',
    nationality: 'Bélgica',
    position: 'Goleiro',
    ovr: 90,
    price: 1290,
    photo: '',
    section: 'Destaques da Copa',
  },
];

const NATION_FLAGS = {
  Brasil: '🇧🇷',
  Argentina: '🇦🇷',
  Espanha: '🇪🇸',
  França: '🇫🇷',
  Alemanha: '🇩🇪',
  Portugal: '🇵🇹',
  Holanda: '🇳🇱',
  Croácia: '🇭🇷',
  Bélgica: '🇧🇪',
};

function initMarket() {
  ensureAuth();
  renderNavbar('market');
  bindFilters();
  loadSections();
  loadPlayers();
  updateHeroSummary();
}

function bindFilters() {
  const query = document.getElementById('filter-query');
  const nation = document.getElementById('filter-nation');
  const position = document.getElementById('filter-position');
  const ovrMin = document.getElementById('filter-ovr-min');
  const ovrMax = document.getElementById('filter-ovr-max');
  const priceMin = document.getElementById('filter-price-min');
  const priceMax = document.getElementById('filter-price-max');
  const clear = document.getElementById('btn-clear-filters');

  const search = debounce(() => {
    loadPlayers();
  }, 250);

  query.addEventListener('input', (event) => {
    MARKET_STATE.filters.query = event.target.value;
    search();
  });

  nation.addEventListener('change', (event) => {
    MARKET_STATE.filters.nation = event.target.value;
    loadPlayers();
  });

  position.addEventListener('change', (event) => {
    MARKET_STATE.filters.position = event.target.value;
    loadPlayers();
  });

  ovrMin.addEventListener('change', (event) => {
    MARKET_STATE.filters.ovrMin = Number(event.target.value);
    loadPlayers();
  });

  ovrMax.addEventListener('change', (event) => {
    MARKET_STATE.filters.ovrMax = Number(event.target.value);
    loadPlayers();
  });

  if (priceMin && priceMax) {
    priceMin.addEventListener('change', (event) => {
      MARKET_STATE.filters.priceMin = Number(event.target.value || 0);
      loadPlayers();
    });

    priceMax.addEventListener('change', (event) => {
      MARKET_STATE.filters.priceMax = Number(event.target.value || 0);
      loadPlayers();
    });
  }

  clear.addEventListener('click', () => {
    MARKET_STATE.filters = {
      section: '',
      nation: '',
      position: '',
      ovrMin: 70,
      ovrMax: 99,
      priceMin: 0,
      priceMax: 999999,
      query: '',
    };

    query.value = '';
    nation.value = '';
    position.value = '';
    ovrMin.value = 70;
    ovrMax.value = 99;
    if (priceMin) priceMin.value = 0;
    if (priceMax) priceMax.value = 999999;
    loadPlayers();
    updateHeroSummary();
  });
}

async function loadSections() {
  try {
    const data = await api.getSections();
    const sections = Array.isArray(data) ? data : data.sections || [];
    MARKET_STATE.sections = sections.length ? sections : FALLBACK_SECTIONS;
  } catch {
    MARKET_STATE.sections = FALLBACK_SECTIONS;
  }

  renderSectionTabs();
  updateHeroSummary();
}

function renderSectionTabs() {
  const container = document.getElementById('section-tabs');
  if (!container) return; // section chips removed by layout — nothing to render
  container.innerHTML = '';
  // if container exists, render only custom sections (exclude the default unwanted sections)
  const tabs = MARKET_STATE.sections.filter(s => !['Estrelas', 'Destaques da Copa', 'Veteranos', 'Todos'].includes(s));
  tabs.forEach((section) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `chip ${MARKET_STATE.filters.section === section ? 'chip--active' : ''}`;
    button.textContent = section;
    button.addEventListener('click', () => {
      MARKET_STATE.filters.section = section === 'Todos' ? '' : section;
      renderSectionTabs();
      loadPlayers();
    });
    container.appendChild(button);
  });
}

function buildFilterParams() {
  const filters = { ...MARKET_STATE.filters };
  const params = {
    section: filters.section || undefined,
    nation: filters.nation || undefined,
    position: filters.position || undefined,
    ovrMin: filters.ovrMin || undefined,
    ovrMax: filters.ovrMax || undefined,
    priceMin: filters.priceMin || undefined,
    priceMax: filters.priceMax || undefined,
    q: filters.query || undefined,
  };

  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== ''));
}

async function loadPlayers() {
  const params = buildFilterParams();

  try {
    const data = await api.getMarket(params);
    MARKET_STATE.players = Array.isArray(data) ? data : data.players || [];

    if (!MARKET_STATE.players.length) {
      MARKET_STATE.players = FALLBACK_PLAYERS.filter((player) => filterPlayer(player));
    }
  } catch {
    MARKET_STATE.players = FALLBACK_PLAYERS.filter((player) => filterPlayer(player));
  }

  renderPlayers();
  updateHeroSummary();
  populateNationOptions();
}

function filterPlayer(player) {
  const filters = MARKET_STATE.filters;
  const normalizedName = player.name?.toLowerCase() || '';
  const normalizedNation = player.nationality?.toLowerCase() || '';
  const normalizedQuery = filters.query?.toLowerCase() || '';
  const ovr = Number(player.ovr ?? player.rating ?? player.overall ?? 0);
  const price = Number(player.price ?? player.value ?? player.cost ?? 0);

  if (filters.section && (player.section || '').toLowerCase() !== filters.section.toLowerCase()) {
    return false;
  }

  if (filters.nation && normalizedNation !== filters.nation.toLowerCase()) {
    return false;
  }

  if (filters.position && (player.position || '').toLowerCase() !== filters.position.toLowerCase()) {
    return false;
  }

  if (ovr < filters.ovrMin || ovr > filters.ovrMax) {
    return false;
  }

  if (price < (filters.priceMin ?? 0) || price > (filters.priceMax ?? 999999)) {
    return false;
  }

  if (filters.query && !`${normalizedName} ${normalizedNation}`.includes(normalizedQuery)) {
    return false;
  }

  return true;
}

function renderPlayers() {
  const grid = document.getElementById('player-grid');
  grid.innerHTML = '';

  if (!MARKET_STATE.players.length) {
    grid.innerHTML = '<div class="no-results">Nenhum jogador encontrado. Ajuste os filtros ou limpe a pesquisa.</div>';
    return;
  }

  MARKET_STATE.players.forEach((player) => {
    const item = document.createElement('article');
    item.className = 'player-card';
    item.innerHTML = `
      <div class="player-card__header">
        <span class="player-card__rating">${escapeHtml(String(player.ovr ?? player.rating ?? player.overall ?? '-'))}</span>
      </div>
      <div class="player-card__photo">
        ${renderPlayerImage(player)}
      </div>
      <div class="player-card__info">
        <div class="player-card__name">${escapeHtml(player.name || 'Jogador')}</div>
        <div class="player-card__meta">
          <span class="player-card__flag">${getFlag(player.nationality)} ${escapeHtml(player.nationality || 'Seleção')}</span>
          <span>${escapeHtml(player.position || 'Posição')}</span>
        </div>
        <div class="player-card__price">⚽ ${formatCoins(player.price ?? player.value ?? player.cost ?? 0)}</div>
        <button class="btn btn-buy" type="button" onclick="buyPlayer('${escapeHtml(player.id || '')}')">Comprar</button>
      </div>
    `;

    grid.appendChild(item);
  });
}

function renderPlayerImage(player) {
  const photo = player.photo || player.image || '';
  const initials = collectInitials(player.name || 'JD');

  if (photo) {
    return `<img src="${escapeHtml(photo)}" alt="Foto de ${escapeHtml(player.name)}" loading="lazy" onerror="this.style.display='none'" />`;
  }

  return `<div class="player-card__fallback">${escapeHtml(initials)}</div>`;
}

function populateNationOptions() {
  const select = document.getElementById('filter-nation');
  select.innerHTML = '<option value="">Todas</option>';
  const nations = new Set([...(MARKET_STATE.players || []).map((player) => player.nationality).filter(Boolean)]);

  nations.forEach((nation) => {
    const option = document.createElement('option');
    option.value = nation;
    option.textContent = nation;
    select.appendChild(option);
  });
}

function updateHeroSummary() {
  const user = getSession().user;
  const coins = user?.coins ?? 0;
  const headerCoins = document.getElementById('header-coins');
  if (headerCoins) {
  headerCoins.innerHTML = `⚽ ${formatCoins(coins)}`;
}
  document.getElementById('hero-count').textContent = String(MARKET_STATE.players.length || 0);
  document.getElementById('hero-sections').textContent = String(MARKET_STATE.sections.length || FALLBACK_SECTIONS.length);

  const activeFilters = [];
  if (MARKET_STATE.filters.section) activeFilters.push(MARKET_STATE.filters.section);
  if (MARKET_STATE.filters.nation) activeFilters.push(MARKET_STATE.filters.nation);
  if (MARKET_STATE.filters.position) activeFilters.push(MARKET_STATE.filters.position);
  if (MARKET_STATE.filters.query) activeFilters.push('Busca ativa');

  document.getElementById('hero-filters').textContent = activeFilters.length ? activeFilters.join(' · ') : 'Nenhum';
}

async function buyPlayer(playerId) {
  if (!playerId) return;

  try {
    await api.buyPlayer(playerId);
    notify.success('Jogador comprado com sucesso!', 'Transação concluída');

    const player = MARKET_STATE.players.find((item) => String(item.id) === String(playerId));
    const playerPrice = Number(player?.price ?? player?.value ?? player?.cost ?? 0);
    const session = getSession();

    if (session.user) {
      const nextCoins = Math.max(0, (session.user.coins ?? 0) - playerPrice);
      setUserCoins(nextCoins);
      const headerCoinsEl = document.getElementById('header-coins');
      if (headerCoinsEl) {
        headerCoinsEl.innerHTML = `⚽ ${formatCoins(nextCoins)}`;
      }
    }

    loadPlayers();
  } catch (error) {
    notify.error(error.message || 'Não foi possível completar a compra.');
  }
}

function formatCoins(number) {
  return Number(number).toLocaleString('pt-BR');
}

function collectInitials(name) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function getFlag(nationality) {
  return NATION_FLAGS[nationality] || '🏳️';
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function debounce(fn, wait = 200) {
  let timeout;
  return (...args) => {
    window.clearTimeout(timeout);
    timeout = window.setTimeout(() => fn(...args), wait);
  };
}

window.initMarket = initMarket;
window.buyPlayer = buyPlayer;

