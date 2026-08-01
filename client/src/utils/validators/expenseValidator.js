import { validateTransaction } from './transactionValidator';

export const expenseCategories = [
  'Food',
  'Shopping',
  'Rent',
  'Bills',
  'Entertainment',
  'Healthcare',
  'Education',
  'Fuel',
  'Travel',
  'Other',
];

export function validateExpense(values) {
  return validateTransaction(values, { categoryLabel: 'expense', categories: expenseCategories });
}
