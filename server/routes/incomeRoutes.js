const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { createIncome, getIncome, updateIncome, deleteIncome } = require('../controllers/incomeController');

/** Protected CRUD endpoints for the authenticated user's income records. */
const router = express.Router();
router.use(requireAuth);
router.route('/').post(createIncome).get(getIncome);
router.route('/:id').put(updateIncome).delete(deleteIncome);
module.exports = router;
