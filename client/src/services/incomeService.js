import api from './api';

// Encapsulates all income API calls so components remain focused on presentation.
export const incomeService = { list: (params) => api.get('/income', { params }), create: (payload) => api.post('/income', payload), update: (id, payload) => api.put(`/income/${id}`, payload), remove: (id) => api.delete(`/income/${id}`) };
