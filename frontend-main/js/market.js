/* Mercado da Bola */

const MARKET_STATE = {
  filters: {
    section: '',
    nation: '',
    position: '',
    ovrMin: 60,
    ovrMax: 99,
    priceMin: 0,
    priceMax: 999999,
    query: '',
  },
  catalog: [],
  catalogLoaded: false,
  sections: [],
  players: [],
  pagination: {
    page: 1,
    pageSize: 26,
  },
  cart: {
    items: [],
    total: 0,
    coins: 0,
  },
  ownedPlayerIds: new Set(),
};

const FALLBACK_SECTIONS = ['Estrelas', 'Destaques da Copa', 'Veteranos'];
const FALLBACK_PLAYERS = [
  {
    id: '1',
    name: 'Lionel Messi',
    nationality: 'Argentina',
    position: 'Meia',
    ovr: 97,
    price: 15000,
    photo: '',
    section: 'Estrelas',
  },
  {
    id: '2',
    name: 'Neymar Jr.',
    nationality: 'Brasil',
    position: 'Atacante',
    ovr: 94,
    price: 15000,
    photo: '',
    section: 'Destaques da Copa',
  },
  {
    id: '3',
    name: 'Kylian Mbappé',
    nationality: 'França',
    position: 'Atacante',
    ovr: 96,
    price: 15000,
    photo: '',
    section: 'Estrelas',
  },
  {
    id: '4',
    name: 'Virgil van Dijk',
    nationality: 'Holanda',
    position: 'Zagueiro',
    ovr: 92,
    price: 15000,
    photo: '',
    section: 'Veteranos',
  },
  {
    id: '5',
    name: 'Luka Modrić',
    nationality: 'Croácia',
    position: 'Meia',
    ovr: 91,
    price: 15000,
    photo: '',
    section: 'Veteranos',
  },
  {
    id: '6',
    name: 'Thibaut Courtois',
    nationality: 'Bélgica',
    position: 'Goleiro',
    ovr: 90,
    price: 15000,
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

async function initMarket() {
  ensureAuth();
  renderNavbar('market');
  bindFilters();
  bindFilterToggle();
  bindPagination();
  bindCartControls();
  await Promise.all([loadSections(), loadCart(), loadOwnedPlayers()]);
  await loadPlayers();
  updateHeroSummary();
}

function bindCartControls() {
  const focusButton = document.getElementById('btn-cart-focus');
  const closeButton = document.getElementById('btn-close-cart');
  const cartPanel = document.getElementById('cart-panel');
  const clearButton = document.getElementById('btn-clear-cart');
  const checkoutButton = document.getElementById('btn-checkout');

  const setCartOpen = (isOpen) => {
    if (!cartPanel || !focusButton) return;
    cartPanel.setAttribute('aria-hidden', String(!isOpen));
    focusButton.setAttribute('aria-expanded', String(isOpen));
  };

  focusButton?.addEventListener('click', () => {
    const isOpen = cartPanel?.getAttribute('aria-hidden') !== 'true';
    setCartOpen(!isOpen);
  });
  closeButton?.addEventListener('click', () => setCartOpen(false));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setCartOpen(false);
  });
  clearButton?.addEventListener('click', clearCart);
  checkoutButton?.addEventListener('click', checkoutCart);
}

async function loadCart() {
  const session = getSession();
  const userId = Number(session.user?.id);
  if (!userId || !session.token?.startsWith('user:')) {
    MARKET_STATE.cart.coins = Number(session.user?.coins || 0);
    renderCart();
    return;
  }

  try {
    const data = await api.getCart(userId);
    if (data) applyCartState(data);
  } catch (error) {
    notify.error(error.message || 'Não foi possível carregar o carrinho.');
    renderCart();
  }
}

async function loadOwnedPlayers() {
  const session = getSession();
  const userId = Number(session.user?.id);
  if (!userId || !session.token?.startsWith('user:')) {
    MARKET_STATE.ownedPlayerIds = new Set();
    return;
  }

  try {
    const players = await api.getSquad();
    MARKET_STATE.ownedPlayerIds = new Set(
      (Array.isArray(players) ? players : []).map((player) => String(player.id)),
    );
  } catch {
    MARKET_STATE.ownedPlayerIds = new Set();
  }
}

