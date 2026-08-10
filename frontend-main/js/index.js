/* Landing Page */

// Se o usuário já estiver logado, vai direto pro mercado
(function redirectIfLoggedIn() {
  if (localStorage.getItem('token')) {
    const rawUser = localStorage.getItem('user');
    let user = null;

    try {
      user = rawUser ? JSON.parse(rawUser) : null;
    } catch {
      user = null;
    }

    window.location.href = user?.role === 'admin' ? 'admin.html' : 'market.html';
  }
})();
