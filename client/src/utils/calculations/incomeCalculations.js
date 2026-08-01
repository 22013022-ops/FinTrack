// Reusable income aggregates; future finance modules can follow this module-per-domain pattern.
export const calculateIncomeSummary = (records) => { const amounts = records.map((record) => Number(record.amount)); const total = amounts.reduce((sum, amount) => sum + amount, 0); return { total, count: records.length, highest: amounts.length ? Math.max(...amounts) : 0, average: amounts.length ? total / amounts.length : 0 }; };
export const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
export const formatDate = (date) => new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date));
export const getMonthLabel = (month) => new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(new Date(`${month}-01T00:00:00`));
