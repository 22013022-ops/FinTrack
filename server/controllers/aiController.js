const { buildFinancialSummary } = require('../services/aiDataBuilder');
const { generateFinancialInsights } = require('../services/aiService');

exports.generateDashboardInsights = async (req, res, next) => {
  try {
    const { month } = req.body;
    const match = typeof month === 'string' && month.match(/^(\d{4})-(0[1-9]|1[0-2])$/);
    if (!match) return res.status(400).json({ message: 'Month must use YYYY-MM format.' });

    const year = Number(match[1]);
    const selectedMonth = Number(match[2]);
    const financialSummary = await buildFinancialSummary(req.user._id, year, selectedMonth);
    const insights = await generateFinancialInsights(financialSummary);
    return res.status(200).json({ month, insights });
  } catch (error) {
    return next(error);
  }
};
