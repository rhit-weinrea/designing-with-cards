const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export const api = {
  // Products
  getProducts: () => request('/products'),
  createProduct: (name) => request('/products', { method: 'POST', body: { name } }),
  getProduct: (id) => request(`/products/${id}`),
  updateProduct: (id, name) => request(`/products/${id}`, { method: 'PUT', body: { name } }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),

  // Cards
  getCards: (productId) => request(`/products/${productId}/cards`),
  createCard: (productId, card) => request(`/products/${productId}/cards`, { method: 'POST', body: card }),
  updateCard: (id, card) => request(`/cards/${id}`, { method: 'PUT', body: card }),
  deleteCard: (id) => request(`/cards/${id}`, { method: 'DELETE' }),

  // Sessions
  getSessions: () => request('/sessions'),
  getProductSessions: (productId) => request(`/products/${productId}/sessions`),
  createSession: (data) => request('/sessions', { method: 'POST', body: data }),
  getSession: (id) => request(`/sessions/${id}`),
  updateSession: (id, data) => request(`/sessions/${id}`, { method: 'PUT', body: data }),

  // Snapshots
  saveSnapshot: (sessionId, mode, data) => request(`/sessions/${sessionId}/snapshot`, { method: 'POST', body: { mode, data } }),
  getSnapshots: (sessionId) => request(`/sessions/${sessionId}/snapshots`),
}
