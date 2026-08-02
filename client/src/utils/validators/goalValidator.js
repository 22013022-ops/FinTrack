export const goalCategories = [
  'Emergency Fund',
  'Car',
  'Vacation',
  'House',
  'Education',
  'Retirement',
  'Electronics',
  'Investment',
  'Other',
];

export function validateGoal(values) {
  if (!values.name || !String(values.name).trim()) return 'Goal name is required.';
  if (String(values.name).trim().length > 120) return 'Goal name cannot exceed 120 characters.';
  if (!values.targetAmount || Number(values.targetAmount) <= 0) return 'Target amount must be greater than 0.';
  if (!values.targetDate) return 'A valid target date is required.';
  if (Number.isNaN(new Date(values.targetDate).getTime())) return 'A valid target date is required.';
  if (new Date(values.targetDate).getTime() < new Date(new Date().toDateString()).getTime()) return 'Target date cannot be in the past.';
  if (values.savedAmount !== undefined && values.savedAmount !== '' && Number(values.savedAmount) < 0) return 'Initial saved amount cannot be negative.';
  if (values.savedAmount !== undefined && values.savedAmount !== '' && Number(values.savedAmount) > Number(values.targetAmount)) return 'Initial saved amount cannot exceed target amount.';
  if (values.category && !goalCategories.includes(String(values.category).trim())) return 'Please select a valid category.';
  return '';
}
