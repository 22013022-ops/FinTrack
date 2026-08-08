import api from './api';

export const dashboardService = {
  yearlyIncomeExpenses: (year) => api.get('/dashboard/yearly-income-expenses', { params: { year } }),
};
