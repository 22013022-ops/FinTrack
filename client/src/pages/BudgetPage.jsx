import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, CirclePlus, Edit3, IndianRupee, LoaderCircle, RefreshCw, SlidersHorizontal, Tag, Trash2, Type, WalletCards, X } from 'lucide-react';
import Button from '../components/ui/Button';
import '../styles/budget.css';
import { budgetService } from '../services/budgetService';
import { expenseService } from '../services/expenseService';
import { formatCurrency, getMonthLabel } from '../utils/calculations/expenseCalculations';
import { expenseCategories } from '../utils/validators/expenseValidator';

const initialForm = (monthValue = new Date().toISOString().slice(0, 7)) => ({ category: '', monthlyBudget: '', description: '', month: monthValue });
const monthKey = (date) => date.toISOString().slice(0, 7);
const getStoredMonth = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  const storedMonth = window.localStorage.getItem(key);
  return storedMonth && /^\d{4}-(0[1-9]|1[0-2])$/.test(storedMonth) ? storedMonth : fallback;
};
const shiftMonth = (month, direction) => {
  const [year, monthNumber] = month.split('-').map(Number);
  const totalMonths = year * 12 + (monthNumber - 1) + direction;
  const nextYear = Math.floor(totalMonths / 12);
  const nextMonth = (totalMonths % 12) + 1;
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
};
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const initialFilters = { categories: [], status: 'all', sort: 'highestBudget' };

