const mongoose = require('mongoose');

/** Stores a single income record owned by one authenticated user. */
const incomeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  category: { type: String, required: true, enum: ['Salary', 'Freelancing', 'Business', 'Investments', 'Gift', 'Bonus', 'Other'] },
  amount: { type: Number, required: true, min: 0.01 },
  description: { type: String, trim: true, maxlength: 250, default: '' },
  date: { type: Date, required: true },
}, { timestamps: true });

incomeSchema.index({ user: 1, date: -1 });
incomeSchema.index({ user: 1, category: 1, date: -1 });

module.exports = mongoose.model('Income', incomeSchema);
