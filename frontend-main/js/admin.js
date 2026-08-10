/* =============================================
   admin.js — dashboard e lista de usuários
   ============================================= */

const ADMIN_STATE = {
  selectedMonth: '',
  dashboard: null,
  users: [],
  usingFallback: false,
  currentPage: 1,
  pageSize: 10,
};

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function initAdmin() {
  configureAdminProfile();
  populateMonthFilter();
  bindAdminEvents();
  loadAdminData();
}

function configureAdminProfile() {
  const user = getSession().user;
  const avatar = document.getElementById('admin-avatar');
  const avatarUrl = user?.avatar || user?.photo || user?.image;

  if (avatarUrl) {
    avatar.src = avatarUrl;
    avatar.parentElement.classList.remove('admin-profile--card');
  }
  avatar.alt = user?.displayName || user?.username
    ? `Avatar de ${user.displayName || user.username}`
    : 'Avatar do administrador';
}

function bindAdminEvents() {
  document.getElementById('admin-logout').addEventListener('click', logout);
  document.getElementById('month-filter').addEventListener('change', (event) => {
    ADMIN_STATE.selectedMonth = event.target.value;
    ADMIN_STATE.currentPage = 1;
    loadAdminData();
  });

  document.getElementById('users-pagination').addEventListener('click', (event) => {
    const button = event.target.closest('[data-page]');
    if (!button || button.disabled) return;

    ADMIN_STATE.currentPage = Number(button.dataset.page);
    renderUsers();
    document.getElementById('users-heading').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

/* O mês atual não aparece porque seus dados ainda estão incompletos. */
function populateMonthFilter(availableMonths = []) {
  const select = document.getElementById('month-filter');
  const completeMonths = getCompleteMonths(12);
  const validApiMonths = availableMonths.filter(isCompleteMonth);
  const months = validApiMonths.length ? validApiMonths : completeMonths;

  const uniqueMonths = [...new Set(months)].sort((a, b) => b.localeCompare(a));
  const previousSelection = ADMIN_STATE.selectedMonth;

  select.innerHTML = uniqueMonths
    .map((month) => `<option value="${month}">${formatMonthLabel(month)}</option>`)
    .join('');

  ADMIN_STATE.selectedMonth = uniqueMonths.includes(previousSelection)
    ? previousSelection
    : uniqueMonths[0];
  select.value = ADMIN_STATE.selectedMonth;
}

function getCompleteMonths(amount) {
  const currentMonth = new Date();
  currentMonth.setDate(1);

  return Array.from({ length: amount }, (_, index) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - index - 1, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  });
}

function isCompleteMonth(month) {
  if (!/^\d{4}-\d{2}$/.test(month)) return false;
  const [year, monthNumber] = month.split('-').map(Number);
  const candidate = new Date(year, monthNumber - 1, 1);
  const current = new Date();
  const currentMonth = new Date(current.getFullYear(), current.getMonth(), 1);
  return candidate < currentMonth;
}

async function loadAdminData() {
  setAdminLoading(true);
  const params = { month: ADMIN_STATE.selectedMonth };
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);

  const [dashboardResult, usersResult] = await Promise.allSettled([
    api.getAdminDashboard(params, { signal: controller.signal, skipAuthRedirect: true }),
    api.getAdminUsers(params, { signal: controller.signal, skipAuthRedirect: true }),
  ]);
  window.clearTimeout(timeout);

  const accessDenied = [dashboardResult, usersResult]
    .some((result) => result.status === 'rejected' && result.reason?.status === 403);

  if (accessDenied) {
    window.location.href = 'market.html';
    return;
  }

  const dashboardData = dashboardResult.status === 'fulfilled' ? dashboardResult.value : null;
  const usersData = usersResult.status === 'fulfilled' ? usersResult.value : null;
  const fallback = getAdminFallback(ADMIN_STATE.selectedMonth);

  ADMIN_STATE.dashboard = dashboardData ? normalizeDashboard(dashboardData) : fallback.dashboard;
  ADMIN_STATE.users = usersData
    ? normalizeUsers(usersData)
    : normalizeUsers(dashboardData?.users || fallback.users);
  ADMIN_STATE.usingFallback = !dashboardData || !usersData;
  ADMIN_STATE.currentPage = 1;

  const availableMonths = dashboardData?.availableMonths
    || dashboardData?.available_months
    || usersData?.availableMonths
    || usersData?.available_months
    || [];

  if (availableMonths.length) populateMonthFilter(availableMonths);

  renderDashboard();
  renderUsers();
  setAdminLoading(false);
}

function normalizeDashboard(data) {
  const metrics = data.metrics || data.dashboard || data;
  const activeSeries = metrics.monthlyActiveUsers
    || metrics.monthly_active_users
    || metrics.activeUsers
    || metrics.active_users
    || [];
  const createdSeries = metrics.usersCreated
    || metrics.users_created
    || metrics.createdUsers
    || metrics.created_users
    || metrics.userRegistrations
    || [];

  return {
    activeUsers: normalizeSeries(activeSeries),
    createdUsers: normalizeSeries(createdSeries),
    activeTotal: Number(metrics.activeUsersTotal ?? metrics.active_users_total ?? data.activeUsersTotal),
    createdTotal: Number(metrics.createdUsersTotal ?? metrics.created_users_total ?? data.createdUsersTotal),
  };
}

function normalizeSeries(series) {
  if (!Array.isArray(series)) return [];

  return series.map((item, index) => {
    if (typeof item === 'number') return { label: String(index + 1), value: item };

    return {
      label: item.label || item.date || item.day || item.month || String(index + 1),
      value: Number(item.value ?? item.count ?? item.total ?? 0),
    };
  });
}

function normalizeUsers(data) {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.users) ? data.users : [];
}

