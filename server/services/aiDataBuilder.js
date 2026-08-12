const Income = require('../models/Income');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const Goal = require('../models/Goal');

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const round = (value) => Math.round((Number(value) || 0) * 100) / 100;
const percent = (part, total) => (total > 0 ? round((part / total) * 100) : 0);
const change = (current, previous) => ({ amount: round(current - previous), percentage: previous > 0 ? round(((current - previous) / previous) * 100) : null });

function monthRange(year, month) {
  return {
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 1)),
  };
}

function groupByMonthAndCategory(records, dateField = 'date') {
  return records.reduce((result, record) => {
    const key = new Date(record[dateField]).toISOString().slice(0, 7);
    const category = record.category;
    result[key] = result[key] || {};
    result[key][category] = round((result[key][category] || 0) + Number(record.amount || record.monthlyBudget || 0));
    return result;
  }, {});
}

function categoryMetrics(categories, total, previousCategories) {
  return Object.entries(categories).sort(([left], [right]) => left.localeCompare(right)).map(([category, amount]) => ({
    category,
    totalAmount: round(amount),
    percentageOfTotal: percent(amount, total),
    changeFromPreviousMonth: change(amount, previousCategories[category] || 0),
  }));
}

/** Builds aggregate-only financial context from January through the requested month. */
exports.buildFinancialSummary = async (userId, year, selectedMonth) => {
  const start = monthRange(year, 1).start;
  const end = monthRange(year, selectedMonth).end;
  const [incomeRecords, expenseRecords, budgets, goals] = await Promise.all([
    Income.find({ user: userId, date: { $gte: start, $lt: end } }).select('category amount date -_id').lean(),
    Expense.find({ user: userId, date: { $gte: start, $lt: end } }).select('category amount date -_id').lean(),
    Budget.find({ user: userId, month: { $gte: `${year}-01`, $lte: `${year}-${String(selectedMonth).padStart(2, '0')}` } }).select('category monthlyBudget month -_id').lean(),
    Goal.find({ user: userId }).select('name targetAmount savedAmount targetDate category -_id').lean(),
  ]);

  const incomeByMonth = groupByMonthAndCategory(incomeRecords);
  const expensesByMonth = groupByMonthAndCategory(expenseRecords);
  const budgetsByMonth = budgets.reduce((result, budget) => {
    result[budget.month] = result[budget.month] || {};
    result[budget.month][budget.category] = round((result[budget.month][budget.category] || 0) + Number(budget.monthlyBudget));
    return result;
  }, {});

  const months = [];
  for (let month = 1; month <= selectedMonth; month += 1) {
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const previousKey = `${year}-${String(month - 1).padStart(2, '0')}`;
    const incomeCategories = incomeByMonth[monthKey] || {};
    const expenseCategories = expensesByMonth[monthKey] || {};
    const budgetCategories = budgetsByMonth[monthKey] || {};
    const totalIncome = round(Object.values(incomeCategories).reduce((sum, amount) => sum + amount, 0));
    const totalExpenses = round(Object.values(expenseCategories).reduce((sum, amount) => sum + amount, 0));
    const totalBudget = round(Object.values(budgetCategories).reduce((sum, amount) => sum + amount, 0));
    const previous = months[months.length - 1];
    const categoryBudget = Object.entries(budgetCategories).sort(([left], [right]) => left.localeCompare(right)).map(([category, budgetAmount]) => {
      const actualSpending = round(expenseCategories[category] || 0);
      const utilizationPercentage = percent(actualSpending, budgetAmount);
      return { category, budgetAmount, actualSpending, utilizationPercentage, exceeded: actualSpending > budgetAmount, nearLimit: actualSpending <= budgetAmount && utilizationPercentage >= 80 };
    });
    const totalBudgetSpent = round(categoryBudget.reduce((sum, item) => sum + item.actualSpending, 0));

    months.push({
      month: monthKey,
      label: monthNames[month - 1],
      summary: {
        totalIncome,
        totalExpenses,
        totalSavings: round(totalIncome - totalExpenses),
        savingsRate: percent(totalIncome - totalExpenses, totalIncome),
        changeFromPreviousMonth: previous ? {
          income: change(totalIncome, previous.summary.totalIncome),
          expenses: change(totalExpenses, previous.summary.totalExpenses),
          savings: change(totalIncome - totalExpenses, previous.summary.totalSavings),
        } : null,
      },
      incomeSources: categoryMetrics(incomeCategories, totalIncome, incomeByMonth[previousKey] || {}),
      expenseCategories: categoryMetrics(expenseCategories, totalExpenses, expensesByMonth[previousKey] || {}),
      budget: {
        totalBudget,
        totalSpent: totalBudgetSpent,
        overallUtilizationPercentage: percent(totalBudgetSpent, totalBudget),
        categories: categoryBudget,
        exceededCategories: categoryBudget.filter((item) => item.exceeded).map((item) => item.category),
        nearLimitCategories: categoryBudget.filter((item) => item.nearLimit).map((item) => item.category),
      },
    });
  }

  const selectedMonthEnd = monthRange(year, selectedMonth).end;
  return {
    selectedPeriod: `${year}-${String(selectedMonth).padStart(2, '0')}`,
    currency: 'INR',
    months,
    goals: goals.map((goal) => {
      const targetAmount = round(goal.targetAmount);
      const savedAmount = round(goal.savedAmount);
      const targetDate = goal.targetDate ? new Date(goal.targetDate).toISOString().slice(0, 10) : null;
      const status = savedAmount >= targetAmount ? 'completed' : targetDate && new Date(goal.targetDate) < selectedMonthEnd ? 'overdue' : 'in-progress';
      return { name: goal.name, targetAmount, currentSavedAmount: savedAmount, progressPercentage: percent(savedAmount, targetAmount), monthlyContribution: 0, monthlyContributionNote: 'Not tracked separately in this application.', targetDate, status };
    }),
  };
};
