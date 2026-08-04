import { useEffect, useMemo, useState } from 'react';
import { Plus, Filter, Search, Trash2, Edit, ArrowUpDown, Tag, SlidersHorizontal, X } from 'lucide-react';
import { goalService } from '../services/goalService';
import { validateGoal, goalCategories } from '../utils/validators/goalValidator';
import GoalCharts from '../../charts/goals/GoalCharts';
import '../styles/budget.css';
import '../styles/goals.css';

const statusOptions = [
  { value: 'not started', label: 'Not Started' },
  { value: 'on track', label: 'On Track' },
  { value: 'near track', label: 'Near Track' },
  { value: 'completed', label: 'Completed' },
];

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'targetAmountLow', label: 'Target Amount: Low to High' },
  { value: 'targetAmountHigh', label: 'Target Amount: High to Low' },
  { value: 'targetDateSoon', label: 'Target Date: Soonest' },
  { value: 'targetDateLater', label: 'Target Date: Latest' },
];

const mapGoalStatus = (goal) => {
  const savedAmount = Number(goal.savedAmount);
  const targetAmount = Number(goal.targetAmount);
  const progress = targetAmount === 0 ? 100 : Math.min((savedAmount / targetAmount) * 100, 100);

  if (progress === 100) return 'completed';
  if (progress === 0) return 'not started';
  if (progress >= 75) return 'near track';
  return 'on track';
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState([]);
  const [sortKey, setSortKey] = useState('newest');
  const [showFilter, setShowFilter] = useState(false);
  const [filterView, setFilterView] = useState('category');
  const [draftFilters, setDraftFilters] = useState({ category: [], status: [] });
  const [showModal, setShowModal] = useState(false);
  const [showSavingsModal, setShowSavingsModal] = useState(false);
  const [activeGoal, setActiveGoal] = useState(null);
  const [savingsGoal, setSavingsGoal] = useState(null);
  const [savingsAmount, setSavingsAmount] = useState('');
  const [savingsError, setSavingsError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [modalValues, setModalValues] = useState({
    name: '',
    category: '',
    targetAmount: '',
    savedAmount: 0,
    targetDate: '',
  });
  const [modalError, setModalError] = useState('');

  const filteredGoals = useMemo(() => {
    return goals
      .filter((goal) => {
        const nameMatch = goal.name.toLowerCase().includes(filterQuery.toLowerCase());
        const status = mapGoalStatus(goal);
        const categoryMatch = selectedCategory.length ? selectedCategory.includes(goal.category) : true;
        const statusMatch = selectedStatus.length ? selectedStatus.includes(status) : true;
        return nameMatch && categoryMatch && statusMatch;
      })
      .sort((a, b) => {
        switch (sortKey) {
          case 'oldest':
            return new Date(a.createdAt) - new Date(b.createdAt);
          case 'targetAmountLow':
            return Number(a.targetAmount) - Number(b.targetAmount);
          case 'targetAmountHigh':
            return Number(b.targetAmount) - Number(a.targetAmount);
          case 'targetDateSoon':
            return new Date(a.targetDate) - new Date(b.targetDate);
          case 'targetDateLater':
            return new Date(b.targetDate) - new Date(a.targetDate);
          default:
            return new Date(b.createdAt) - new Date(a.createdAt);
        }
      });
  }, [goals, filterQuery, selectedCategory, selectedStatus, sortKey]);

  const fetchGoals = async () => {
    setLoading(true);
    setError('');

    try {
      const { data } = await goalService.list();
      setGoals(data.goals || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load goals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const openModal = (goal = null) => {
    if (goal) {
      setModalValues({
        name: goal.name,
        category: goal.category || '',
        targetAmount: goal.targetAmount,
        savedAmount: goal.savedAmount,
        targetDate: goal.targetDate.slice(0, 10),
      });
      setActiveGoal(goal);
    } else {
      setModalValues({ name: '', category: '', targetAmount: '', savedAmount: 0, targetDate: '' });
      setActiveGoal(null);
    }
    setModalError('');
    setShowModal(true);
  };

  const openSavingsModal = (goal) => {
    setSavingsGoal(goal);
    setSavingsAmount('');
    setSavingsError('');
    setShowSavingsModal(true);
  };

  const closeSavingsModal = () => {
    setShowSavingsModal(false);
    setSavingsError('');
    setSavingsAmount('');
    setSavingsGoal(null);
  };

  const handleSavingsSubmit = async (event) => {
    event.preventDefault();
    if (!savingsGoal) return;

    const updateAmount = Number(savingsAmount);
    if (Number.isNaN(updateAmount) || updateAmount === 0) {
      setSavingsError('Enter a positive or negative amount to update savings.');
      return;
    }

    const updatedSavedAmount = Math.max(0, Number(savingsGoal.savedAmount) + updateAmount);

    try {
      await goalService.updateSavings(savingsGoal._id, updateAmount);
      await fetchGoals();
      closeSavingsModal();
    } catch (err) {
      setSavingsError(err?.response?.data?.message || 'Unable to update savings.');
    }
  };

  const openFilterMenu = () => {
    setDraftFilters({ category: selectedCategory, status: selectedStatus });
    setShowFilter(true);
  };

  const toggleDraftFilter = (key, value) => {
    setDraftFilters((current) => {
      if (value === '') {
        return { ...current, [key]: [] };
      }
      const existing = current[key];
      const contains = existing.includes(value);
      return {
        ...current,
        [key]: contains ? existing.filter((item) => item !== value) : [...existing, value],
      };
    });
  };

  const applyFilters = () => {
    setSelectedCategory([...draftFilters.category]);
    setSelectedStatus([...draftFilters.status]);
    setShowFilter(false);
  };

  const clearFilters = () => {
    setSelectedCategory([]);
    setSelectedStatus([]);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateGoal(modalValues);
    if (validationError) {
      setModalError(validationError);
      return;
    }

    try {
      if (activeGoal) {
        await goalService.update(activeGoal._id, modalValues);
      } else {
        await goalService.create(modalValues);
      }
      await fetchGoals();
      closeModal();
    } catch (err) {
      setModalError(err?.response?.data?.message || 'Unable to save goal.');
    }
  };

  const appliedFilterCount = selectedCategory.length + selectedStatus.length;

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await goalService.remove(deleteTarget._id);
      setDeleteTarget(null);
      await fetchGoals();
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to delete goal.');
    }
  };

  function FilterMenu({ activeView, setActiveView, filters, onChange, onApply, onClose }) {
    const items = [
      ['category', 'Category', Tag],
      ['status', 'Status', SlidersHorizontal],
    ];
    const title = items.find(([key]) => key === activeView)?.[1];

    return (
      <div className="filter-menu">
        <aside>
          {items.map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveView(key)}
              className={activeView === key ? 'active' : ''}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </aside>

        <div className="filter-menu-content">
          <header>
            <div>
              <p className="eyebrow">FILTER GOALS</p>
              <h3>{title}</h3>
            </div>
            <button type="button" onClick={onClose}>
              <X size={18} />
            </button>
          </header>

          {activeView === 'category' && (
            <div className="filter-category-list">
              <button
                type="button"
                className={!filters.category.length ? 'selected' : ''}
                onClick={() => onChange('category', '')}
              >
                All categories
              </button>
              {goalCategories.map((category) => {
                const selected = filters.category.includes(category);
                return (
                  <button
                    type="button"
                    key={category}
                    className={selected ? 'selected' : ''}
                    onClick={() => onChange('category', category)}
                  >
                    <span>{category}</span>
                    {selected && <b>✓</b>}
                  </button>
                );
              })}
            </div>
          )}

          {activeView === 'status' && (
            <div className="filter-category-list">
              <button
                type="button"
                className={!filters.status.length ? 'selected' : ''}
                onClick={() => onChange('status', '')}
              >
                All
              </button>
              {statusOptions.map((status) => {
                const selected = filters.status.includes(status.value);
                return (
                  <button
                    type="button"
                    key={status.value}
                    className={selected ? 'selected' : ''}
                    onClick={() => onChange('status', status.value)}
                  >
                    <span>{status.label}</span>
                    {selected && <b>✓</b>}
                  </button>
                );
              })}
            </div>
          )}

          <footer>
            <button type="button" className="text-button" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="button primary" onClick={onApply}>
              Apply filters
            </button>
          </footer>
        </div>
      </div>
    );
  }

  const hasFilters = selectedCategory.length > 0 || selectedStatus.length > 0;

  return (
    <div className="page goals-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Goals</p>
          <h1>Plan your savings roadmap</h1>
          <p className="page-copy">Track your goals, monitor progress, and stay on top of target dates with a polished dashboard.</p>
          <div className="page-header-actions">
            <button type="button" className="button primary" onClick={() => openModal()}>
              <Plus size={16} />
              New Goal
            </button>
          </div>
        </div>
      </header>

      <section className="income-query-bar">
        <div className="filter-menu-wrap">
          <button
            type="button"
            className={`filter-menu-trigger ${showFilter ? 'is-open' : ''}`}
            onClick={openFilterMenu}
          >
            <Filter size={18} />
            Filters
            {appliedFilterCount > 0 && <b>{appliedFilterCount}</b>}
          </button>
          {showFilter && (
            <FilterMenu
              activeView={filterView}
              setActiveView={setFilterView}
              filters={draftFilters}
              onChange={toggleDraftFilter}
              onApply={applyFilters}
              onClose={() => setShowFilter(false)}
            />
          )}
        </div>
        <div className="filter-chips">
          {selectedCategory.length > 0 && (
            <button type="button" className="filter-chip" onClick={() => setSelectedCategory([])}>
              Category: {selectedCategory.join(', ')} <span>×</span>
            </button>
          )}
          {selectedStatus.length > 0 && (
            <button type="button" className="filter-chip" onClick={() => setSelectedStatus([])}>
              Status: {selectedStatus.map((statusValue) => statusOptions.find((status) => status.value === statusValue)?.label || statusValue).join(', ')} <span>×</span>
            </button>
          )}
        </div>
        <div className="sort-actions">
          <label>
            Sort By
            <select value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          {hasFilters && (
            <button type="button" className="text-button clear-filters" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
      </section>

      <section className="goals-search-row">
        <div className="input-group search-box">
          <Search size={18} />
          <input
            type="search"
            placeholder="Search goals"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
          />
        </div>
      </section>

      {error && <div className="error-banner">{error}</div>}

      <section className="goals-overview-panel">
        <div className="goals-overview-header">
          <div>
            <h2>Goals overview</h2>
            <p>Review your active savings targets, progress, and deadlines in one place.</p>
          </div>
        </div>

        <div className="budget-cards-grid">
          {loading ? (
            <div className="empty-state">Loading goals…</div>
          ) : filteredGoals.length === 0 ? (
            <div className="empty-state">
              <p>No goals found.</p>
              <p>Try adjusting filters or add a new savings target.</p>
            </div>
          ) : (
            filteredGoals.map((goal) => {
            const status = mapGoalStatus(goal);
            const progress = Math.min((Number(goal.savedAmount) / Number(goal.targetAmount)) * 100, 100);
            const remainingAmount = Math.max(Number(goal.targetAmount) - Number(goal.savedAmount), 0);
            const dueDate = new Date(goal.targetDate);
            const daysRemaining = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
            const daysRemainingLabel = daysRemaining >= 0 ? `${daysRemaining} days` : `${Math.abs(daysRemaining)} days overdue`;
            const progressColor =
              status === 'completed'
                ? 'budget-completed'
                : status === 'near track'
                ? 'budget-safe'
                : status === 'on track'
                ? 'budget-warning'
                : 'budget-danger';
            return (
              <article className={`budget-card premium ${progressColor}`} key={goal._id}>
                <div className="budget-card-header">
                  <div>
                    <p className="budget-card-title">{goal.name}</p>
                    <p className="budget-card-subtitle">{goal.category || 'General'}</p>
                  </div>
                  <div className="budget-card-amount">{formatCurrency(goal.targetAmount)}</div>
                </div>

                <div className="budget-metrics">
                  <div>
                    <p className="metric-label">Saved amount</p>
                    <p className="metric-value">{formatCurrency(goal.savedAmount)}</p>
                  </div>
                  <div>
                    <p className="metric-label">Remaining amount</p>
                    <p className="metric-value">{formatCurrency(remainingAmount)}</p>
                  </div>
                  <div>
                    <p className="metric-label">Target date</p>
                    <p className="metric-value">{dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <div>
                    <p className="metric-label">Days remaining</p>
                    <p className="metric-value">{daysRemainingLabel}</p>
                  </div>
                </div>

                <div className="goal-kpi-row">
                  <strong className="goal-progress-value">{progress.toFixed(0)}%</strong>
                  <span className={`budget-status ${progressColor}`}>{statusOptions.find((option) => option.value === status)?.label}</span>
                </div>
                <div className="progress-bar">
                  <div className={`progress-fill ${progressColor}`} style={{ width: `${progress}%` }} />
                </div>

                <div className="budget-card-actions">
                  <button type="button" className="button secondary" onClick={() => openSavingsModal(goal)}>
                    Add Savings
                  </button>
                  <button type="button" className="edit-button" onClick={() => openModal(goal)} aria-label="Edit goal">
                    <Edit size={16} />
                  </button>
                  <button type="button" className="delete-button" onClick={() => setDeleteTarget(goal)} aria-label="Delete goal">
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>

        {!loading && filteredGoals.length > 0 && (
          <div className="income-charts-section">
            <GoalCharts data={filteredGoals.map((goal) => ({
              ...goal,
              status: mapGoalStatus(goal),
            }))} />
          </div>
        )}
      </section>

      {showModal && (
        <div className="modal-shell">
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Goals</p>
                <h2>{activeGoal ? 'Edit goal' : 'New goal'}</h2>
              </div>
              <button type="button" className="modal-close" onClick={closeModal}>
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="modal-fields">
                <label>
                  Goal name
                  <input
                    value={modalValues.name}
                    onChange={(e) => setModalValues({ ...modalValues, name: e.target.value })}
                    placeholder="Enter goal name"
                  />
                </label>

                <label>
                  Category
                  <select
                    value={modalValues.category}
                    onChange={(e) => setModalValues({ ...modalValues, category: e.target.value })}
                  >
                    <option value="">Select category</option>
                    {goalCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Target amount
                  <input
                    type="number"
                    min="0"
                    value={modalValues.targetAmount}
                    onChange={(e) => setModalValues({ ...modalValues, targetAmount: e.target.value })}
                    placeholder="0"
                  />
                </label>

                <label>
                  Target date
                  <input
                    type="date"
                    value={modalValues.targetDate}
                    onChange={(e) => setModalValues({ ...modalValues, targetDate: e.target.value })}
                  />
                </label>
              </div>

              {modalError && <div className="error-banner">{modalError}</div>}

              <div className="modal-footer">
                <button type="button" className="button ghost" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="button primary">
                  {activeGoal ? 'Update goal' : 'Create goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSavingsModal && (
        <div className="modal-shell">
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Savings</p>
                <h2>Update savings</h2>
                <p className="modal-subtitle">Adjust saved amount for {savingsGoal?.name}</p>
              </div>
              <button type="button" className="modal-close" onClick={closeSavingsModal}>
                &times;
              </button>
            </div>

            <form onSubmit={handleSavingsSubmit} className="modal-form">
              <div className="modal-fields">
                <label>
                  Amount
                  <input
                    type="number"
                    value={savingsAmount}
                    onChange={(e) => setSavingsAmount(e.target.value)}
                    placeholder="Enter amount"
                  />
                </label>
                <p className="field-note">Use a negative value to withdraw savings.</p>
              </div>

              {savingsError && <div className="error-banner">{savingsError}</div>}

              <div className="modal-footer">
                <button type="button" className="button ghost" onClick={closeSavingsModal}>
                  Cancel
                </button>
                <button type="submit" className="button primary">
                  Update savings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-shell">
          <div className="modal-content small">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Delete goal</p>
                <h2>Confirm deletion</h2>
              </div>
              <button type="button" className="modal-close" onClick={() => setDeleteTarget(null)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>?
            </div>
            <div className="modal-footer">
              <button type="button" className="button ghost" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button type="button" className="button danger" onClick={confirmDelete}>
                Delete goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GoalsPage;
