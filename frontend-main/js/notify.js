/* =============================================
   notify.js — sistema de notificações
   Adaptação do emitNotification React → JS Vanilla
   Uso: notify.success('Jogador comprado!')
        notify.error('Saldo insuficiente.')
        notify.info('Seu elenco foi atualizado.')
        notify.errors('Dados inválidos', { username: 'Já existe', password: 'Muito curta' })
   ============================================= */

const THEME = {
  success: {
    icon:             'success',
    iconColor:        '#00d4ff',
    confirmBtnColor:  '#00d4ff',
  },
  error: {
    icon:             'error',
    iconColor:        '#e74c3c',
    confirmBtnColor:  '#e74c3c',
  },
  info: {
    icon:             'info',
    iconColor:        '#8a9bb0',
    confirmBtnColor:  '#00d4ff',
  },
};

// Estilos base que aplicamos em todos os alerts
const BASE_STYLES = {
  background:         'var(--color-surface, #1c2b3a)',
  color:              'var(--color-text, #e8e8e8)',
  confirmButtonText:  'OK',
  customClass: {
    popup:            'swal-popup',
    title:            'swal-title',
    htmlContainer:    'swal-html',
    confirmButton:    'swal-confirm-btn',
  },
};

// Injeta o CSS do popup uma única vez
(function injectSwalStyles() {
  if (document.getElementById('swal-custom-styles')) return;

  const style = document.createElement('style');
  style.id = 'swal-custom-styles';
  style.textContent = `
    .swal-popup {
      background: var(--color-surface, #1c2b3a) !important;
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6) !important;
    }

    [data-theme="light"] .swal-popup {
      background: #ffffff !important;
      border-color: rgba(0, 0, 0, 0.08);
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.15) !important;
    }

    .swal-title {
      color: var(--color-text, #e8e8e8) !important;
      font-family: 'Bebas Neue', sans-serif !important;
      font-size: 1.5rem !important;
      letter-spacing: 0.04em;
    }

    [data-theme="light"] .swal-title {
      color: #1a1a2e !important;
    }

    .swal-html {
      color: var(--color-text-muted, #8a9bb0) !important;
      font-size: 0.9rem !important;
      line-height: 1.6 !important;
    }

    [data-theme="light"] .swal-html {
      color: #555e6d !important;
    }

    .swal-confirm-btn {
      font-family: 'Inter', sans-serif !important;
      font-weight: 600 !important;
      font-size: 0.9rem !important;
      border-radius: 6px !important;
      padding: 0.6rem 1.8rem !important;
      border: 2px solid transparent !important;
      transition: background-color 0.15s, color 0.15s, box-shadow 0.15s !important;
    }

    .swal-confirm-btn:hover {
      background-color: transparent !important;
      box-shadow: 0 0 20px rgba(0, 212, 255, 0.25) !important;
    }

    .swal-confirm-btn:focus {
      box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.3) !important;
    }
  `;
  document.head.appendChild(style);
})();

// ─── Função principal ─────────────────────────────────────────────────────────

function showNotification({ type = 'info', title = '', message = '' }) {
  const theme = THEME[type] || THEME.info;

  Swal.fire({
    ...BASE_STYLES,
    icon:                    theme.icon,
    iconColor:               theme.iconColor,
    title:                   title || undefined,
    html:                    message || undefined,
    confirmButtonColor:      theme.confirmBtnColor,
    timer:                   type === 'success' ? 2500 : undefined,
    timerProgressBar:        type === 'success',
    showConfirmButton:       type !== 'success',
  });
}

// ─── API pública ──────────────────────────────────────────────────────────────

const notify = {
  success(message, title = 'Sucesso!') {
    showNotification({ type: 'success', title, message });
  },

  error(message, title = 'Ops!') {
    showNotification({ type: 'error', title, message });
  },

  info(message, title = '') {
    showNotification({ type: 'info', title, message });
  },

  // Equivalente ao caso com `errors` do React:
  // notify.errors('Dados inválidos', { username: 'Já existe', password: 'Muito curta' })
  errors(title, errors = {}) {
    const lines = Object.values(errors)
      .filter(Boolean)
      .map(v => `• ${v}`)
      .join('<br />');

    const message = `<b>${title}</b><br />${lines}`;
    showNotification({ type: 'error', title: 'Atenção', message });
  },
};

window.notify = notify;
