import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, CirclePlus, Edit3, IndianRupee, LoaderCircle, RefreshCw, SlidersHorizontal, Tag, Trash2, Type, WalletCards, X } from 'lucide-react';
import Button from '../components/ui/Button';
import ExpenseCategoriesChart from '../../charts/expenses/ExpenseCategoriesChart';
import { expenseService } from '../services/expenseService';
import { calculateExpenseSummary, formatCurrency, formatDate, getMonthLabel } from '../utils/calculations/expenseCalculations';
import { validateExpense, expenseCategories } from '../utils/validators/expenseValidator';

const buildExpenseComparisonChartData = (records = []) => {
  const totals = (Array.isArray(records) ? records : []).reduce((accumulator, record) => {
    const category = record.category || 'Other';
    const amount = Number(record.amount) || 0;
    accumulator[category] = (accumulator[category] || 0) + amount;
    return accumulator;
  }, {});

  return Object.entries(totals)
    .map(([name, value]) => ({ name, value }))
    .sort((left, right) => right.value - left.value);
};

const buildExpenseFrequencyChartData = (records = [], month = '') => {
  const safeRecords = Array.isArray(records) ? records : [];
  if (!month) return [];

  const [year, monthNumber] = month.split('-').map(Number);
  if (Number.isNaN(year) || Number.isNaN(monthNumber)) return [];

  const daysInMonth = new Date(year, monthNumber, 0).getDate();
  const weekCount = Math.max(1, Math.ceil(daysInMonth / 7));
  const counts = Array.from({ length: weekCount }, () => 0);

  safeRecords.forEach((record) => {
    const date = new Date(record.date);
    if (Number.isNaN(date.getTime())) return;

    const day = date.getDate();
    const weekIndex = Math.min(Math.max(Math.ceil(day / 7), 1), weekCount) - 1;
    counts[weekIndex] += 1;
  });

  return counts.map((value, index) => ({ name: `Week ${index + 1}`, value }));
};

const buildWeeklyExpenseAmountChartData = (records = [], month = '') => {
  const safeRecords = Array.isArray(records) ? records : [];
  if (!month) return [];

  const [year, monthNumber] = month.split('-').map(Number);
  if (Number.isNaN(year) || Number.isNaN(monthNumber)) return [];

  const daysInMonth = new Date(year, monthNumber, 0).getDate();
  const weekCount = Math.max(1, Math.ceil(daysInMonth / 7));
  const totals = Array.from({ length: weekCount }, () => 0);

  safeRecords.forEach((record) => {
    const date = new Date(record.date);
    if (Number.isNaN(date.getTime())) return;

    const day = date.getDate();
    const weekIndex = Math.min(Math.max(Math.ceil(day / 7), 1), weekCount) - 1;
    totals[weekIndex] += Number(record.amount) || 0;
  });

  return totals.map((value, index) => ({ name: `Week ${index + 1}`, value }));
};

const initialForm = () => ({ category: '', amount: '', description: '', date: new Date().toISOString().slice(0, 10) });
const initialFilters = { categories: [], description: '', amountMin: '', amountMax: '', dateFrom: '', dateTo: '', sort: 'latest' };
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

