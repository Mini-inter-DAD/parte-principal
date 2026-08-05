/* Landing Page */

// Se o usuário já estiver logado, vai direto pro mercado
(function redirectIfLoggedIn() {
  if (localStorage.getItem('token')) {
    window.location.href = 'market.html';
  }
})();
