const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  targetAmount: { type: Number, required: true, min: 0.01 },
  targetDate: { type: Date, required: true },
  savedAmount: { type: Number, required: true, min: 0, default: 0 },
  category: { type: String, trim: true, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Goal', goalSchema);
