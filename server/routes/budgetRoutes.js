const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { createBudget, getBudget, updateBudget, deleteBudget } = require('../controllers/budgetController');

const router = express.Router();
router.use(requireAuth);
router.route('/').post(createBudget).get(getBudget);
router.route('/:id').put(updateBudget).delete(deleteBudget);
module.exports = router;
