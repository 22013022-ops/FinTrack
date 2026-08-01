const mongoose = require('mongoose');
const Income = require('../models/Income');

const categories = ['Salary', 'Freelancing', 'Business', 'Investments', 'Gift', 'Bonus', 'Other'];
const sortOptions = { latest: { date: -1, createdAt: -1 }, oldest: { date: 1, createdAt: 1 }, highest: { amount: -1, date: -1 }, lowest: { amount: 1, date: -1 } };

function validateIncome(payload) {
  const { category, amount, date, description = '' } = payload;
  if (!category || !String(category).trim()) return 'Category is required.';
  if (!categories.includes(String(category).trim())) return 'Please select a valid category.';
  if (amount === '' || amount === undefined || amount === null || Number(amount) <= 0 || !Number.isFinite(Number(amount))) return 'Amount must be greater than 0.';
  if (!date || Number.isNaN(new Date(date).getTime())) return 'A valid date is required.';
  if (String(description).trim().length > 250) return 'Description cannot exceed 250 characters.';
  return null;
}

function cleanIncome(payload) {
  return {
    category: payload.category.trim(),
    amount: Number(payload.amount),
    description: (payload.description || '').trim(),
    date: new Date(payload.date),
  };
}

function parseFilterDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Creates a new income record for the authenticated user. */
exports.createIncome = async (req, res, next) => {
  try {
    const message = validateIncome(req.body);
    if (message) return res.status(400).json({ message });
    const income = await Income.create({ ...cleanIncome(req.body), user: req.user._id });
    return res.status(201).json({ income });
  } catch (error) {
    return next(error);
  }
};

/** Lists only the caller's income records for one selected month, with optional server-side filtering. */
exports.getIncome = async (req, res, next) => {
  try {
    const { month, category, description = '', amountMin, amountMax, dateFrom, dateTo, sort = 'latest' } = req.query;
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month || '')) return res.status(400).json({ message: 'Month must use YYYY-MM format.' });
    const [year, monthNumber] = month.split('-').map(Number);
    const start = new Date(Date.UTC(year, monthNumber - 1, 1));
    const end = new Date(Date.UTC(year, monthNumber, 1));
    const query = { user: req.user._id, date: { $gte: start, $lt: end } };

    if (category && categories.includes(category)) query.category = category;
    if (description.trim()) query.description = { $regex: description.trim(), $options: 'i' };

    const min = amountMin !== undefined && amountMin !== '' ? Number(amountMin) : null;
    const max = amountMax !== undefined && amountMax !== '' ? Number(amountMax) : null;
    if (min !== null || max !== null) {
      query.amount = {};
      if (min !== null && Number.isFinite(min)) query.amount.$gte = min;
      if (max !== null && Number.isFinite(max)) query.amount.$lte = max;
      if (query.amount.$gte !== undefined && query.amount.$lte !== undefined && query.amount.$gte > query.amount.$lte) {
        return res.status(400).json({ message: 'Minimum amount cannot exceed maximum amount.' });
      }
    }

    const from = dateFrom ? parseFilterDate(dateFrom) : null;
    const to = dateTo ? parseFilterDate(dateTo) : null;
    if (from || to) {
      query.date = query.date || {};
      if (from) query.date.$gte = from;
      if (to) query.date.$lte = to;
      if (query.date.$gte && query.date.$lte && query.date.$gte > query.date.$lte) {
        return res.status(400).json({ message: 'Start date cannot be later than end date.' });
      }
    }

    const income = await Income.find(query).sort(sortOptions[sort] || sortOptions.latest).lean();
    return res.status(200).json({ income });
  } catch (error) {
    return next(error);
  }
};

/** Updates one record only when it belongs to the authenticated user. */
exports.updateIncome = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid income record ID.' });
    const message = validateIncome(req.body);
    if (message) return res.status(400).json({ message });
    const income = await Income.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      cleanIncome(req.body),
      { new: true, runValidators: true }
    );
    if (!income) return res.status(404).json({ message: 'Income record not found.' });
    return res.status(200).json({ income });
  } catch (error) {
    return next(error);
  }
};

/** Deletes one record only when it belongs to the authenticated user. */
exports.deleteIncome = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid income record ID.' });
    const income = await Income.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!income) return res.status(404).json({ message: 'Income record not found.' });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};
