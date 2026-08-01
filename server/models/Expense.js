const mongoose = require('mongoose');

/** Stores a single expense record owned by one authenticated user. */
const expenseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  category: { type: String, required: true, enum: ['Food', 'Shopping', 'Rent', 'Bills', 'Entertainment', 'Healthcare', 'Education', 'Fuel', 'Travel', 'Other'] },
  amount: { type: Number, required: true, min: 0.01 },
  description: { type: String, trim: true, maxlength: 250, default: '' },
  date: { type: Date, required: true },
}, { timestamps: true });

expenseSchema.index({ user: 1, date: -1 });
expenseSchema.index({ user: 1, category: 1, date: -1 });

module.exports = mongoose.model('Expense', expenseSchema);
