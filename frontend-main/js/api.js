/* =============================================
   api.js — ponto central de comunicação com o backend
   Todas as chamadas fetch() passam por aqui.
   ============================================= */

const API_URL_OVERRIDE = new URLSearchParams(window.location.search).get("api");
const BASE_URL = API_URL_OVERRIDE || "http://localhost:8000"; // TODO: trocar pela URL do backend no Render

function getToken() {
  return localStorage.getItem("token");
}

async function apiFetch(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/auth.html";
    return;
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Erro desconhecido");
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
  playDraft:              (userId, opponentId, mode = "cup") => apiFetch("/draft/play", {
    method: "POST",
    body: JSON.stringify({
      user_id: userId,
      mode,
      ...(opponentId ? { opponent_id: opponentId } : {}),
    }),
  }),
  getHistory:             (userId, { limit = 20, offset = 0 } = {}) => apiFetch(`/draft/history/${userId}?limit=${limit}&offset=${offset}`),
  getCampaign:            (userId) => apiFetch(`/draft/campaign/${userId}`),
  restartCampaign:        (userId) => apiFetch(`/draft/campaign/${userId}/restart`, { method: "POST" }),
};
