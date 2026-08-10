/* =============================================
   accessibility.js
   Módulo central de acessibilidade do UTCM.

   Features:
   - Modo claro / escuro (dark mode)
   - Aumentar / diminuir tamanho de fonte
   - Leitor de texto por voz (Text-to-Speech)

   Como usar:
     1. Inclua este script antes do </body> em todas as páginas.
     2. Chame initAccessibility() no DOMContentLoaded da página.
     3. O widget é inserido automaticamente no <body>.
   ============================================= */

// ─── Chaves de localStorage ───────────────────────────────────────────────────
const STORAGE_KEYS = {
  theme:    'utcm_theme',
  fontSize: 'utcm_fontSize',
};

// ─── Limites e defaults de fonte ─────────────────────────────────────────────
const FONT_CONFIG = {
  min:     12,
  max:     22,
  default: 16,
  step:    1,
};

// ─── Estado interno do módulo ─────────────────────────────────────────────────
const state = {
  ttsActive: false,
  currentUtterance: null,
};

// =============================================================================
// TEMA (claro / escuro)
// =============================================================================

function getStoredTheme() {
  return localStorage.getItem(STORAGE_KEYS.theme) || 'dark';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEYS.theme, theme);

  const btn = document.getElementById('a11y-theme-btn');
  if (!btn) return;

  if (theme === 'dark') {
    btn.setAttribute('aria-label', 'Ativar modo claro');
    btn.setAttribute('title',      'Ativar modo claro');
    btn.innerHTML = icons.sun;
  } else {
    btn.setAttribute('aria-label', 'Ativar modo escuro');
    btn.setAttribute('title',      'Ativar modo escuro');
    btn.innerHTML = icons.moon;
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

// =============================================================================
// TAMANHO DE FONTE
// Adaptação do componente React/TSX para JS Vanilla
// =============================================================================

function getStoredFontSize() {
  const stored = localStorage.getItem(STORAGE_KEYS.fontSize);
  if (!stored || isNaN(Number(stored))) return FONT_CONFIG.default;
  return Number(stored);
}

function applyFontSize(size) {
  // Clamp entre min e max
  const clamped = Math.min(FONT_CONFIG.max, Math.max(FONT_CONFIG.min, size));
  document.documentElement.style.fontSize = `${clamped}px`;
  localStorage.setItem(STORAGE_KEYS.fontSize, String(clamped));

  // Atualiza display e estado dos botões
  const display = document.getElementById('a11y-font-size-display');
  if (display) display.textContent = `${clamped}px`;

  const btnDecrease = document.getElementById('a11y-font-decrease');
  const btnIncrease = document.getElementById('a11y-font-increase');
  if (btnDecrease) btnDecrease.disabled = clamped <= FONT_CONFIG.min;
  if (btnIncrease) btnIncrease.disabled = clamped >= FONT_CONFIG.max;
}

function increaseFontSize() {
  const current = getStoredFontSize();
  applyFontSize(current + FONT_CONFIG.step);
}

function decreaseFontSize() {
  const current = getStoredFontSize();
  applyFontSize(current - FONT_CONFIG.step);
}

function resetFontSize() {
  applyFontSize(FONT_CONFIG.default);
}

// =============================================================================
// LEITOR DE VOZ (Text-to-Speech via Web Speech API)
// =============================================================================

function isTTSSupported() {
  return 'speechSynthesis' in window;
}

function getPageText() {
  // Coleta o texto principal da página, ignorando o widget de acessibilidade
  const main = document.querySelector('main') || document.body;
  const widget = document.getElementById('a11y-widget');

  // Clona o main para não modificar o DOM real
  const clone = main.cloneNode(true);

  // Remove o widget do clone, se existir dentro do main
  const widgetInClone = clone.querySelector('#a11y-widget');
  if (widgetInClone) widgetInClone.remove();

  // Retorna só o texto, limpando espaços extras
  return clone.innerText
    ? clone.innerText.replace(/\s+/g, ' ').trim()
    : clone.textContent.replace(/\s+/g, ' ').trim();
}

function startTTS() {
  if (!isTTSSupported()) {
    alert('Seu navegador não suporta o leitor de voz.');
    return;
  }

  const text = getPageText();
  if (!text) return;

  // Para qualquer leitura anterior
  stopTTS();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang  = 'pt-BR';
  utterance.rate  = 1;
  utterance.pitch = 1;

  utterance.onend = () => {
    state.ttsActive = false;
    state.currentUtterance = null;
    updateTTSButton(false);
  };

  utterance.onerror = () => {
    state.ttsActive = false;
    state.currentUtterance = null;
    updateTTSButton(false);
  };

  state.currentUtterance = utterance;
  state.ttsActive = true;
  updateTTSButton(true);
  window.speechSynthesis.speak(utterance);
}

function stopTTS() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  state.ttsActive = false;
  state.currentUtterance = null;
  updateTTSButton(false);
}

