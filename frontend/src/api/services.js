import api from './client'

const unwrap = (p) => p.then((r) => r.data.data)

export const authApi = {
  register: (body) => unwrap(api.post('/auth/register', body)),
  login: (body) => unwrap(api.post('/auth/login', body)),
  me: () => unwrap(api.get('/auth/me')),
}
export const leadsApi = {
  list: (params) => unwrap(api.get('/leads', { params })),
  get: (id) => unwrap(api.get(`/leads/${id}`)),
  create: (body) => unwrap(api.post('/leads', body)),
  update: (id, body) => unwrap(api.patch(`/leads/${id}`, body)),
  remove: (id) => api.delete(`/leads/${id}`),
}
export const activitiesApi = {
  list: (params) => unwrap(api.get('/activities', { params })),
  create: (body) => unwrap(api.post('/activities', body)),
  update: (id, body) => unwrap(api.patch(`/activities/${id}`, body)),
}
export const dashboardApi = { summary: () => unwrap(api.get('/dashboard/summary')) }