export default function ExpensesPage() {
  const [month, setMonth] = useState(() => getStoredMonth('fintrack_expenses_month', monthKey(new Date())));
  const [records, setRecords] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterView, setFilterView] = useState('categories');
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [selectedYear, selectedMonth] = month.split('-').map(Number);
  const years = Array.from({ length: 17 }, (_, index) => new Date().getFullYear() - 8 + index);
  const selectMonth = (monthNumber) => { setPage(1); setMonth(`${selectedYear}-${String(monthNumber).padStart(2, '0')}`); };
  const selectYear = (year) => { setPage(1); setMonth(`${year}-${String(selectedMonth).padStart(2, '0')}`); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await expenseService.list({ month, sort: filters.sort });
      setRecords(data.expenses);
    } catch (error) {
      setToast({ type: 'error', text: error.response?.data?.message || 'Could not load expense records.' });
    } finally {
      setLoading(false);
    }
  }, [month, filters.sort]);

  useEffect(() => {
    const requestId = window.setTimeout(load, 0);
    return () => window.clearTimeout(requestId);
  }, [load]);

  useEffect(() => {
    window.localStorage.setItem('fintrack_expenses_month', month);
  }, [month]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3600);
    return () => clearTimeout(timer);
  }, [toast]);

  const monthlySummary = useMemo(() => calculateExpenseSummary(records), [records]);
  const expenseCategoriesData = useMemo(() => buildExpenseComparisonChartData(records), [records]);
  const expenseFrequencyData = useMemo(() => buildExpenseFrequencyChartData(records, month), [records, month]);
  const weeklyExpenseAmountData = useMemo(() => buildWeeklyExpenseAmountChartData(records, month), [records, month]);
  const filteredRecords = useMemo(() => records.filter((record) => {
    const amount = Number(record.amount);
    const date = new Date(record.date);
    return (!filters.categories.length || filters.categories.includes(record.category))
      && (!filters.description || (record.description || '').toLowerCase().includes(filters.description.trim().toLowerCase()))
      && (!filters.amountMin || amount >= Number(filters.amountMin))
      && (!filters.amountMax || amount <= Number(filters.amountMax))
      && (!filters.dateFrom || date >= new Date(`${filters.dateFrom}T00:00:00`))
      && (!filters.dateTo || date <= new Date(`${filters.dateTo}T23:59:59.999`));
  }), [records, filters]);
  const viewSummary = useMemo(() => calculateExpenseSummary(filteredRecords), [filteredRecords]);
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const appliedFilterChips = [];
  if (filters.categories.length) appliedFilterChips.push({ label: `Categories: ${filters.categories.join(', ')}`, key: 'categories' });
  if (filters.description) appliedFilterChips.push({ label: `Description: ${filters.description}`, key: 'description' });
  if (filters.amountMin || filters.amountMax) appliedFilterChips.push({ label: `Amount: ${filters.amountMin || '0'}–${filters.amountMax || '∞'}`, key: 'amount' });
  if (filters.dateFrom || filters.dateTo) appliedFilterChips.push({ label: `Date: ${filters.dateFrom || 'Any'} – ${filters.dateTo || 'Any'}`, key: 'date' });

  const hasFilters = appliedFilterChips.length > 0;
  const isEmptyMonth = !loading && filteredRecords.length === 0 && !hasFilters;
  const isNoMatch = !loading && filteredRecords.length === 0 && hasFilters;

  const handleFilterChange = (key, value) => { setPage(1); setFilters((current) => ({ ...current, [key]: value })); };
  const handleClearFilters = () => { setPage(1); setFilters(initialFilters); };
  const openFilters = () => { setDraftFilters(filters); setFilterOpen(true); };
  const applyFilters = () => { setPage(1); setFilters(draftFilters); setFilterOpen(false); };
  const removeFilter = (key) => { setPage(1); setFilters((current) => key === 'amount' ? { ...current, amountMin: '', amountMax: '' } : key === 'date' ? { ...current, dateFrom: '', dateTo: '' } : key === 'categories' ? { ...current, categories: [] } : { ...current, [key]: '' }); };

  const save = async (values, id) => {
    const error = validateExpense(values);
    if (error) throw new Error(error);

    if (id) await expenseService.update(id, values);
    else await expenseService.create(values);

    setModal(null);
    setToast({ type: 'success', text: id ? 'Expense updated successfully.' : 'Expense added successfully.' });
    load();
  };

  const remove = async (id) => {
    try {
      await expenseService.remove(id);
      setModal(null);
      setToast({ type: 'success', text: 'Expense record deleted.' });
      load();
    } catch (error) {
      setToast({ type: 'error', text: error.response?.data?.message || 'Could not delete expense.' });
    }
  };

  return (
    <div className="income-page">
      <header className="income-header">
        <div>
          <p className="eyebrow">PERSONAL FINANCE</p>
          <h1>Expenses</h1>
          <p>Track every spending category, all in one place.</p>
        </div>
      </header>

      <section className="income-action-row">
        <Button className="primary-action" onClick={() => setModal({ type: 'form', expense: null })}>
          <CirclePlus size={19} /> Add expense
        </Button>
        <div className="month-selection-row">
          <div className="month-heading"><span>EXPENSE PERIOD</span><strong>{getMonthLabel(month)}</strong></div>
          <div className="month-toolbar">
            <button type="button" onClick={() => { setPage(1); setMonth((current) => shiftMonth(current, -1)); }} aria-label="Previous month"><ChevronLeft size={20} /></button>
            <div className="month-picker-wrap" aria-label="Select month and year"><CalendarDays size={16} /><select aria-label="Select month" value={selectedMonth} onChange={(event) => selectMonth(Number(event.target.value))}>{monthNames.map((name, index) => <option value={index + 1} key={name}>{name}</option>)}</select><select aria-label="Select year" value={selectedYear} onChange={(event) => selectYear(Number(event.target.value))}>{years.map((year) => <option key={year}>{year}</option>)}</select></div>
            <button type="button" onClick={() => { setPage(1); setMonth((current) => shiftMonth(current, 1)); }} aria-label="Next month"><ChevronRight size={20} /></button>
            <button type="button" className="refresh-button" onClick={load} aria-label="Refresh expenses"><RefreshCw size={17} /></button>
          </div>
        </div>
      </section>

      <section className="monthly-summary-cards">
        <article>
          <span>Total expenses</span>
          <strong>{formatCurrency(monthlySummary.total)}</strong>
        </article>
        <article>
          <span>Transactions</span>
          <strong>{monthlySummary.count}</strong>
        </article>
        <article>
          <span>Highest expense</span>
          <strong>{formatCurrency(monthlySummary.highest)}</strong>
        </article>
        <article>
          <span>Average expense</span>
          <strong>{formatCurrency(monthlySummary.average)}</strong>
        </article>
      </section>


      <section className="income-query-bar">
        <div className="filter-menu-wrap">
          <button type="button" className={`filter-menu-trigger ${filterOpen ? 'is-open' : ''}`} onClick={() => filterOpen ? setFilterOpen(false) : openFilters()}><SlidersHorizontal size={18} /> Filters {hasFilters && <b>{appliedFilterChips.length}</b>}</button>
          {filterOpen && <FilterMenu activeView={filterView} setActiveView={setFilterView} filters={draftFilters} onChange={(key, value) => setDraftFilters((current) => ({ ...current, [key]: value }))} onApply={applyFilters} onClose={() => setFilterOpen(false)} />}
        </div>
        <div className="filter-chips">{appliedFilterChips.map((chip) => <button key={chip.key} type="button" onClick={() => removeFilter(chip.key)} className="filter-chip">{chip.label} <span>×</span></button>)}</div>
        <div className="sort-actions"><label>Sort By<select value={filters.sort} onChange={(e) => handleFilterChange('sort', e.target.value)}><option value="latest">Latest</option><option value="oldest">Oldest</option><option value="highest">Highest Amount</option><option value="lowest">Lowest Amount</option></select></label>{hasFilters && <button type="button" className="text-button clear-filters" onClick={handleClearFilters}>Clear filters</button>}</div>
      </section>

      <section className="income-panel">
        <div className="income-panel-head">
          <div>
            <h2>Expense activity</h2>
            <p>{loading ? 'Loading transactions…' : `Showing ${filteredRecords.length} matching transaction${filteredRecords.length === 1 ? '' : 's'}`}</p>
          </div>
          {!loading && hasFilters && <p className="result-counter">Showing {filteredRecords.length} matching transaction{filteredRecords.length === 1 ? '' : 's'}</p>}
        </div>

        {loading ? (
          <LoadingRows />
        ) : isEmptyMonth ? (
          <EmptyMonth month={month} onAdd={() => setModal({ type: 'form', expense: null })} />
        ) : isNoMatch ? (
          <NoMatch onClear={handleClearFilters} />
        ) : (
          <>
            <div className="income-table-wrap">
              <table className="income-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {paginatedRecords.map((record) => (
                    <tr key={record._id}>
                      <td>{formatDate(record.date)}</td>
                      <td><span className="category-pill">{record.category}</span></td>
                      <td>{record.description || <em>No description</em>}</td>
                      <td className="income-amount">{formatCurrency(record.amount)}</td>
                      <td>
                        <div className="table-actions">
                          <button onClick={() => setModal({ type: 'form', expense: { ...record, date: record.date.slice(0, 10) } })} aria-label="Edit expense"><Edit3 size={16} /></button>
                          <button className="delete-button" onClick={() => setModal({ type: 'delete', expense: record })} aria-label="Delete expense"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredRecords.length > pageSize && <nav className="table-pagination" aria-label="Expense table pagination"><button type="button" disabled={currentPage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button><span>Page <b>{currentPage}</b> of <b>{totalPages}</b></span><button type="button" disabled={currentPage === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Next</button></nav>}

            <section className="filter-summary-cards">
              <header>
                <p>Summary of displayed results</p>
              </header>
              <article>
                <span>Total expenses</span>
                <strong>{formatCurrency(viewSummary.total)}</strong>
              </article>
              <article>
                <span>Transactions</span>
                <strong>{viewSummary.count}</strong>
              </article>
              <article>
                <span>Highest expense</span>
                <strong>{formatCurrency(viewSummary.highest)}</strong>
              </article>
              <article>
                <span>Average expense</span>
                <strong>{formatCurrency(viewSummary.average)}</strong>
              </article>
            </section>
          </>
        )}
      </section>

      <section className="income-charts-section" aria-label="Expense insights charts">
        <ExpenseCategoriesChart
          data={expenseCategoriesData}
          comparisonData={expenseCategoriesData}
          frequencyData={expenseFrequencyData}
          weeklyAmountData={weeklyExpenseAmountData}
        />
      </section>

      {modal?.type === 'form' && <ExpenseModal expense={modal.expense} onClose={() => setModal(null)} onSave={save} />}
      {modal?.type === 'delete' && <DeleteModal expense={modal.expense} onClose={() => setModal(null)} onConfirm={() => remove(modal.expense._id)} />}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span>{toast.text}</span>
          <button onClick={() => setToast(null)}><X size={16} /></button>
        </div>
      )}
    </div>
  );
}