function toggleTTS() {
  if (state.ttsActive) {
    stopTTS();
  } else {
    startTTS();
  }
}

function updateTTSButton(isActive) {
  const btn = document.getElementById('a11y-tts-btn');
  if (!btn) return;

  if (isActive) {
    btn.setAttribute('aria-label',    'Parar leitura');
    btn.setAttribute('title',         'Parar leitura');
    btn.setAttribute('aria-pressed',  'true');
    btn.innerHTML = icons.stop;
    btn.classList.add('a11y-btn--active');
  } else {
    btn.setAttribute('aria-label',    'Ler página em voz alta');
    btn.setAttribute('title',         'Ler página em voz alta');
    btn.setAttribute('aria-pressed',  'false');
    btn.innerHTML = icons.speaker;
    btn.classList.remove('a11y-btn--active');
  }
}

// =============================================================================
// ÍCONES SVG (inline — sem dependência externa)
// =============================================================================

const icons = {
  sun: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>`,

  moon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>`,

  speaker: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
  </svg>`,

  stop: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <line x1="23" y1="9" x2="17" y2="15"/>
    <line x1="17" y1="9" x2="23" y2="15"/>
  </svg>`,

  fontMinus: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <polyline points="4 7 4 4 20 4 20 7"/>
    <line x1="9" y1="20" x2="15" y2="20"/>
    <line x1="12" y1="4" x2="12" y2="20"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>`,

  fontPlus: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <polyline points="4 7 4 4 20 4 20 7"/>
    <line x1="9" y1="20" x2="15" y2="20"/>
    <line x1="12" y1="4" x2="12" y2="20"/>
  </svg>`,
};

// =============================================================================
// WIDGET — renderização no DOM
// =============================================================================