function renderDashboard() {
  const dashboard = ADMIN_STATE.dashboard;
  const activeTotal = Number.isFinite(dashboard.activeTotal)
    ? dashboard.activeTotal
    : getSeriesTotal(dashboard.activeUsers, 'maximum');
  const createdTotal = Number.isFinite(dashboard.createdTotal)
    ? dashboard.createdTotal
    : getSeriesTotal(dashboard.createdUsers, 'sum');

  document.getElementById('active-users-total').textContent = formatNumber(activeTotal);
  document.getElementById('created-users-total').textContent = formatNumber(createdTotal);

  renderAreaChart('active-users-chart', dashboard.activeUsers, 'Usuários ativos');
  renderAreaChart('created-users-chart', dashboard.createdUsers, 'Usuários criados');
}

function renderAreaChart(containerId, series, accessibleName) {
  const container = document.getElementById(containerId);

  if (!series.length) {
    container.innerHTML = '<p class="chart-empty">Não há dados para este período.</p>';
    return;
  }

  const width = 620;
  const height = 280;
  const padding = { top: 24, right: 18, bottom: 38, left: 38 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(...series.map((item) => item.value), 1);
  const stepX = series.length > 1 ? chartWidth / (series.length - 1) : 0;

  const points = series.map((item, index) => ({
    ...item,
    x: padding.left + (stepX * index),
    y: padding.top + chartHeight - ((item.value / maxValue) * chartHeight),
  }));

  const linePath = points
    .map((point, index) => `${index ? 'L' : 'M'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');
  const areaPath = `${linePath} L ${points.at(-1).x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;
  const labelIndexes = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])];

  const gridLines = [0.25, 0.5, 0.75, 1]
    .map((ratio) => {
      const y = padding.top + chartHeight - (chartHeight * ratio);
      return `<line class="chart-grid-line" x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" />`;
    })
    .join('');

  const labels = labelIndexes
    .map((index) => `<text class="chart-label" x="${points[index].x}" y="${height - 10}" text-anchor="middle">${escapeAdminHtml(formatChartLabel(points[index].label))}</text>`)
    .join('');

  const circles = points
    .map((point) => `<circle class="chart-point" cx="${point.x}" cy="${point.y}" r="4"><title>${escapeAdminHtml(point.label)}: ${point.value}</title></circle>`)
    .join('');

  container.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${accessibleName}">
      ${gridLines}
      <path class="chart-area" d="${areaPath}" />
      <path class="chart-line" d="${linePath}" />
      ${circles}
      ${labels}
    </svg>
  `;
}

function renderUsers() {
  const tbody = document.getElementById('users-table-body');
  const empty = document.getElementById('users-empty');
  const summary = document.getElementById('users-summary');
  const badge = document.getElementById('data-source-badge');
  const totalPages = Math.ceil(ADMIN_STATE.users.length / ADMIN_STATE.pageSize);

  ADMIN_STATE.currentPage = Math.min(Math.max(ADMIN_STATE.currentPage, 1), totalPages || 1);
  const firstUserIndex = (ADMIN_STATE.currentPage - 1) * ADMIN_STATE.pageSize;
  const visibleUsers = ADMIN_STATE.users.slice(firstUserIndex, firstUserIndex + ADMIN_STATE.pageSize);

  tbody.innerHTML = '';
  empty.hidden = ADMIN_STATE.users.length > 0;
  badge.hidden = !ADMIN_STATE.usingFallback;
  summary.textContent = `${ADMIN_STATE.users.length} ${ADMIN_STATE.users.length === 1 ? 'usuário encontrado' : 'usuários encontrados'} em ${formatMonthLabel(ADMIN_STATE.selectedMonth)}`;

  visibleUsers.forEach((user) => {
    const row = document.createElement('tr');
    const name = user.displayName || user.display_name || user.name || user.username || 'Usuário';
    const username = user.username || user.login || '';
    const avatar = user.avatar || user.photo || user.image || '';
    const initials = collectAdminInitials(name);
    const createdAt = user.createdAt || user.created_at || user.registeredAt || user.registered_at;
    const coins = user.coins ?? user.balance ?? user.wallet ?? 0;

    row.innerHTML = `
      <td>
        <div class="user-cell">
          <span class="user-cell__avatar">
            ${avatar ? `<img src="${escapeAdminHtml(avatar)}" alt="" loading="lazy" />` : escapeAdminHtml(initials)}
          </span>
          <span>
            <strong>${escapeAdminHtml(name)}</strong>
            ${username && username !== name ? `<span>@${escapeAdminHtml(username)}</span>` : ''}
          </span>
        </div>
      </td>
      <td class="users-table__muted">${escapeAdminHtml(user.id ?? user.userId ?? user.user_id ?? '—')}</td>
      <td class="users-table__coins">⚽ ${formatCoins(coins)}</td>
      <td>${createdAt ? formatDate(createdAt) : '<span class="users-table__muted">—</span>'}</td>
    `;

    tbody.appendChild(row);
  });

  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  const pagination = document.getElementById('users-pagination');
  pagination.hidden = totalPages <= 1;

  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }

  const pageButtons = Array.from({ length: totalPages }, (_, index) => {
    const page = index + 1;
    const current = page === ADMIN_STATE.currentPage;
    return `
      <button class="pagination-button" type="button" data-page="${page}"
        ${current ? 'aria-current="page"' : ''} aria-label="Ir para a página ${page}">
        ${page}
      </button>
    `;
  }).join('');

  pagination.innerHTML = `
    <button class="pagination-button" type="button" data-page="${ADMIN_STATE.currentPage - 1}"
      ${ADMIN_STATE.currentPage === 1 ? 'disabled' : ''} aria-label="Página anterior">
      Anterior
    </button>
    ${pageButtons}
    <button class="pagination-button" type="button" data-page="${ADMIN_STATE.currentPage + 1}"
      ${ADMIN_STATE.currentPage === totalPages ? 'disabled' : ''} aria-label="Próxima página">
      Próxima
    </button>
  `;
}

function setAdminLoading(loading) {
  const status = document.getElementById('admin-status');
  const select = document.getElementById('month-filter');
  select.disabled = loading;

  if (loading) {
    status.textContent = 'Carregando dados...';
    return;
  }

  status.textContent = ADMIN_STATE.usingFallback
    ? 'A API não respondeu. Exibindo dados de demonstração para validar o layout.'
    : `Dados atualizados para ${formatMonthLabel(ADMIN_STATE.selectedMonth)}.`;
}

function getSeriesTotal(series, mode) {
  const values = series.map((item) => Number(item.value) || 0);
  if (!values.length) return 0;
  return mode === 'maximum' ? Math.max(...values) : values.reduce((total, value) => total + value, 0);
}

function formatMonthLabel(month) {
  const [year, monthNumber] = month.split('-').map(Number);
  return `${MONTH_NAMES[monthNumber - 1]} de ${year}`;
}

function formatChartLabel(label) {
  const value = String(label);
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [, month, day] = value.slice(0, 10).split('-');
    return `${day}/${month}`;
  }
  return value;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return escapeAdminHtml(value);
  return date.toLocaleDateString('pt-BR');
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('pt-BR');
}

function collectAdminInitials(name) {
  return String(name)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function escapeAdminHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* Dados locais permitem validar a tela enquanto os endpoints não estão disponíveis. */
function getAdminFallback(month) {
  const [year, monthNumber] = month.split('-').map(Number);
  const base = ((year * 7) + (monthNumber * 13)) % 30;
  const days = [1, 5, 9, 13, 17, 21, 25, 28];
  const activeValues = [42, 55, 51, 78, 91, 76, 94, 83].map((value) => value + base);
  const createdValues = [4, 7, 5, 12, 16, 11, 18, 14].map((value) => value + Math.floor(base / 6));

  const fallbackUsers = [
    ['bia.santos', 'Beatriz Santos', 3200],
    ['carlos.m', 'Carlos Mendes', 1850],
    ['ana.lima', 'Ana Lima', 2740],
    ['joao.r', 'João Ribeiro', 940],
    ['marina.c', 'Marina Costa', 2260],
    ['lucas.a', 'Lucas Almeida', 1480],
    ['gabriela.p', 'Gabriela Prado', 3590],
    ['rafael.n', 'Rafael Nunes', 1760],
    ['juliana.f', 'Juliana Freitas', 2840],
    ['pedro.h', 'Pedro Henrique', 1120],
    ['camila.rocha', 'Camila Rocha', 2430],
    ['matheus.s', 'Matheus Silva', 1980],
    ['larissa.m', 'Larissa Martins', 3070],
  ];

  const createdUsers = fallbackUsers.map(([username, displayName, coins], index) => {
    const day = String(((index * 2) % 27) + 1).padStart(2, '0');
    return {
      id: `${month}-${String(index + 1).padStart(3, '0')}`,
      username,
      displayName,
      coins,
      createdAt: `${month}-${day}T13:20:00Z`,
    };
  });

  return {
    dashboard: {
      activeUsers: days.map((day, index) => ({ label: `${year}-${String(monthNumber).padStart(2, '0')}-${String(day).padStart(2, '0')}`, value: activeValues[index] })),
      createdUsers: days.map((day, index) => ({ label: `${year}-${String(monthNumber).padStart(2, '0')}-${String(day).padStart(2, '0')}`, value: createdValues[index] })),
      activeTotal: Math.max(...activeValues),
      createdTotal: createdValues.reduce((total, value) => total + value, 0),
    },
    users: createdUsers,
  };
}

window.initAdmin = initAdmin;