export default function BudgetPage() {
  const [month, setMonth] = useState(() => getStoredMonth('fintrack_budget_month', monthKey(new Date())));
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(initialFilters);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterView, setFilterView] = useState('categories');
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const pageSize = 6;
  const [selectedYear, selectedMonth] = month.split('-').map(Number);
  const years = Array.from({ length: 17 }, (_, index) => new Date().getFullYear() - 8 + index);
  const selectMonth = (monthNumber) => { setPage(1); setMonth(`${selectedYear}-${String(monthNumber).padStart(2, '0')}`); };
  const selectYear = (year) => { setPage(1); setMonth(`${year}-${String(selectedMonth).padStart(2, '0')}`); };

  const handleFilterChange = (key, value) => { setPage(1); setFilters((current) => ({ ...current, [key]: value })); };
  const handleClearFilters = () => { setPage(1); setFilters(initialFilters); };
  const openFilters = () => { setDraftFilters(filters); setFilterOpen(true); };
  const applyFilters = () => { setPage(1); setFilters(draftFilters); setFilterOpen(false); };
  const removeFilter = (key) => { setPage(1); setFilters((current) => (key === 'categories' ? { ...current, categories: [] } : key === 'status' ? { ...current, status: 'all' } : current)); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [budgetResponse, expenseResponse] = await Promise.all([
        budgetService.list({ month }),
        expenseService.list({ month, sort: 'latest' }),
      ]);
      setBudgets(budgetResponse.data.budgets || []);
      setExpenses(expenseResponse.data.expenses || []);
    } catch (error) {
      setToast({ type: 'error', text: error.response?.data?.message || 'Could not load budgets.' });
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    const requestId = window.setTimeout(load, 0);
    return () => window.clearTimeout(requestId);
  }, [load]);

  useEffect(() => {
    window.localStorage.setItem('fintrack_budget_month', month);
  }, [month]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3600);
    return () => clearTimeout(timer);
  }, [toast]);

  const expensesByCategory = useMemo(() => expenses.reduce((map, expense) => {
    const category = expense.category;
    if (!map[category]) map[category] = 0;
    map[category] += Number(expense.amount);
    return map;
  }, {}), [expenses]);

  const budgetCards = useMemo(() => {
    const categoryBudgets = budgets.filter((budget) => budget.month === month);
    return categoryBudgets.map((budget) => {
      const spent = expensesByCategory[budget.category] || 0;
      const remaining = Number(budget.monthlyBudget) - spent;
      const usagePercentage = Number(budget.monthlyBudget) > 0 ? Math.min((spent / Number(budget.monthlyBudget)) * 100, 1000) : 0;
      let usageColor = 'budget-safe';
      if (usagePercentage >= 100) usageColor = 'budget-danger';
      else if (usagePercentage >= 80) usageColor = 'budget-warning';
      return { ...budget, spent, remaining, usagePercentage, usageColor };
    });
  }, [budgets, expensesByCategory, month]);

  const appliedFilterChips = [];
  if (filters.categories.length) appliedFilterChips.push({ label: `Categories: ${filters.categories.join(', ')}`, key: 'categories' });
  if (filters.status && filters.status !== 'all') appliedFilterChips.push({ label: `Status: ${filters.status === 'within' ? 'Within budget' : filters.status === 'near' ? 'Near limit' : 'Exceeded'}`, key: 'status' });

  const hasFilters = appliedFilterChips.length > 0;
  const filteredBudgets = useMemo(() => {
    const matches = budgetCards.filter((budget) => {
      const matchesCategory = !filters.categories.length || filters.categories.includes(budget.category);
      const status = budget.usagePercentage >= 100 ? 'exceeded' : budget.usagePercentage >= 80 ? 'near' : 'within';
      const matchesStatus = !filters.status || filters.status === 'all' || (filters.status === 'within' && status === 'within') || (filters.status === 'near' && status === 'near') || (filters.status === 'exceeded' && status === 'exceeded');
      return matchesCategory && matchesStatus;
    });

    const sorted = [...matches];
    switch (filters.sort) {
      case 'highestBudget': sorted.sort((a, b) => Number(b.monthlyBudget) - Number(a.monthlyBudget)); break;
      case 'lowestBudget': sorted.sort((a, b) => Number(a.monthlyBudget) - Number(b.monthlyBudget)); break;
      case 'highestUsage': sorted.sort((a, b) => Number(b.usagePercentage) - Number(a.usagePercentage)); break;
      case 'lowestUsage': sorted.sort((a, b) => Number(a.usagePercentage) - Number(b.usagePercentage)); break;
      case 'mostRemaining': sorted.sort((a, b) => Number(b.remaining) - Number(a.remaining)); break;
      case 'leastRemaining': sorted.sort((a, b) => Number(a.remaining) - Number(b.remaining)); break;
      case 'categoryAsc': sorted.sort((a, b) => a.category.localeCompare(b.category)); break;
      case 'categoryDesc': sorted.sort((a, b) => b.category.localeCompare(a.category)); break;
      default: break;
    }
    return sorted;
  }, [budgetCards, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredBudgets.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedCards = filteredBudgets.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const isEmptyMonth = !loading && filteredBudgets.length === 0 && !hasFilters;
  const isNoMatch = !loading && filteredBudgets.length === 0 && hasFilters;

  const save = async (values, id) => {
    const error = validateBudget(values);
    if (error) throw new Error(error);
    const payload = { ...values, month: values.month || month };
    if (id) await budgetService.update(id, payload);
    else await budgetService.create(payload);
    setModal(null);
    setToast({ type: 'success', text: id ? 'Budget updated successfully.' : 'Budget added successfully.' });
    load();
  };

  const remove = async (id) => {
    try {
      await budgetService.remove(id);
      setModal(null);
      setToast({ type: 'success', text: 'Budget removed.' });
      load();
    } catch (error) {
      setToast({ type: 'error', text: error.response?.data?.message || 'Could not delete budget.' });
    }
  };

  return (
    <div className="income-page">
      <header className="income-header">
        <div>
          <p className="eyebrow">PERSONAL FINANCE</p>
          <h1>Budgets</h1>
          <p>Plan monthly limits for every spending category.</p>
        </div>
      </header>

      <section className="income-action-row">
        <Button className="primary-action" onClick={() => setModal({ type: 'form', budget: null })}>
          <CirclePlus size={19} /> Add budget
        </Button>
        <div className="month-selection-row">
          <div className="month-heading"><span>BUDGET PERIOD</span><strong>{getMonthLabel(month)}</strong></div>
          <div className="month-toolbar">
            <button type="button" onClick={() => { setPage(1); setMonth((current) => shiftMonth(current, -1)); }} aria-label="Previous month"><ChevronLeft size={20} /></button>
            <div className="month-picker-wrap" aria-label="Select month and year"><CalendarDays size={16} /><select aria-label="Select month" value={selectedMonth} onChange={(event) => selectMonth(Number(event.target.value))}>{monthNames.map((name, index) => <option value={index + 1} key={name}>{name}</option>)}</select><select aria-label="Select year" value={selectedYear} onChange={(event) => selectYear(Number(event.target.value))}>{years.map((year) => <option key={year}>{year}</option>)}</select></div>
            <button type="button" onClick={() => { setPage(1); setMonth((current) => shiftMonth(current, 1)); }} aria-label="Next month"><ChevronRight size={20} /></button>
            <button type="button" className="refresh-button" onClick={load} aria-label="Refresh budgets"><RefreshCw size={17} /></button>
          </div>
        </div>
      </section>

      <section className="income-query-bar">
        <div className="filter-menu-wrap">
          <button type="button" className={`filter-menu-trigger ${filterOpen ? 'is-open' : ''}`} onClick={() => filterOpen ? setFilterOpen(false) : openFilters()}><SlidersHorizontal size={18} /> Filters {hasFilters && <b>{appliedFilterChips.length}</b>}</button>
          {filterOpen && <FilterMenu activeView={filterView} setActiveView={setFilterView} filters={draftFilters} onChange={(key, value) => setDraftFilters((current) => ({ ...current, [key]: value }))} onApply={applyFilters} onClose={() => setFilterOpen(false)} />}
        </div>
        <div className="filter-chips">{appliedFilterChips.map((chip) => <button key={chip.key} type="button" onClick={() => removeFilter(chip.key)} className="filter-chip">{chip.label} <span>×</span></button>)}</div>
        <div className="sort-actions">
          <label>
            Sort By
            <select value={filters.sort} onChange={(event) => handleFilterChange('sort', event.target.value)}>
              <option value="highestBudget">Highest Budget</option>
              <option value="lowestBudget">Lowest Budget</option>
              <option value="highestUsage">Highest Usage %</option>
              <option value="lowestUsage">Lowest Usage %</option>
              <option value="mostRemaining">Most Remaining Budget</option>
              <option value="leastRemaining">Least Remaining Budget</option>
              <option value="categoryAsc">Category (A–Z)</option>
              <option value="categoryDesc">Category (Z–A)</option>
            </select>
          </label>
        </div>
      </section>

      <section className="income-panel">
        <div className="income-panel-head">
          <div>
            <h2>Budget overview</h2>
            <p>{loading ? 'Loading budgets…' : `Showing ${filteredBudgets.length} ${hasFilters ? 'matching ' : ''}budget${filteredBudgets.length === 1 ? '' : 's'} for ${getMonthLabel(month)}`}</p>
          </div>
        </div>

        {loading ? (
          <LoadingRows />
        ) : isEmptyMonth ? (
          <EmptyMonth month={month} onAdd={() => setModal({ type: 'form', budget: null })} />
        ) : isNoMatch ? (
          <NoMatch onClear={handleClearFilters} />
        ) : (
          <>
            <div className="budget-cards-grid">
              {paginatedCards.map((budget) => {
                const usageLabel = budget.usagePercentage >= 100 ? 'Exceeded' : budget.usagePercentage >= 80 ? 'Near limit' : 'Within limit';
                const progressColor = budget.usagePercentage >= 100 ? 'budget-danger' : budget.usagePercentage >= 80 ? 'budget-warning' : 'budget-safe';
                return (
                  <article className={`budget-card premium ${progressColor}`} key={budget._id}>
                    <div className="budget-card-header">
                      <div>
                        <p className="budget-card-title">{budget.category}</p>
                        <p className="budget-card-subtitle">Monthly budget</p>
                      </div>
                      <div className="budget-card-amount">{formatCurrency(budget.monthlyBudget)}</div>
                    </div>
                    <div className="budget-metrics">
                      <div><span>Amount spent</span><strong>{formatCurrency(budget.spent)}</strong></div>
                      <div><span>Remaining</span><strong>{formatCurrency(budget.remaining)}</strong></div>
                    </div>
                    <div className="budget-usage-row">
                      <div className="budget-percentage"><strong>{budget.usagePercentage.toFixed(0)}%</strong></div>
                      <div className="budget-status">{usageLabel}</div>
                    </div>
                    <div className="progress-bar"><div style={{ width: `${Math.min(budget.usagePercentage, 100)}%` }} className={`progress-fill ${progressColor}`} /></div>
                    <div className="budget-card-actions">
                      <button onClick={() => setModal({ type: 'form', budget })} aria-label="Edit budget"><Edit3 size={16} /></button>
                      <button className="delete-button" onClick={() => setModal({ type: 'delete', budget })} aria-label="Delete budget"><Trash2 size={16} /></button>
                    </div>
                  </article>
                );
              })}
            </div>
            {filteredBudgets.length > pageSize && <nav className="table-pagination" aria-label="Budget pagination"><button type="button" disabled={currentPage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button><span>Page <b>{currentPage}</b> of <b>{totalPages}</b></span><button type="button" disabled={currentPage === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Next</button></nav>}
          </>
        )}
      </section>

      {modal?.type === 'form' && <BudgetModal budget={modal.budget} month={month} onClose={() => setModal(null)} onSave={save} />}
      {modal?.type === 'delete' && <DeleteModal budget={modal.budget} onClose={() => setModal(null)} onConfirm={() => remove(modal.budget._id)} />}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span>{toast.text}</span>
          <button onClick={() => setToast(null)}><X size={16} /></button>
        </div>
      )}
    </div>
  );
}

function NoMatch({ onClear }) {
  return (
    <div className="empty-state">
      <span><WalletCards size={28} /></span>
      <h3>No budgets match your current filters.</h3>
      <p>Try modifying or clearing the filters to see results.</p>
      <button type="button" className="text-button" onClick={onClear}>Clear filters</button>
    </div>
  );
}

function EmptyMonth({ month, onAdd }) {
  return (
    <div className="empty-state">
      <span><WalletCards size={28} /></span>
      <h3>No budgets set for this month yet.</h3>
      <p>Create a budget for {getMonthLabel(month)} to start tracking your spending.</p>
      <Button onClick={onAdd}><CirclePlus size={18} /> Add budget</Button>
    </div>
  );
}

function BudgetModal({ budget, month, onClose, onSave }) {
  const [values, setValues] = useState(budget || initialForm(month));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const update = (e) => setValues({ ...values, [e.target.name]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave(values, budget?._id);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to save budget.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <form className="income-modal" onSubmit={submit}>
        <header>
          <div>
            <p className="eyebrow">{budget ? 'EDIT RECORD' : 'NEW RECORD'}</p>
            <h2>{budget ? 'Edit budget' : 'Add budget'}</h2>
          </div>
          <button type="button" onClick={onClose}><X size={20} /></button>
        </header>
        <div className="income-form-grid">
          <label>
            Category
            <select required name="category" value={values.category} onChange={update}>
              <option value="">Select category</option>
              {expenseCategories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </label>
          <label>
            Monthly budget amount
            <input required name="monthlyBudget" value={values.monthlyBudget} onChange={update} type="number" min="0.01" step="0.01" placeholder="0.00" />
          </label>
          <label className="full-field">
            Description
            <input name="description" value={values.description} onChange={update} maxLength="250" placeholder="Add a note (optional)" />
          </label>
        </div>
        {error && <p className="form-error">{error}</p>}
        <footer>
          <button type="button" className="text-button" onClick={onClose}>Cancel</button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : budget ? 'Save changes' : 'Add budget'}</Button>
        </footer>
      </form>
    </div>
  );
}

function DeleteModal({ budget, onClose, onConfirm }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="confirm-modal">
        <div className="delete-icon"><Trash2 size={21} /></div>
        <h2>Delete this budget?</h2>
        <p>This will permanently remove the {budget.category} budget.</p>
        <div>
          <button className="text-button" onClick={onClose}>Cancel</button>
          <button className="danger-action" onClick={onConfirm}>Delete budget</button>
        </div>
      </div>
    </div>
  );
}

function FilterMenu({ activeView, setActiveView, filters, onChange, onApply, onClose }) {
  const items = [['categories', 'Category', Tag], ['status', 'Status', SlidersHorizontal]];
  const title = items.find(([key]) => key === activeView)?.[1];

  return (
    <div className="filter-menu">
      <aside>
        {items.map(([key, label, Icon]) => (
          <button type="button" key={key} onClick={() => setActiveView(key)} className={activeView === key ? 'active' : ''}>
            <Icon size={18} />
            <span>{label}</span>
            {(key === 'categories' && filters.categories.length) || (key === 'description' && filters.description) || (key === 'amount' && (filters.amountMin || filters.amountMax)) || (key === 'date' && (filters.dateFrom || filters.dateTo)) ? <i>✓</i> : null}
          </button>
        ))}
      </aside>
      <div className="filter-menu-content">
        <header>
          <div>
            <p className="eyebrow">FILTER BUDGETS</p>
            <h3>{title}</h3>
          </div>
          <button type="button" onClick={onClose}><X size={18} /></button>
        </header>
        {activeView === 'categories' && (
          <div className="filter-category-list">
            <button type="button" className={!filters.categories.length ? 'selected' : ''} onClick={() => onChange('categories', [])}>All categories</button>
            {expenseCategories.map((category) => (
              <button type="button" key={category} className={filters.categories.includes(category) ? 'selected' : ''} onClick={() => onChange('categories', filters.categories.includes(category) ? filters.categories.filter((item) => item !== category) : [...filters.categories, category])}>
                <span>{category}</span>
                {filters.categories.includes(category) && <b>✓</b>}
              </button>
            ))}
          </div>
        )}
        {activeView === 'status' && (
          <div className="filter-category-list">
            <button type="button" className={filters.status === 'all' ? 'selected' : ''} onClick={() => onChange('status', 'all')}>All</button>
            <button type="button" className={filters.status === 'within' ? 'selected' : ''} onClick={() => onChange('status', 'within')}>Within budget</button>
            <button type="button" className={filters.status === 'near' ? 'selected' : ''} onClick={() => onChange('status', 'near')}>Near limit</button>
            <button type="button" className={filters.status === 'exceeded' ? 'selected' : ''} onClick={() => onChange('status', 'exceeded')}>Exceeded</button>
          </div>
        )}
        <footer>
          <button type="button" className="text-button" onClick={onClose}>Cancel</button>
          <Button type="button" onClick={onApply}>Apply filters</Button>
        </footer>
      </div>
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="income-loading">
      <LoaderCircle size={25} />
      <span>Fetching your budget overview…</span>
    </div>
  );
}

function validateBudget(values) {
  if (!values.category) return 'Please select a budget category.';
  if (!values.monthlyBudget || Number(values.monthlyBudget) <= 0) return 'Monthly budget must be greater than 0.';
  if ((values.description || '').trim().length > 250) return 'Description cannot exceed 250 characters.';
  return '';
}
