// Shared transaction form validation for income and expenses.
export function validateTransaction(values, { categoryLabel = 'transaction', categories = [] } = {}) {
  const category = String(values.category || '').trim();
  if (!category) return `Please select a ${categoryLabel} category.`;
  if (!categories.includes(category)) return 'Please select a valid category.';
  if (!values.amount || Number(values.amount) <= 0) return 'Amount must be greater than 0.';
  if (!values.date) return 'Please select a date.';
  if ((values.description || '').trim().length > 250) return 'Description cannot exceed 250 characters.';
  return '';
}
