import api from './api';

// Isolates authentication endpoints from React UI components.
export const authService = { signup: (details) => api.post('/auth/signup', details), login: (details) => api.post('/auth/login', details), getMe: () => api.get('/auth/me') };
