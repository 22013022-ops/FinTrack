const mongoose = require('mongoose');
const Goal = require('../models/Goal');

const categories = ['Emergency Fund', 'Car', 'Vacation', 'House', 'Education', 'Retirement', 'Electronics', 'Investment', 'Other'];

function validateGoal(payload) {
  const { name, targetAmount, targetDate, savedAmount = 0, category = '' } = payload;
  if (!name || !String(name).trim()) return 'Goal name is required.';
  if (String(name).trim().length > 120) return 'Goal name cannot exceed 120 characters.';
  if (targetAmount === '' || targetAmount === undefined || targetAmount === null || Number(targetAmount) <= 0 || !Number.isFinite(Number(targetAmount))) return 'Target amount must be greater than 0.';
  if (!targetDate || Number.isNaN(new Date(targetDate).getTime())) return 'A valid target date is required.';
  if (new Date(targetDate).getTime() < new Date(new Date().toDateString()).getTime()) return 'Target date cannot be in the past.';
  if (savedAmount === '' || savedAmount === undefined || savedAmount === null || Number(savedAmount) < 0 || !Number.isFinite(Number(savedAmount))) return 'Initial saved amount cannot be negative.';
  if (Number(savedAmount) > Number(targetAmount)) return 'Initial saved amount cannot exceed target amount.';
  if (category && !categories.includes(String(category).trim())) return 'Please select a valid category.';
  return null;
}

function validateSavingsUpdate(payload) {
  const { amount } = payload;
  if (amount === '' || amount === undefined || amount === null || !Number.isFinite(Number(amount))) return 'Savings amount must be a valid number.';
  if (Number(amount) === 0) return 'Enter a non-zero amount to update savings.';
  return null;
}

function cleanGoal(payload) {
  return {
    name: String(payload.name).trim(),
    targetAmount: Number(payload.targetAmount),
    targetDate: new Date(payload.targetDate),
    savedAmount: Number(payload.savedAmount || 0),
    category: String(payload.category || '').trim(),
  };
}

exports.createGoal = async (req, res, next) => {
  try {
    const message = validateGoal(req.body);
    if (message) return res.status(400).json({ message });
    const goal = await Goal.create({ ...cleanGoal(req.body), user: req.user._id });
    return res.status(201).json({ goal });
  } catch (error) {
    return next(error);
  }
};

exports.getGoals = async (req, res, next) => {
  try {
    const goals = await Goal.find({ user: req.user._id }).sort({ targetDate: 1, name: 1 }).lean();
    return res.status(200).json({ goals });
  } catch (error) {
    return next(error);
  }
};

exports.updateGoal = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid goal ID.' });
    const message = validateGoal(req.body);
    if (message) return res.status(400).json({ message });
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) return res.status(404).json({ message: 'Goal not found.' });

    const updates = {
      name: String(req.body.name).trim(),
      targetAmount: Number(req.body.targetAmount),
      targetDate: new Date(req.body.targetDate),
      category: String(req.body.category || '').trim(),
      savedAmount: goal.savedAmount,
    };

    goal.set(updates);
    await goal.save();
    return res.status(200).json({ goal });
  } catch (error) {
    return next(error);
  }
};

exports.updateGoalSavings = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid goal ID.' });
    const message = validateSavingsUpdate(req.body);
    if (message) return res.status(400).json({ message });
    const amount = Number(req.body.amount);
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) return res.status(404).json({ message: 'Goal not found.' });

    goal.savedAmount = Math.max(0, goal.savedAmount + amount);
    await goal.save();
    return res.status(200).json({ goal });
  } catch (error) {
    return next(error);
  }
};

exports.deleteGoal = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid goal ID.' });
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!goal) return res.status(404).json({ message: 'Goal not found.' });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};
