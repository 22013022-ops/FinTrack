const Income = require('../models/Income');
const Expense = require('../models/Expense');

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const buildYearlyTotals = async (Model, userId, start, end) => {
  const totals = await Model.aggregate([
    { $match: { user: userId, date: { $gte: start, $lt: end } } },
    { $group: { _id: { $month: '$date' }, total: { $sum: '$amount' } } },
  ]);
  return totals.reduce((result, item) => ({ ...result, [item._id]: item.total }), {});
};

const buildYearlyExpenseCategories = async (userId, start, end) => {
  const totals = await Expense.aggregate([
    { $match: { user: userId, date: { $gte: start, $lt: end } } },
    { $group: { _id: { month: { $month: '$date' }, category: '$category' }, total: { $sum: '$amount' } } },
    { $sort: { '_id.category': 1 } },
  ]);
  const categories = [...new Set(totals.map((item) => item._id.category))];
  const monthlyTotals = totals.reduce((result, item) => {
    const month = item._id.month;
    result[month] = { ...(result[month] || {}), [item._id.category]: item.total };
    return result;
  }, {});
  return { categories, monthlyTotals };
};

const buildYearlyIncomeSources = async (userId, start, end) => {
  const totals = await Income.aggregate([
    { $match: { user: userId, date: { $gte: start, $lt: end } } },
    { $group: { _id: { month: { $month: '$date' }, category: '$category' }, total: { $sum: '$amount' } } },
    { $sort: { '_id.category': 1 } },
  ]);
  const sources = [...new Set(totals.map((item) => item._id.category))];
  const monthlyTotals = totals.reduce((result, item) => {
    const month = item._id.month;
    result[month] = { ...(result[month] || {}), [item._id.category]: item.total };
    return result;
  }, {});
  return { sources, monthlyTotals };
};

/** Returns a complete 12-month financial series for one selected year. */
exports.getYearlyIncomeExpense = async (req, res, next) => {
  try {
    const year = Number(req.query.year);
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return res.status(400).json({ message: 'Year must be a valid four-digit year.' });
    }

    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year + 1, 0, 1));
    const [incomeTotals, expenseTotals, categoryTotals, incomeSourceTotals] = await Promise.all([
      buildYearlyTotals(Income, req.user._id, start, end),
      buildYearlyTotals(Expense, req.user._id, start, end),
      buildYearlyExpenseCategories(req.user._id, start, end),
      buildYearlyIncomeSources(req.user._id, start, end),
    ]);

    const months = monthLabels.map((month, index) => ({
      month,
      income: incomeTotals[index + 1] || 0,
      expenses: expenseTotals[index + 1] || 0,
      ...Object.fromEntries(Object.entries(categoryTotals.monthlyTotals[index + 1] || {}).map(([category, total]) => [`expense_${category}`, total])),
      ...Object.fromEntries(Object.entries(incomeSourceTotals.monthlyTotals[index + 1] || {}).map(([source, total]) => [`income_${source}`, total])),
    }));
    return res.status(200).json({ year, months, expenseCategories: categoryTotals.categories, incomeSources: incomeSourceTotals.sources });
  } catch (error) {
    return next(error);
  }
};
