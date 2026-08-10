/* =============================================
   api.js — ponto central de comunicação com o backend
   Todas as chamadas fetch() passam por aqui.
   ============================================= */

const BASE_URL = "http://localhost:8000"; // TODO: trocar pela URL do backend no Render

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

  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.detail || "Erro desconhecido");
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

  // Elenco
  getSquad:     ()        => apiFetch("/squad"),
  setStarter:   (id)      => apiFetch(`/squad/starter/${id}`, { method: "PATCH" }),

  // Draft
  getOpponents: ()        => apiFetch("/draft/opponents"),
  playDraft:    (body)    => apiFetch("/draft/play",    { method: "POST", body: JSON.stringify(body) }),
  getHistory:   ()        => apiFetch("/draft/history"),

  // Admin
  getAdminDashboard: (params, options = {}) => apiFetch(`/admin/dashboard?${new URLSearchParams(params)}`, options),
  getAdminUsers:     (params, options = {}) => apiFetch(`/admin/users?${new URLSearchParams(params)}`, options),
};
