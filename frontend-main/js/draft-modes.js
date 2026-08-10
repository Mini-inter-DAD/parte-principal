(function (root, factory) {
  const DraftModes = factory();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = DraftModes;
  }

  if (root) {
    root.DraftModes = DraftModes;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  function getElement(id) {
    return typeof document !== 'undefined' ? document.getElementById(id) : null;
  }

  function setExpanded(toggle, expanded) {
    const contentId = toggle.getAttribute('aria-controls');
    const content = contentId ? getElement(contentId) : null;
    const card = toggle.closest('[data-mode-card]');

    toggle.setAttribute('aria-expanded', String(expanded));
    if (content) content.hidden = !expanded;
    if (card) card.classList.toggle('is-open', expanded);
    return content;
  }

  function moveSharedPreview(mode) {
    const preview = getElement('match-preview');
    const target = mode === 'friendly'
      ? getElement('friendly-preview-slot')
      : getElement('mode-content-cup');
    if (preview && target) target.appendChild(preview);
  }

  function bind({ onModeChange = () => {} } = {}) {
    const toggles = Array.from(document.querySelectorAll('[data-mode-toggle]'));
    toggles.forEach((toggle) => {
      toggle.addEventListener('click', () => {
        const expanded = toggle.getAttribute('aria-expanded') !== 'true';
        if (expanded) {
          toggles.filter((other) => other !== toggle).forEach((other) => setExpanded(other, false));
          moveSharedPreview(toggle.dataset.mode || 'cup');
        }
        const content = setExpanded(toggle, expanded);
        onModeChange(toggle.dataset.mode || '', expanded, content);
      });
    });

    return { toggles, setExpanded };
  }

  function setStartEnabled(enabled, count = 0) {
    const button = getElement('btn-start-draft');
    const status = getElement('starter-status');
    const safeCount = Math.max(0, Number(count) || 0);

    if (button) {
      button.disabled = !enabled;
      button.setAttribute('aria-disabled', String(!enabled));
    }

    if (status) {
      if (enabled) {
        status.textContent = `${safeCount}/11 titulares prontos para jogar.`;
      } else if (safeCount > 11) {
        status.textContent = `Reduza seu time para exatamente 11 titulares. ${safeCount} titulares escalados.`;
      } else {
        status.textContent = `Complete seu time antes de jogar. ${safeCount}/11 titulares escalados.`;
      }
      status.classList.toggle('starter-status--ready', enabled);
    }
  }

  return Object.freeze({ bind, setStartEnabled });
});
