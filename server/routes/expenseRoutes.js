const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { createExpense, getExpense, updateExpense, deleteExpense } = require('../controllers/expenseController');

/** Protected CRUD endpoints for the authenticated user's expense records. */
const router = express.Router();
router.use(requireAuth);
router.route('/').post(createExpense).get(getExpense);
router.route('/:id').put(updateExpense).delete(deleteExpense);
module.exports = router;
