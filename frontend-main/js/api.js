/* =============================================
   api.js — ponto central de comunicação com o backend
   Todas as chamadas fetch() passam por aqui.
   ============================================= */

const BASE_URL = "/api";

function getToken() {
  return localStorage.getItem("token");
}

async function apiFetch(path, options = {}) {
  const { skipAuthRedirect = false, ...fetchOptions } = options;
  const headers = {
    "Content-Type": "application/json",
    ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    ...fetchOptions.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...fetchOptions, headers });

  if (res.status === 401 && !skipAuthRedirect) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/auth.html";
    return;
  }

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!res.ok) {
    const error = new Error((data && data.detail) || "Erro desconhecido");
    error.status = res.status;
    throw error;
  }
  return data;
}

const api = {
  // Auth
  register:     (body)    => apiFetch("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login:        (body)    => apiFetch("/auth/login",    { method: "POST", body: JSON.stringify(body) }),

  // Mercado
  getMarket:    (params)  => apiFetch(`/market/players?${new URLSearchParams(params)}`),
  getSections:  ()        => apiFetch("/market/sections"),
  buyPlayer:    (id)      => apiFetch(`/squad/buy/${id}`, { method: "POST" }),

  // Carrinho
  getCart:      (userId)  => apiFetch(`/cart/${userId}`),
  addCartItem:  (body)    => apiFetch("/cart/add", { method: "POST", body: JSON.stringify(body) }),
  removeCartItem: (body)  => apiFetch("/cart/remove", { method: "DELETE", body: JSON.stringify(body) }),
  clearCart:    (userId)  => apiFetch(`/cart/clear/${userId}`, { method: "DELETE" }),
  checkoutCart: (body)    => apiFetch("/cart/checkout", { method: "POST", body: JSON.stringify(body) }),

  // Elenco
  getSquad:     (userId)  => apiFetch(userId ? `/squad/${userId}` : "/squad"),
  substitute:   (body)    => apiFetch("/squad/substitute", { method: "PATCH", body: JSON.stringify(body) }),
  assignPosition: (body)  => apiFetch("/squad/assign-position", { method: "PATCH", body: JSON.stringify(body) }),
  moveToBench:  (body)    => apiFetch("/squad/move-to-bench", { method: "PATCH", body: JSON.stringify(body) }),
  updateStarter: (body)   => apiFetch("/squad/starter", { method: "PATCH", body: JSON.stringify(body) }),
  setStarter:   (id)      => apiFetch(`/squad/starter/${id}`, { method: "PATCH" }),

  // Draft
  getOpponents:           () => apiFetch("/draft/opponents"),
  playDraft:              (userId, opponentId = null, mode = "cup", stage = null) => apiFetch(
    mode === "friendly" ? "/draft/friendly/play" : "/draft/play",
    {
      method: "POST",
      body: JSON.stringify({
        user_id: userId,
        ...(opponentId ? { opponent_id: String(opponentId) } : {}),
        ...(stage ? { stage } : {}),
      }),
    },
  ),
  getActivePenalty:       (userId) => apiFetch(`/draft/penalty/active/${userId}`),
  shootPenalty:           (body) => apiFetch("/draft/penalty/shoot", {
    method: "POST",
    body: JSON.stringify(body),
  }),
  savePenalty:            (body) => apiFetch("/draft/penalty/save", {
    method: "POST",
    body: JSON.stringify(body),
  }),
  getHistory:             (userId, { limit = 20, offset = 0 } = {}) => apiFetch(`/draft/history/${userId}?limit=${limit}&offset=${offset}`),
  getCampaign:            (userId) => apiFetch(`/draft/campaign/${userId}`),
  restartCampaign:        (userId) => apiFetch(`/draft/campaign/${userId}/restart`, { method: "POST" }),

  // Admin
  getAdminDashboard: (params, options = {}) => apiFetch(`/admin/dashboard?${new URLSearchParams(params)}`, options),
  // Lista usuários. Com { month } retorna os criados no mês (dashboard). Sem month: todos.
  getAdminUsers:     (params, options = {}) => apiFetch(`/admin/users?${new URLSearchParams(params)}`, options),
  // Lista todos os usuários, paginado no servidor: { limit, offset } -> { users, total, limit, offset }
  listAllUsers:      ({ limit = 50, offset = 0 } = {}, options = {}) => apiFetch(`/admin/users?limit=${limit}&offset=${offset}`, options),
  // Bane (exclui) um usuário: 204 em sucesso (resolve para null), 404 se não existir
  banAdminUser:      (userId, options = {}) => apiFetch(`/admin/users/${userId}`, { method: "DELETE", ...options }),
};
