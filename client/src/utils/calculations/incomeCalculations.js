// Reusable income aggregates; future finance modules can follow this module-per-domain pattern.
//1.Summary
export const calculateIncomeSummary = (records = []) => {
    const safeRecords = Array.isArray(records) ? records : [];
    const amounts = safeRecords.map((record) => Number(record.amount));
    const total = amounts.reduce((sum, amount) => sum + amount, 0);

    return { total, count: safeRecords.length, highest: amounts.length ? Math.max(...amounts) : 0, average: amounts.length ? total / amounts.length : 0 };
};

//2. Formatting
export const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

export const formatDate = (date) => new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date));

export const getMonthLabel = (month) => new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(new Date(`${month}-01T00:00:00`));


//3. Chart Data
export const buildIncomeSourcesChartData = (records = []) => {
    const safeRecords = Array.isArray(records) ? records : [];
    const totals = safeRecords.reduce((accumulator, record) => {
        const category = record.category || 'Other';
        const amount = Number(record.amount) || 0;
        accumulator[category] = (accumulator[category] || 0) + amount;
        return accumulator;
    }, {});

    return Object.entries(totals)
        .map(([name, value]) => ({ name, value }))
        .sort((left, right) => right.value - left.value);
};
