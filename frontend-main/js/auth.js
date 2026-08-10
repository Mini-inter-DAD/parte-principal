/* Login / sessão */

function getSession() {
  const token = localStorage.getItem('token');
  const rawUser = localStorage.getItem('user');
  let user = null;

  try {
    user = rawUser ? JSON.parse(rawUser) : null;
  } catch {
    user = null;
  }

  return { token, user };
}

function saveSession({ token, user }) {
  if (token) {
    localStorage.setItem('token', token);
  }

  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  }
}

function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

function logout() {
  clearSession();
  window.location.href = '/auth.html';
}

function requireAuth() {
  const { token } = getSession();
  if (!token) {
    window.location.href = '/auth.html';
  }
}

function createMockUser() {
  return {
    id: 'demo-user',
    username: 'demo',
    displayName: 'Jogador Demo',
    coins: 3200,
  };
}

function mockLogin() {
  const user = createMockUser();
  saveSession({ token: 'demo-token', user });
  window.location.href = '/market.html';
}

function ensureAuth() {
  const session = getSession();
  if (!session.token) {
    const user = createMockUser();
    saveSession({ token: 'demo-token', user });
    return { token: 'demo-token', user };
  }
  return session;
}

function setUserCoins(coins) {
  const session = getSession();
  if (!session.user) return;
  session.user.coins = coins;
  localStorage.setItem('user', JSON.stringify(session.user));
  const headerCoins = document.getElementById('header-coins');
  const formattedCoins = typeof formatCoins === 'function'
    ? formatCoins(coins)
    : Number(coins || 0).toLocaleString('pt-BR');
  if (headerCoins) headerCoins.textContent = `⚽ ${formattedCoins}`;
}

window.getSession = getSession;
window.saveSession = saveSession;
window.clearSession = clearSession;
window.logout = logout;
window.requireAuth = requireAuth;
window.ensureAuth = ensureAuth;
window.mockLogin = mockLogin;
window.setUserCoins = setUserCoins;

