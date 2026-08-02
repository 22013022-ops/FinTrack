import api from './api';

export const goalService = {
  list: (params) => api.get('/goals', { params }),
  create: (payload) => api.post('/goals', payload),
  update: (id, payload) => api.put(`/goals/${id}`, payload),
  updateSavings: (id, amount) => api.put(`/goals/${id}/savings`, { amount }),
  remove: (id) => api.delete(`/goals/${id}`),
};
