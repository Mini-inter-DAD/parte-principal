/* =============================================
   auth-ui.js — comportamento da tela de auth
   (abas, validação, show/hide senha, forgot)
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
  if (window.__dreamCupAuthUiInitialized) return;
  window.__dreamCupAuthUiInitialized = true;

  // ─── Elementos ──────────────────────────────────────────────────────────
  const tabLogin    = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const panelLogin  = document.getElementById('panel-login');
  const panelReg    = document.getElementById('panel-register');
  const panelForgot = document.getElementById('panel-forgot');

  const formLogin   = document.getElementById('form-login');
  const formReg     = document.getElementById('form-register');
  const formForgot  = document.getElementById('form-forgot');

  // ─── Troca de abas ──────────────────────────────────────────────────────
  function showTab(tab) {
    const isLogin = tab === 'login';

    // Abas (só login/register têm tab button)
    tabLogin.setAttribute('aria-selected',    isLogin ? 'true' : 'false');
    tabRegister.setAttribute('aria-selected', isLogin ? 'false' : 'true');
    tabLogin.classList.toggle('auth-tab--active',    isLogin);
    tabRegister.classList.toggle('auth-tab--active', !isLogin);

    // Painéis
    [panelLogin, panelReg, panelForgot].forEach(p => {
      p.hidden = true;
      p.classList.add('auth-panel--hidden');
    });

    const target = tab === 'login' ? panelLogin : tab === 'register' ? panelReg : panelForgot;
    target.hidden = false;
    target.classList.remove('auth-panel--hidden');

    // Foco no primeiro input do painel
    const firstInput = target.querySelector('input');
    if (firstInput) firstInput.focus();
  }

  tabLogin.addEventListener('click',    () => showTab('login'));
  tabRegister.addEventListener('click', () => showTab('register'));

  // Botões "Criar conta" / "Entrar" e "Voltar"
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => showTab(btn.dataset.tab));
  });

  // Botão "Esqueci minha senha" (dentro do form de login)
  document.getElementById('btn-forgot')?.addEventListener('click', () => showTab('forgot'));
  document.getElementById('btn-back-forgot')?.addEventListener('click', () => showTab('login'));

  // ─── Mostrar / ocultar senha ─────────────────────────────────────────────
  document.querySelectorAll('.auth-input__toggle-pw').forEach(btn => {
    btn.addEventListener('click', (event) => {
      event.preventDefault();
      const input = document.getElementById(btn.dataset.target);
      if (!input) return;
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      btn.setAttribute('aria-label', isPassword ? 'Ocultar senha' : 'Mostrar senha');
      btn.setAttribute('aria-pressed', isPassword ? 'true' : 'false');
      btn.innerHTML = isPassword
        ? '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18"/><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M9.9 4.2A10.9 10.9 0 0 1 12 4c7 0 11 8 11 8a19.1 19.1 0 0 1-3.2 4.3"/><path d="M6.6 6.6C3.5 8.6 1 12 1 12s4 8 11 8a10.9 10.9 0 0 0 3.8-.7"/></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
    });
  });

  // ─── Helpers de validação ────────────────────────────────────────────────
  function setError(fieldId, msg) {
    const el = document.getElementById(fieldId);
    if (!el) return;
    el.textContent = msg;
    const input = document.querySelector(`[aria-describedby="${fieldId}"]`);
    if (input) input.classList.toggle('auth-input--error', !!msg);
  }

  function clearErrors(...ids) {
    ids.forEach(id => setError(id, ''));
  }

  function setLoading(btn, loading) {
    btn.disabled = loading;
    btn.classList.toggle('auth-submit--loading', loading);
  }

  async function loginWithFormError(body) {
    const apiUrl = new URLSearchParams(window.location.search).get('api') || 'http://localhost:8000';
    const response = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Usuário ou senha incorretos.');
    return data;
  }

  // ─── LOGIN ───────────────────────────────────────────────────────────────
  formLogin?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors('login-username-error', 'login-password-error', 'login-form-error');

    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const btn      = document.getElementById('btn-login');

    let valid = true;
    if (!username) { setError('login-username-error', 'Informe seu usuário.'); valid = false; }
    if (!password) { setError('login-password-error', 'Informe sua senha.');   valid = false; }
    if (!valid) return;

    setLoading(btn, true);
    try {
      const data = await loginWithFormError({ username, password });
      const account = data.account_type === 'admin'
        ? { ...data.admin, role: 'admin' }
        : data.user;
      saveSession({ token: data.token, user: account });
      
      // Substituição: sucesso após login
      notify.success('Conta criada! Redirecionando...');
      
      const destination = data.account_type === 'admin' ? 'admin.html' : 'market.html';
      window.location.href = `${destination}${window.location.search}`;
    } catch (err) {
      // Substituição: notificação de erro no login
      setError('login-form-error', err.message || 'Usuário ou senha incorretos.');
    } finally {
      setLoading(btn, false);
    }
  });

  // ─── CADASTRO ────────────────────────────────────────────────────────────
  formReg?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors('register-username-error', 'register-password-error', 'register-confirm-error', 'register-form-error');

    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;
    const confirm  = document.getElementById('register-confirm').value;
    const btn      = document.getElementById('btn-register');

    // Validação inline antiga (visual nos campos, caso ainda utilize)
    let valid = true;
    if (!username) { setError('register-username-error', 'Escolha um nome de usuário.'); valid = false; }
    if (username.length < 3) { setError('register-username-error', 'Mínimo de 3 caracteres.'); valid = false; }
    if (!password) { setError('register-password-error', 'Crie uma senha.'); valid = false; }
    if (password.length < 6) { setError('register-password-error', 'A senha precisa ter 6+ caracteres.'); valid = false; }
    if (password !== confirm) { setError('register-confirm-error', 'As senhas não coincidem.'); valid = false; }

    // Substituição: cadastro com múltiplos erros usando o componente notify
    if (!valid) {
      notify.errors('Dados inválidos', {
        username: !username ? 'Escolha um nome de usuário.' : (username.length < 3 ? 'Mínimo de 3 caracteres.' : ''),
        password: !password ? 'Crie uma senha.' : (password.length < 6 ? 'A senha precisa ter 6+ caracteres.' : ''),
        confirm:  password !== confirm ? 'As senhas não coincidem.' : '',
      });
      return;
    }

    setLoading(btn, true);
    try {
      const data = await api.register({ username, password });
      saveSession({ token: data.token, user: data.user });
      
      // Substituição: sucesso após cadastro
      notify.success('Conta criada! Redirecionando...');
      
      window.location.href = `market.html${window.location.search}`;
    } catch (err) {
      notify.error(err.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(btn, false);
    }
  });

  // ─── ESQUECI SENHA ───────────────────────────────────────────────────────
  formForgot?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors('forgot-username-error', 'forgot-form-error');

    const username = document.getElementById('forgot-username').value.trim();
    const btn      = document.getElementById('btn-forgot-submit');

    if (!username) { setError('forgot-username-error', 'Informe seu usuário.'); return; }

    setLoading(btn, true);
    try {
      await api.forgotPassword({ username });
      formForgot.hidden = true;
      document.getElementById('forgot-success').hidden = false;
    } catch (err) {
      notify.error(err.message || 'Usuário não encontrado.');
    } finally {
      setLoading(btn, false);
    }
  });

});/* =============================================
   auth-ui.js — comportamento da tela de auth
   (abas, validação, show/hide senha, forgot)
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
  if (window.__dreamCupAuthUiInitialized) return;
  window.__dreamCupAuthUiInitialized = true;

  // ─── Elementos ──────────────────────────────────────────────────────────
  const tabLogin    = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const panelLogin  = document.getElementById('panel-login');
  const panelReg    = document.getElementById('panel-register');
  const panelForgot = document.getElementById('panel-forgot');

  const formLogin   = document.getElementById('form-login');
  const formReg     = document.getElementById('form-register');
  const formForgot  = document.getElementById('form-forgot');

  // ─── Troca de abas ──────────────────────────────────────────────────────
  function showTab(tab) {
    const isLogin = tab === 'login';

    // Abas (só login/register têm tab button)
    tabLogin.setAttribute('aria-selected',    isLogin ? 'true' : 'false');
    tabRegister.setAttribute('aria-selected', isLogin ? 'false' : 'true');
    tabLogin.classList.toggle('auth-tab--active',    isLogin);
    tabRegister.classList.toggle('auth-tab--active', !isLogin);

    // Painéis
    [panelLogin, panelReg, panelForgot].forEach(p => {
      p.hidden = true;
      p.classList.add('auth-panel--hidden');
    });

    const target = tab === 'login' ? panelLogin : tab === 'register' ? panelReg : panelForgot;
    target.hidden = false;
    target.classList.remove('auth-panel--hidden');

    // Foco no primeiro input do painel
    const firstInput = target.querySelector('input');
    if (firstInput) firstInput.focus();
  }

  tabLogin.addEventListener('click',    () => showTab('login'));
  tabRegister.addEventListener('click', () => showTab('register'));

  // Botões "Criar conta" / "Entrar" e "Voltar"
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => showTab(btn.dataset.tab));
  });

  // Botão "Esqueci minha senha" (dentro do form de login)
  document.getElementById('btn-forgot')?.addEventListener('click', () => showTab('forgot'));
  document.getElementById('btn-back-forgot')?.addEventListener('click', () => showTab('login'));

  // ─── Mostrar / ocultar senha ─────────────────────────────────────────────
  document.querySelectorAll('.auth-input__toggle-pw').forEach(btn => {
    btn.addEventListener('click', (event) => {
      event.preventDefault();
      const input = document.getElementById(btn.dataset.target);
      if (!input) return;
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      btn.setAttribute('aria-label', isPassword ? 'Ocultar senha' : 'Mostrar senha');
    });
  });

  // ─── Helpers de validação ────────────────────────────────────────────────
  function setError(fieldId, msg) {
    const el = document.getElementById(fieldId);
    if (!el) return;
    el.textContent = msg;
    const input = document.querySelector(`[aria-describedby="${fieldId}"]`);
    if (input) input.classList.toggle('auth-input--error', !!msg);
  }

  function clearErrors(...ids) {
    ids.forEach(id => setError(id, ''));
  }

  function setLoading(btn, loading) {
    btn.disabled = loading;
    btn.classList.toggle('auth-submit--loading', loading);
  }

  // ─── LOGIN ───────────────────────────────────────────────────────────────
  formLogin?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors('login-username-error', 'login-password-error', 'login-form-error');

    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const btn      = document.getElementById('btn-login');

    let valid = true;
    if (!username) { setError('login-username-error', 'Informe seu usuário.'); valid = false; }
    if (!password) { setError('login-password-error', 'Informe sua senha.');   valid = false; }
    if (!valid) return;

    setLoading(btn, true);
    try {
      const data = await api.login({ username, password });
      saveSession({ token: data.token, user: data.user });
      window.location.href = `market.html${window.location.search}`;
    } catch (err) {
      setError('login-form-error', err.message || 'Usuário ou senha incorretos.');
    } finally {
      setLoading(btn, false);
    }
  });

  // ─── CADASTRO ────────────────────────────────────────────────────────────
  formReg?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors('register-username-error', 'register-password-error', 'register-confirm-error', 'register-form-error');

    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;
    const confirm  = document.getElementById('register-confirm').value;
    const btn      = document.getElementById('btn-register');

    let valid = true;
    if (!username)             { setError('register-username-error', 'Escolha um nome de usuário.');        valid = false; }
    if (username.length < 3)   { setError('register-username-error', 'Mínimo de 3 caracteres.');            valid = false; }
    if (!password)             { setError('register-password-error', 'Crie uma senha.');                    valid = false; }
    if (password.length < 6)   { setError('register-password-error', 'A senha precisa ter 6+ caracteres.'); valid = false; }
    if (password !== confirm)  { setError('register-confirm-error',  'As senhas não coincidem.');           valid = false; }
    if (!valid) return;

    setLoading(btn, true);
    try {
      const data = await api.register({ username, password });
      saveSession({ token: data.token, user: data.user });
      window.location.href = `market.html${window.location.search}`;
    } catch (err) {
      setError('register-form-error', err.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(btn, false);
    }
  });

  // ─── ESQUECI SENHA ───────────────────────────────────────────────────────
  formForgot?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors('forgot-username-error', 'forgot-form-error');

    const username = document.getElementById('forgot-username').value.trim();
    const btn      = document.getElementById('btn-forgot-submit');

    if (!username) { setError('forgot-username-error', 'Informe seu usuário.'); return; }

    setLoading(btn, true);
    try {
      await api.forgotPassword({ username });
      formForgot.hidden = true;
      document.getElementById('forgot-success').hidden = false;
    } catch (err) {
      setError('forgot-form-error', err.message || 'Usuário não encontrado.');
    } finally {
      setLoading(btn, false);
    }
  });

});