function renderWidget() {
  // Evita duplicar o widget se já existir
  if (document.getElementById('a11y-widget')) return;

  const widget = document.createElement('div');
  widget.id = 'a11y-widget';
  widget.setAttribute('role',       'region');
  widget.setAttribute('aria-label', 'Opções de acessibilidade');

  widget.innerHTML = `
    <button
      id="a11y-toggle-btn"
      class="a11y-toggle"
      aria-label="Abrir opções de acessibilidade"
      aria-expanded="false"
      aria-controls="a11y-panel"
      title="Acessibilidade"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="7"  r="1" fill="currentColor"/>
        <path d="M9 12h6M12 12v5"/>
      </svg>
    </button>

    <div
      id="a11y-panel"
      class="a11y-panel"
      role="group"
      aria-label="Configurações de acessibilidade"
      hidden
    >
      <p class="a11y-panel__title" aria-hidden="true">Acessibilidade</p>

      <!-- Tema -->
      <div class="a11y-group">
        <span class="a11y-group__label" id="label-theme">Tema</span>
        <button
          id="a11y-theme-btn"
          class="a11y-btn"
          aria-label="Ativar modo claro"
          aria-describedby="label-theme"
          title="Ativar modo claro"
        ></button>
      </div>

      <!-- Tamanho de fonte -->
      <div class="a11y-group">
        <span class="a11y-group__label" id="label-font">Fonte</span>
        <div class="a11y-font-controls" role="group" aria-labelledby="label-font">
          <button
            id="a11y-font-decrease"
            class="a11y-btn"
            aria-label="Diminuir tamanho da fonte"
            title="Diminuir fonte"
          ></button>
          <span
            id="a11y-font-size-display"
            aria-live="polite"
            aria-label="Tamanho atual da fonte"
            class="a11y-font-size-display"
          >16px</span>
          <button
            id="a11y-font-increase"
            class="a11y-btn"
            aria-label="Aumentar tamanho da fonte"
            title="Aumentar fonte"
          ></button>
          <button
            id="a11y-font-reset"
            class="a11y-btn a11y-btn--text"
            aria-label="Restaurar tamanho padrão da fonte"
            title="Restaurar fonte padrão"
          >Voltar</button>
        </div>
      </div>

      <!-- Leitor de voz -->
      <div class="a11y-group">
        <span class="a11y-group__label" id="label-tts">Voz</span>
        <button
          id="a11y-tts-btn"
          class="a11y-btn"
          aria-label="Ler página em voz alta"
          aria-describedby="label-tts"
          aria-pressed="false"
          title="Ler página em voz alta"
        ></button>
      </div>
    </div>
  `;

  document.body.appendChild(widget);

  // Preenche os ícones após inserir no DOM
  document.getElementById('a11y-theme-btn').innerHTML     = icons.sun;
  document.getElementById('a11y-font-decrease').innerHTML = icons.fontMinus;
  document.getElementById('a11y-font-increase').innerHTML = icons.fontPlus;
  document.getElementById('a11y-tts-btn').innerHTML       = icons.speaker;

  // Esconde TTS se não suportado
  if (!isTTSSupported()) {
    const ttsGroup = document.getElementById('a11y-tts-btn').closest('.a11y-group');
    if (ttsGroup) ttsGroup.style.display = 'none';
  }
}

// =============================================================================
// PAINEL — abrir / fechar
// =============================================================================

function bindPanelToggle() {
  const toggleBtn = document.getElementById('a11y-toggle-btn');
  const panel     = document.getElementById('a11y-panel');
  if (!toggleBtn || !panel) return;

  toggleBtn.addEventListener('click', () => {
    const isOpen = !panel.hidden;
    panel.hidden = isOpen;
    toggleBtn.setAttribute('aria-expanded', String(!isOpen));

    // Para leitura se fechar o painel
    if (isOpen && state.ttsActive) stopTTS();
  });

  // Fecha com Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) {
      panel.hidden = true;
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.focus();
    }
  });

  // Fecha ao clicar fora
  document.addEventListener('click', (e) => {
    const widget = document.getElementById('a11y-widget');
    if (widget && !widget.contains(e.target) && !panel.hidden) {
      panel.hidden = true;
      toggleBtn.setAttribute('aria-expanded', 'false');
    }
  });
}

// =============================================================================
// BIND DOS BOTÕES
// =============================================================================

function bindButtons() {
  document.getElementById('a11y-theme-btn')
    ?.addEventListener('click', toggleTheme);

  document.getElementById('a11y-font-decrease')
    ?.addEventListener('click', decreaseFontSize);

  document.getElementById('a11y-font-increase')
    ?.addEventListener('click', increaseFontSize);

  document.getElementById('a11y-font-reset')
    ?.addEventListener('click', resetFontSize);

  document.getElementById('a11y-tts-btn')
    ?.addEventListener('click', toggleTTS);
}

// =============================================================================
// INIT — chamada única por página
// =============================================================================

function initAccessibility() {
  renderWidget();
  bindPanelToggle();
  bindButtons();

  // Restaura preferências salvas
  applyTheme(getStoredTheme());
  applyFontSize(getStoredFontSize());
}

// Expõe apenas o necessário
window.initAccessibility = initAccessibility;
