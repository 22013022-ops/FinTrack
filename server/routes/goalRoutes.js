const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { createGoal, getGoals, updateGoal, deleteGoal, updateGoalSavings } = require('../controllers/goalController');

const router = express.Router();
router.use(requireAuth);
router.route('/').post(createGoal).get(getGoals);
router.route('/:id').put(updateGoal).delete(deleteGoal);
router.route('/:id/savings').put(updateGoalSavings);
module.exports = router;
