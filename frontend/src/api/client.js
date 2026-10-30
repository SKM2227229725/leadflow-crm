import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
const KEY = 'leadflow.tokens'

export const tokenStore = {
  get: () => {
    try { return JSON.parse(localStorage.getItem(KEY)) } catch { return null }
  },
  set: (t) => localStorage.setItem(KEY, JSON.stringify(t)),
  clear: () => localStorage.removeItem(KEY),
}

const api = axios.create({ baseURL, headers: { 'Content-Type': 'application/json' } })

api.interceptors.request.use((config) => {
  const t = tokenStore.get()
  if (t?.access) config.headers.Authorization = `Bearer ${t.access}`
  return config
})

let refreshing = null
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config
    const tokens = tokenStore.get()
    const isAuthCall = original?.url?.startsWith('/auth/')
    if (error.response?.status === 401 && !original._retry && !isAuthCall && tokens?.refresh) {
      original._retry = true
      try {
        refreshing ??= axios.post(`${baseURL}/auth/refresh`, { refresh: tokens.refresh }).finally(() => { refreshing = null })
        const res = await refreshing
        const d = res.data.data
        tokenStore.set({ access: d.access, refresh: d.refresh || tokens.refresh })
        original.headers.Authorization = `Bearer ${d.access}`
        return api(original)
      } catch {
        tokenStore.clear()
        window.dispatchEvent(new Event('leadflow:logout'))
      }
    }
    return Promise.reject(error)
  },
)

export default api
