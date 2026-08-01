import api from './api';

// Encapsulates all expense API calls so components remain focused on presentation.
export const expenseService = {
  list: (params) => api.get('/expenses', { params }),
  create: (payload) => api.post('/expenses', payload),
  update: (id, payload) => api.put(`/expenses/${id}`, payload),
  remove: (id) => api.delete(`/expenses/${id}`),
};
