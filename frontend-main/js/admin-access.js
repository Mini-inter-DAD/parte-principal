/* =============================================
   admin-access.js — atalho temporário para testes
   ============================================= */

(function createAdminAccessLink() {
  if (document.querySelector('.admin-access-link')) return;

  const link = document.createElement('a');
  link.href = 'admin.html';
  link.className = 'admin-access-link';
  link.setAttribute('aria-label', 'Acessar área administrativa');
  link.title = 'Área administrativa';
  link.innerHTML = `
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" stroke-width="2" />
      <path d="M8 10V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V10"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      <circle cx="12" cy="15" r="1.25" fill="currentColor" />
    </svg>
  `;

  document.body.appendChild(link);
})();
