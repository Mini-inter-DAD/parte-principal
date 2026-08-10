/* =============================================
   navbar.js — componente de navbar compartilhada
   ============================================= */

function renderNavbar(activePage) {
  const { user } = getSession();
  const coins = user?.coins ?? 0;

  const nav = document.getElementById("navbar");
  if (!nav) return;
  nav.innerHTML = `
    <a href="/market.html" class="${activePage === 'market' ? 'active' : ''}">Mercado</a>
    <a href="/squad.html"  class="${activePage === 'squad'  ? 'active' : ''}">Meu Elenco</a>
    <a href="/draft.html"  class="${activePage === 'draft'  ? 'active' : ''}">Jogar</a>
  `;

  // update header coins if present (keeps coin position in header)
  const headerCoins = document.getElementById('header-coins');
  const formattedCoins = typeof formatCoins === 'function'
    ? formatCoins(coins)
    : Number(coins || 0).toLocaleString('pt-BR');
  if (headerCoins) headerCoins.textContent = `⚽ ${formattedCoins}`;

  // place logout button into the right-side actions area if available
  const actions = document.getElementById('nav-actions');
  if (actions) {
    // remove any previously rendered logout buttons to avoid duplicates
    const existing = actions.querySelectorAll('.btn-logout');
    existing.forEach(n => n.remove());

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-logout';
    btn.textContent = 'Sair';
    btn.addEventListener('click', logout);
    actions.appendChild(btn);
  } else {
    // fallback: append a styled logout button to nav
    const fallback = document.createElement('button');
    fallback.type = 'button';
    fallback.className = 'btn btn-logout';
    fallback.textContent = 'Sair';
    fallback.addEventListener('click', logout);
    nav.appendChild(fallback);
  }
}