function applyCartState(data) {
  MARKET_STATE.cart = {
    items: Array.isArray(data.items) ? data.items : [],
    total: Number(data.total || 0),
    coins: Number(data.coins || 0),
  };
  setUserCoins(MARKET_STATE.cart.coins);
  renderCart();
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
    resetMarketPage();
    search();
  });

  nation.addEventListener('change', (event) => {
    MARKET_STATE.filters.nation = event.target.value;
    resetMarketPage();
    loadPlayers();
  });

  position.addEventListener('change', (event) => {
    MARKET_STATE.filters.position = event.target.value;
    resetMarketPage();
    loadPlayers();
  });

  ovrMin.addEventListener('change', (event) => {
    MARKET_STATE.filters.ovrMin = Number(event.target.value);
    resetMarketPage();
    loadPlayers();
  });

  ovrMax.addEventListener('change', (event) => {
    MARKET_STATE.filters.ovrMax = Number(event.target.value);
    resetMarketPage();
    loadPlayers();
  });

  if (priceMin && priceMax) {
    priceMin.addEventListener('change', (event) => {
      MARKET_STATE.filters.priceMin = Number(event.target.value || 0);
      resetMarketPage();
      loadPlayers();
    });

    priceMax.addEventListener('change', (event) => {
      MARKET_STATE.filters.priceMax = Number(event.target.value || 0);
      resetMarketPage();
      loadPlayers();
    });
  }

  clear.addEventListener('click', () => {
    MARKET_STATE.filters = {
      section: '',
      nation: '',
      position: '',
      ovrMin: 60,
      ovrMax: 99,
      priceMin: 0,
      priceMax: 999999,
      query: '',
    };

    query.value = '';
    nation.value = '';
    position.value = '';
    ovrMin.value = 60;
    ovrMax.value = 99;
    if (priceMin) priceMin.value = 0;
    if (priceMax) priceMax.value = 999999;
    resetMarketPage();
    loadPlayers();
    updateHeroSummary();
  });
}

function bindFilterToggle() {
  const toggle = document.getElementById('btn-toggle-filters');
  const fields = document.getElementById('filter-fields');
  if (!toggle || !fields) return;

  toggle.addEventListener('click', () => {
    const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
    const nextExpanded = !isExpanded;
    toggle.setAttribute('aria-expanded', String(nextExpanded));
    fields.setAttribute('aria-hidden', String(!nextExpanded));
    fields.classList.toggle('filter-card__body--collapsed', !nextExpanded);
    fields.inert = !nextExpanded;

    const label = toggle.querySelector('.filter-card__toggle-label');
    const icon = toggle.querySelector('.filter-card__toggle-icon');
    if (label) label.textContent = nextExpanded ? 'Ocultar filtros' : 'Mostrar filtros';
    if (icon) icon.textContent = nextExpanded ? '⌃' : '⌄';
  });
}

function bindPagination() {
  const previous = document.getElementById('pagination-previous');
  const next = document.getElementById('pagination-next');
  if (!previous || !next) return;

  previous.addEventListener('click', () => {
    if (MARKET_STATE.pagination.page <= 1) return;
    MARKET_STATE.pagination.page -= 1;
    renderPlayers();
  });

  next.addEventListener('click', () => {
    if (MARKET_STATE.pagination.page >= getPageCount()) return;
    MARKET_STATE.pagination.page += 1;
    renderPlayers();
  });
}

function resetMarketPage() {
  MARKET_STATE.pagination.page = 1;
}

function getPageCount() {
  return Math.max(1, Math.ceil(MARKET_STATE.players.length / MARKET_STATE.pagination.pageSize));
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
      resetMarketPage();
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
    q: String(filters.query || '').trim() || undefined,
  };

  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== ''));
}