function EmptyMonth({ month, onAdd }) {
  return (
    <div className="empty-state">
      <span><WalletCards size={28} /></span>
      <h3>You're yet to add expense for this month.</h3>
      <p>No expense has been recorded for {getMonthLabel(month)} yet.</p>
      <Button onClick={onAdd}><CirclePlus size={18} /> Add expense</Button>
    </div>
  );
}

function NoMatch({ onClear }) {
  return (
    <div className="empty-state">
      <span><WalletCards size={28} /></span>
      <h3>No transactions match your current filters.</h3>
      <p>Try modifying or clearing the filters to see results.</p>
      <button type="button" className="text-button" onClick={onClear}>Clear filters</button>
    </div>
  );
}

function FilterMenu({ activeView, setActiveView, filters, onChange, onApply, onClose }) {
  const items = [['categories', 'Category', Tag], ['description', 'Description', Type], ['amount', 'Amount', IndianRupee], ['date', 'Date', CalendarDays]];
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
            <p className="eyebrow">FILTER EXPENSES</p>
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
        {activeView === 'description' && (
          <label className="menu-field">
            Description
            <input autoFocus value={filters.description} onChange={(e) => onChange('description', e.target.value)} placeholder="Match description" />
          </label>
        )}
        {activeView === 'amount' && (
          <div className="menu-field-grid">
            <label className="menu-field">
              Min amount
              <input type="number" min="0" value={filters.amountMin} onChange={(e) => onChange('amountMin', e.target.value)} placeholder="0" />
            </label>
            <label className="menu-field">
              Max amount
              <input type="number" min="0" value={filters.amountMax} onChange={(e) => onChange('amountMax', e.target.value)} placeholder="No limit" />
            </label>
          </div>
        )}
        {activeView === 'date' && (
          <div className="menu-field-grid">
            <label className="menu-field">
              Date from
              <input type="date" value={filters.dateFrom} onChange={(e) => onChange('dateFrom', e.target.value)} />
            </label>
            <label className="menu-field">
              Date to
              <input type="date" value={filters.dateTo} onChange={(e) => onChange('dateTo', e.target.value)} />
            </label>
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

function ExpenseModal({ expense, onClose, onSave }) {
  const [values, setValues] = useState(expense || initialForm());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const update = (e) => setValues({ ...values, [e.target.name]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave(values, expense?._id);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to save expense.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <form className="income-modal" onSubmit={submit}>
        <header>
          <div>
            <p className="eyebrow">{expense ? 'EDIT RECORD' : 'NEW RECORD'}</p>
            <h2>{expense ? 'Edit expense' : 'Add expense'}</h2>
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
            Amount
            <input required name="amount" value={values.amount} onChange={update} type="number" min="0.01" step="0.01" placeholder="0.00" />
          </label>
          <label>
            Transaction date
            <input required name="date" value={values.date} onChange={update} type="date" />
          </label>
          <label className="full-field">
            Description
            <input name="description" value={values.description} onChange={update} maxLength="250" placeholder="Add a note (optional)" />
          </label>
        </div>

        {error && <p className="form-error">{error}</p>}
        <footer>
          <button type="button" className="text-button" onClick={onClose}>Cancel</button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : expense ? 'Save changes' : 'Add expense'}</Button>
        </footer>
      </form>
    </div>
  );
}

function DeleteModal({ expense, onClose, onConfirm }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="confirm-modal">
        <div className="delete-icon"><Trash2 size={21} /></div>
        <h2>Delete this expense?</h2>
        <p>This will permanently remove the {formatCurrency(expense.amount)} {expense.category.toLowerCase()} record.</p>
        <div>
          <button className="text-button" onClick={onClose}>Cancel</button>
          <button className="danger-action" onClick={onConfirm}>Delete record</button>
        </div>
      </div>
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="income-loading">
      <LoaderCircle size={25} />
      <span>Fetching your expense activity…</span>
    </div>
  );
}
