const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { getYearlyIncomeExpense } = require('../controllers/dashboardController');

const router = express.Router();
router.use(requireAuth);
router.get('/yearly-income-expenses', getYearlyIncomeExpense);

module.exports = router;