async function loadPlayers() {
  try {
    if (!MARKET_STATE.catalogLoaded) {
      const data = await api.getMarket({});
      MARKET_STATE.catalog = Array.isArray(data) ? data : data.players || [];
      MARKET_STATE.catalogLoaded = true;
    }
    MARKET_STATE.players = MARKET_STATE.catalog.filter((player) => filterPlayer(player));
  } catch (error) {
    MARKET_STATE.catalog = [];
    MARKET_STATE.players = [];
    MARKET_STATE.catalogLoaded = false;
    notify.error(error.message || 'Não foi possível carregar os jogadores do mercado.');
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
  if (!grid) return;
  grid.innerHTML = '';

  const pageCount = getPageCount();
  MARKET_STATE.pagination.page = Math.min(MARKET_STATE.pagination.page, pageCount);
  const pageStart = (MARKET_STATE.pagination.page - 1) * MARKET_STATE.pagination.pageSize;
  const pagePlayers = MARKET_STATE.players.slice(pageStart, pageStart + MARKET_STATE.pagination.pageSize);

  if (!MARKET_STATE.players.length) {
    grid.innerHTML = '<div class="no-results">Nenhum jogador encontrado. Ajuste os filtros ou limpe a pesquisa.</div>';
    renderPagination(0);
    return;
  }

  pagePlayers.forEach((player) => {
    const playerId = String(player.id || '');
    const isOwned = MARKET_STATE.ownedPlayerIds.has(playerId);
    const isInCart = MARKET_STATE.cart.items.some((item) => String(item.id) === playerId);
    const buttonLabel = isOwned ? 'Já adquirido' : isInCart ? 'No carrinho' : 'Adicionar ao carrinho';
    const buttonClass = isOwned ? 'btn-buy--owned' : isInCart ? 'btn-buy--added' : '';
    const buttonDisabled = isOwned || isInCart ? 'disabled' : '';
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
        <div class="player-card__name">${escapeHtml(formatPlayerName(player.name || 'Jogador'))}</div>
        <div class="player-card__meta">
          <span class="player-card__flag">${getFlag(player.country_code || player.nationality)} ${escapeHtml(translateNationality(player.nationality || 'Seleção'))}</span>
          <span>${escapeHtml(formatPosition(player.position || 'Posição'))}</span>
        </div>
        <div class="player-card__price">⚽ ${formatCoins(player.price ?? player.value ?? player.cost ?? 0)}</div>
        <button class="btn btn-buy ${buttonClass}" type="button" ${buttonDisabled} onclick="addPlayerToCart('${escapeHtml(playerId)}')">${buttonLabel}</button>
      </div>
    `;

    grid.appendChild(item);
  });

  renderPagination(pageCount);
}

function renderPagination(pageCount) {
  const pagination = document.getElementById('market-pagination');
  const previous = document.getElementById('pagination-previous');
  const next = document.getElementById('pagination-next');
  const status = document.getElementById('pagination-status');
  if (!pagination || !previous || !next || !status) return;

  const hasResults = MARKET_STATE.players.length > 0;
  pagination.hidden = !hasResults;
  if (!hasResults) return;

  status.textContent = `P\u00e1gina ${MARKET_STATE.pagination.page} de ${pageCount}`;
  previous.disabled = MARKET_STATE.pagination.page <= 1;
  next.disabled = MARKET_STATE.pagination.page >= pageCount;
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
  if (!select) return;
  const selectedNation = MARKET_STATE.filters.nation;
  select.innerHTML = '<option value="">Todas</option>';
  const nations = [...new Set(
    (MARKET_STATE.catalog || []).map((player) => player.nationality).filter(Boolean),
  )].sort((a, b) => String(a).localeCompare(String(b), 'pt-BR'));

  nations.forEach((nation) => {
    const option = document.createElement('option');
    option.value = nation;
    option.textContent = nation;
    select.appendChild(option);
  });

  select.value = selectedNation;
}

function updateHeroSummary() {
  const user = getSession().user;
  const coins = user?.coins ?? 0;
  const headerCoins = document.getElementById('header-coins');
  if (headerCoins) {
    headerCoins.innerHTML = `⚽ ${formatCoins(coins)}`;
  }
  const heroCount = document.getElementById('hero-count');
  const heroSections = document.getElementById('hero-sections');
  if (heroCount) heroCount.textContent = String(MARKET_STATE.players.length || 0);
  if (heroSections) heroSections.textContent = String(MARKET_STATE.sections.length || FALLBACK_SECTIONS.length);

  const activeFilters = [];
  if (MARKET_STATE.filters.section) activeFilters.push(MARKET_STATE.filters.section);
  if (MARKET_STATE.filters.nation) activeFilters.push(MARKET_STATE.filters.nation);
  if (MARKET_STATE.filters.position) activeFilters.push(MARKET_STATE.filters.position);
  if (MARKET_STATE.filters.query) activeFilters.push('Busca ativa');

  const heroFilters = document.getElementById('hero-filters');
  if (heroFilters) heroFilters.textContent = activeFilters.length ? activeFilters.join(' · ') : 'Nenhum';
}

function renderCart() {
  const container = document.getElementById('cart-items');
  const count = document.getElementById('cart-count');
  const total = document.getElementById('cart-total');
  const balance = document.getElementById('cart-balance');
  const clearButton = document.getElementById('btn-clear-cart');
  const checkoutButton = document.getElementById('btn-checkout');
  if (!container) return;

  const items = MARKET_STATE.cart.items;
  if (count) count.textContent = String(items.length);
  if (total) total.textContent = `⚽ ${formatCoins(MARKET_STATE.cart.total)}`;
  if (balance) balance.textContent = `⚽ ${formatCoins(MARKET_STATE.cart.coins)}`;
  if (clearButton) clearButton.disabled = items.length === 0;
  if (checkoutButton) checkoutButton.disabled = items.length === 0;

  if (!items.length) {
    container.innerHTML = '<p class="cart-panel__empty">Seu carrinho está vazio. Adicione jogadores do mercado para começar.</p>';
    return;
  }

  container.innerHTML = items.map((player) => `
    <div class="cart-item">
      <div class="cart-item__identity">
        ${renderCartImage(player)}
        <div class="cart-item__copy">
          <div class="cart-item__name">${escapeHtml(formatPlayerName(player.name || 'Jogador'))}</div>
          <div class="cart-item__price">⚽ ${formatCoins(player.price || 0)}</div>
        </div>
      </div>
      <button class="cart-item__remove" type="button" aria-label="Remover ${escapeHtml(player.name || 'jogador')} do carrinho" onclick="removePlayerFromCart('${escapeHtml(player.id)}')">×</button>
    </div>
  `).join('');
}

function renderCartImage(player) {
  const photo = player.photo || player.photo_url || player.image || '';
  if (photo) {
    return `<img class="cart-item__photo" src="${escapeHtml(photo)}" alt="" loading="lazy" onerror="this.style.display='none'" />`;
  }
  return `<div class="cart-item__fallback" aria-hidden="true">${escapeHtml(collectInitials(player.name || 'JD'))}</div>`;
}

async function addPlayerToCart(playerId) {
  if (!playerId) return;

  const session = getSession();
  const userId = Number(session.user?.id);
  if (!userId || !session.token?.startsWith('user:')) {
    notify.info('Entre com sua conta para usar o carrinho.');
    return;
  }

  try {
    const cart = await api.addCartItem({ user_id: userId, player_id: Number(playerId) });
    applyCartState(cart);
    renderPlayers();
    notify.success('Jogador adicionado ao carrinho.');
  } catch (error) {
    notify.error(error.message || 'Não foi possível adicionar o jogador.');
  }
}

async function removePlayerFromCart(playerId) {
  const userId = Number(getSession().user?.id);
  if (!userId || !playerId) return;

  try {
    const cart = await api.removeCartItem({ user_id: userId, player_id: Number(playerId) });
    applyCartState(cart);
    renderPlayers();
  } catch (error) {
    notify.error(error.message || 'Não foi possível remover o jogador.');
  }
}

async function clearCart() {
  const userId = Number(getSession().user?.id);
  if (!userId || !MARKET_STATE.cart.items.length) return;

  try {
    const cart = await api.clearCart(userId);
    applyCartState(cart);
    renderPlayers();
  } catch (error) {
    notify.error(error.message || 'Não foi possível limpar o carrinho.');
  }
}

async function checkoutCart() {
  const userId = Number(getSession().user?.id);
  if (!userId || !MARKET_STATE.cart.items.length) return;

  try {
    const result = await api.checkoutCart({ user_id: userId });
    result.player_ids.forEach((playerId) => MARKET_STATE.ownedPlayerIds.add(String(playerId)));
    MARKET_STATE.cart = { items: [], total: 0, coins: Number(result.coins) };
    setUserCoins(result.coins);
    renderCart();
    renderPlayers();
    updateHeroSummary();
    notify.success(`Compra finalizada por ⚽ ${formatCoins(result.total)}.`, 'Elenco atualizado');
  } catch (error) {
    notify.error(error.message || 'Não foi possível finalizar a compra.');
  }
}

function buyPlayer(playerId) {
  return addPlayerToCart(playerId);
}

function formatCoins(number) {
  return Number(number).toLocaleString('pt-BR');
}

function formatPlayerName(name) {
  return String(name)
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

const NATIONALITY_TRANSLATIONS = {
  Brazil: 'Brasil',
  Argentina: 'Argentina',
  France: 'França',
  Germany: 'Alemanha',
  Belgium: 'Bélgica',
  England: 'Inglaterra',
  Spain: 'Espanha',
  Portugal: 'Portugal',
  Netherlands: 'Holanda',
  Holland: 'Holanda',
  'United States': 'Estados Unidos',
  'South Korea': 'Coreia do Sul',
  Japan: 'Japão',
  Norway: 'Noruega',
  Sweden: 'Suécia',
  Switzerland: 'Suíça',
  Turkey: 'Turquia',
  Morocco: 'Marrocos',
  Uruguay: 'Uruguai',
  Ecuador: 'Equador',
  Egypt: 'Egito',
};

function translateNationality(nationality) {
  const value = String(nationality || '').trim();
  return NATIONALITY_TRANSLATIONS[value] || value;
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
  const code = getCountryCode(nationality);
  if (!code) return '<span class="player-card__flag-fallback" aria-hidden="true">--</span>';
  return `<img class="player-card__flag-icon" src="https://flagcdn.com/24x18/${code.toLowerCase()}.png" alt="" width="24" height="18" loading="lazy" onerror="this.hidden = true" />`;
}

const NATIONALITY_CODES = {
  brazil: 'BR',
  brasil: 'BR',
  argentina: 'AR',
  france: 'FR',
  'frança': 'FR',
  germany: 'DE',
  alemanha: 'DE',
  belgium: 'BE',
  'bélgica': 'BE',
  england: 'GB',
  inglaterra: 'GB',
  spain: 'ES',
  espanha: 'ES',
  portugal: 'PT',
  netherlands: 'NL',
  holland: 'NL',
  holanda: 'NL',
  'united states': 'US',
  'estados unidos': 'US',
  'south korea': 'KR',
  'coreia do sul': 'KR',
  japan: 'JP',
  'japão': 'JP',
  croatia: 'HR',
  'croácia': 'HR',
  norway: 'NO',
  noruega: 'NO',
  sweden: 'SE',
  'suécia': 'SE',
  switzerland: 'CH',
  'suíça': 'CH',
  turkey: 'TR',
  turquia: 'TR',
  morocco: 'MA',
  marrocos: 'MA',
  uruguay: 'UY',
  uruguai: 'UY',
  ecuador: 'EC',
  equador: 'EC',
  egypt: 'EG',
  egito: 'EG',
};

function getCountryCode(nationality) {
  const value = String(nationality || '').trim();
  if (/^[a-z]{2}$/i.test(value)) return value.toUpperCase();
  return NATIONALITY_CODES[value.toLowerCase()] || null;
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
window.addPlayerToCart = addPlayerToCart;
window.removePlayerFromCart = removePlayerFromCart;
