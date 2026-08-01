const mongoose = require('mongoose');
const Budget = require('../models/Budget');

const categories = ['Food', 'Shopping', 'Rent', 'Bills', 'Entertainment', 'Healthcare', 'Education', 'Fuel', 'Travel', 'Other'];

function validateBudget(payload) {
  const { category, monthlyBudget, description = '', month } = payload;
  if (!category || !String(category).trim()) return 'Category is required.';
  if (!categories.includes(String(category).trim())) return 'Please select a valid category.';
  if (monthlyBudget === '' || monthlyBudget === undefined || monthlyBudget === null || Number(monthlyBudget) <= 0 || !Number.isFinite(Number(monthlyBudget))) return 'Monthly budget must be greater than 0.';
  if (!month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(String(month))) return 'Month must use YYYY-MM format.';
  if (String(description).trim().length > 250) return 'Description cannot exceed 250 characters.';
  return null;
}

function cleanBudget(payload) {
  return {
    category: payload.category.trim(),
    monthlyBudget: Number(payload.monthlyBudget),
    description: (payload.description || '').trim(),
    month: String(payload.month).trim(),
  };
}

exports.createBudget = async (req, res, next) => {
  try {
    const message = validateBudget(req.body);
    if (message) return res.status(400).json({ message });
    const budget = await Budget.create({ ...cleanBudget(req.body), user: req.user._id });
    return res.status(201).json({ budget });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'A budget for this category in the selected month already exists.' });
    return next(error);
  }
};

exports.getBudget = async (req, res, next) => {
  try {
    const { month } = req.query;
    const query = { user: req.user._id };
    if (month) {
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(String(month))) return res.status(400).json({ message: 'Month must use YYYY-MM format.' });
      query.month = String(month);
    }
    const budgets = await Budget.find(query).sort({ month: 1, category: 1 }).lean();
    return res.status(200).json({ budgets });
  } catch (error) {
    return next(error);
  }
};

exports.updateBudget = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid budget ID.' });
    const message = validateBudget(req.body);
    if (message) return res.status(400).json({ message });
    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      cleanBudget(req.body),
      { new: true, runValidators: true }
    );
    if (!budget) return res.status(404).json({ message: 'Budget record not found.' });
    return res.status(200).json({ budget });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'A budget for this category in the selected month already exists.' });
    return next(error);
  }
};

exports.deleteBudget = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid budget ID.' });
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!budget) return res.status(404).json({ message: 'Budget record not found.' });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};
