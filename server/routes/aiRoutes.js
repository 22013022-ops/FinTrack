const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { generateDashboardInsights } = require('../controllers/aiController');

const router = express.Router();
router.use(requireAuth);
router.post('/dashboard-insights', generateDashboardInsights);

module.exports = router;
