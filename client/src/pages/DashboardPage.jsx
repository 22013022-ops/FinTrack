import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, CircleDollarSign, Lightbulb, LoaderCircle, PiggyBank, RefreshCw, TrendingUp, WalletCards } from 'lucide-react';
import { incomeService } from '../services/incomeService';
import { expenseService } from '../services/expenseService';
import { dashboardService } from '../services/dashboardService';
import { formatCurrency, getMonthLabel } from '../utils/calculations/financeCalculations';
import MonthlyIncomeExpensesChart from '../../charts/dashboard/MonthlyIncomeExpensesChart';
import MonthlySavingsTrendChart from '../../charts/dashboard/MonthlySavingsTrendChart';
import ExpenseCategoryTrendChart from '../../charts/dashboard/ExpenseCategoryTrendChart';
import IncomeSourceTrendChart from '../../charts/dashboard/IncomeSourceTrendChart';
import '../styles/dashboard.css';
import '../styles/dashboardInsights.css';

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthKey = (date) => date.toISOString().slice(0, 7);
const shiftMonth = (month, direction) => {
  const [year, monthNumber] = month.split('-').map(Number);
  const total = year * 12 + monthNumber - 1 + direction;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`;
};
const totalAmount = (records, field = 'amount') => records.reduce((sum, record) => sum + (Number(record[field]) || 0), 0);

function comparison(current, previous, lowerIsBetter = false) {
  if (!previous) return { text: current ? 'No data last month' : 'No activity this month', tone: 'neutral', Icon: null };
  const delta = current - previous;
  const percent = Math.round(Math.abs((delta / previous) * 100));
  const good = lowerIsBetter ? delta <= 0 : delta >= 0;
  return {
    text: `${delta >= 0 ? '+' : '-'}${percent}% from last month`,
    tone: good ? 'positive' : 'negative',
    Icon: delta >= 0 ? ArrowUpRight : ArrowDownRight,
  };
}

function amountComparison(current, previous, period = 'last year') {
  if (!previous) return { text: current ? `No data ${period}` : `No activity ${period}`, tone: 'neutral', Icon: null };
  const delta = current - previous;
  return {
    text: `${formatCurrency(Math.abs(delta))} ${delta >= 0 ? 'more' : 'less'} than ${period}`,
    tone: delta >= 0 ? 'positive' : 'negative',
    Icon: delta >= 0 ? ArrowUpRight : ArrowDownRight,
  };
}

export default function DashboardPage() {
  const [month, setMonth] = useState(() => window.localStorage.getItem('fintrack_dashboard_month') || monthKey(new Date()));
  const [data, setData] = useState({ income: [], previousIncome: [], expenses: [], previousExpenses: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [yearlyData, setYearlyData] = useState({ months: [], expenseCategories: [], incomeSources: [] });
  const [yearlyLoading, setYearlyLoading] = useState(true);
  const [yearlyError, setYearlyError] = useState('');
  const [insights, setInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState('');
  const yearlyCache = useRef(new Map());
  const [selectedYear, selectedMonth] = month.split('-').map(Number);
  const years = Array.from({ length: 17 }, (_, index) => new Date().getFullYear() - 8 + index);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    const previousMonth = shiftMonth(month, -1);
    try {
      const [income, previousIncome, expenses, previousExpenses] = await Promise.all([
        incomeService.list({ month, sort: 'latest' }), incomeService.list({ month: previousMonth, sort: 'latest' }),
        expenseService.list({ month, sort: 'latest' }), expenseService.list({ month: previousMonth, sort: 'latest' }),
      ]);
      setData({
        income: income.data.income || [], previousIncome: previousIncome.data.income || [],
        expenses: expenses.data.expenses || [], previousExpenses: previousExpenses.data.expenses || [],
      });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load your financial overview.');
    } finally { setLoading(false); }
  }, [month]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { window.localStorage.setItem('fintrack_dashboard_month', month); }, [month]);
  useEffect(() => {
    let active = true;
    const cached = yearlyCache.current.get(selectedYear);
    const cachedDataset = cached && typeof cached.then !== 'function' && Array.isArray(cached.months) && Array.isArray(cached.expenseCategories) && Array.isArray(cached.incomeSources) ? cached : null;
    if (cachedDataset) {
      setYearlyData(cachedDataset); setYearlyLoading(false); setYearlyError('');
      return () => { active = false; };
    }

    setYearlyLoading(true); setYearlyError('');
    const pendingRequest = cached && typeof cached.then === 'function' ? cached : null;
    const request = pendingRequest || dashboardService.yearlyIncomeExpenses(selectedYear)
      .then(({ data: response }) => {
        const dataset = { months: Array.isArray(response.months) ? response.months : [], expenseCategories: Array.isArray(response.expenseCategories) ? response.expenseCategories : [], incomeSources: Array.isArray(response.incomeSources) ? response.incomeSources : [] };
        yearlyCache.current.set(selectedYear, dataset);
        return dataset;
      })
      .catch((requestError) => {
        yearlyCache.current.delete(selectedYear);
        throw requestError;
      });
    if (!pendingRequest) yearlyCache.current.set(selectedYear, request);

    request.then((months) => {
      if (active) { setYearlyData(months); setYearlyLoading(false); }
    }).catch((requestError) => {
      if (active) { setYearlyError(requestError.response?.data?.message || 'Could not load yearly chart data.'); setYearlyLoading(false); }
    });
    return () => { active = false; };
  }, [selectedYear]);

  const cards = useMemo(() => {
    const income = totalAmount(data.income); const previousIncome = totalAmount(data.previousIncome);
    const expenses = totalAmount(data.expenses); const previousExpenses = totalAmount(data.previousExpenses);
    const savings = income - expenses; const previousSavings = previousIncome - previousExpenses;
    return [
      { label: 'Total income', value: income, icon: WalletCards, comparison: comparison(income, previousIncome) },
      { label: 'Total expenses', value: expenses, icon: CircleDollarSign, comparison: comparison(expenses, previousExpenses, true) },
      { label: 'Savings', value: savings, icon: PiggyBank, comparison: amountComparison(savings, previousSavings, 'last month') },
    ];
  }, [data]);

  const changeMonth = (nextMonth) => setMonth(nextMonth);
  const generateInsights = async () => {
    setInsightsLoading(true); setInsightsError('');
    try {
      const { data: response } = await dashboardService.generateInsights(month);
      setInsights({ month: response.month, ...response.insights });
    } catch (requestError) {
      setInsightsError(requestError.response?.data?.message || 'Could not generate AI insights right now.');
    } finally { setInsightsLoading(false); }
  };
  const visibleInsights = insights?.month === month ? insights : null;
  return <div className="page dashboard-page">
    <header className="page-header dashboard-header"><div><p className="eyebrow">PERSONAL FINANCE</p><h1>Dashboard</h1><p>Overall financial overview</p></div></header>

    <section className="dashboard-period" aria-label="Dashboard period selector">
      <div className="month-toolbar">
        <button type="button" onClick={() => changeMonth(shiftMonth(month, -1))} aria-label="Previous month"><ChevronLeft size={20} /></button>
        <div className="month-picker-wrap"><CalendarDays size={16} /><select aria-label="Select month" value={selectedMonth} onChange={(event) => changeMonth(`${selectedYear}-${String(event.target.value).padStart(2, '0')}`)}>{monthNames.map((name, index) => <option value={index + 1} key={name}>{name}</option>)}</select><select aria-label="Select year" value={selectedYear} onChange={(event) => changeMonth(`${event.target.value}-${String(selectedMonth).padStart(2, '0')}`)}>{years.map((year) => <option key={year} value={year}>{year}</option>)}</select></div>
        <button type="button" onClick={() => changeMonth(shiftMonth(month, 1))} aria-label="Next month"><ChevronRight size={20} /></button>
        <button type="button" className="refresh-button" onClick={load} aria-label="Refresh dashboard"><RefreshCw size={17} /></button>
      </div>
      <div className="dashboard-period-heading"><span>FINANCIAL OVERVIEW</span><strong>{getMonthLabel(month)}</strong><small>Goals for {selectedYear}</small></div>
    </section>

    {error && <div className="error-banner">{error}</div>}
    {loading ? <div className="dashboard-loading"><LoaderCircle size={25} /> Loading your financial overview…</div> : <section className="dashboard-summary-cards" aria-label="Financial summary">{cards.map(({ label, value, icon: Icon, meta, comparison: change }) => {
        const ChangeIcon = change.Icon;
        return <article key={label}><div className="dashboard-card-top"><span>{label}</span><i><Icon size={19} /></i></div><strong>{formatCurrency(value)}</strong>{meta && <small className="dashboard-card-meta">{meta}</small>}<p className={`dashboard-comparison ${change.tone}`}>{ChangeIcon && <ChangeIcon size={15} />}{change.text}</p></article>;
      })}</section>}

    <section className="dashboard-insights" aria-labelledby="ai-insights-title">
      <header className="dashboard-insights-header">
        <div><span>AI FINANCIAL INSIGHTS</span><h2 id="ai-insights-title">Your {getMonthLabel(month)} insights</h2><p>{visibleInsights ? 'Fresh, personalized guidance based on your financial summary.' : 'Generate personalized suggestions for your selected month.'}</p></div>
        <button type="button" className="button dashboard-insights-button" onClick={generateInsights} disabled={insightsLoading}>
          {insightsLoading ? <><LoaderCircle size={17} /> Generating…</> : 'Generate Insights'}
        </button>
      </header>
      {insightsError && <div className="error-banner dashboard-insights-error" role="alert">{insightsError}</div>}
      {(insightsLoading || visibleInsights) && <div className="dashboard-insights-grid">
        <article className="dashboard-insight-card">
          <i className="dashboard-insight-icon suggestion" aria-hidden="true"><Lightbulb size={19} /></i>
          <div><span>SUGGESTIONS</span>{insightsLoading ? <><h3>Generating your suggestions…</h3><p>Reviewing your selected-month financial summary and year-to-date trends.</p></> : <InsightList items={visibleInsights?.suggestions} />}</div>
        </article>
        <article className="dashboard-insight-card">
          <i className="dashboard-insight-icon improvement" aria-hidden="true"><TrendingUp size={19} /></i>
          <div><span>IMPROVEMENTS</span>{insightsLoading ? <><h3>Identifying improvements…</h3><p>Comparing income, spending, budgets, and goals from January through this month.</p></> : <InsightList items={visibleInsights?.improvements} />}</div>
        </article>
      </div>}
    </section>

    <DashboardChartSection title={`${selectedYear} Financial Trends`} subtitle="Your financial trends across the year" charts={[]}>
      {yearlyError ? <div className="dashboard-chart-error">{yearlyError}</div> : <IncomeSourceTrendChart data={yearlyData.months} sources={yearlyData.incomeSources} year={selectedYear} loading={yearlyLoading} />}
      {yearlyError ? null : <ExpenseCategoryTrendChart data={yearlyData.months} categories={yearlyData.expenseCategories} year={selectedYear} loading={yearlyLoading} />}
      {yearlyError ? null : <MonthlyIncomeExpensesChart data={yearlyData.months} year={selectedYear} loading={yearlyLoading} />}
      {yearlyError ? null : <MonthlySavingsTrendChart data={yearlyData.months} year={selectedYear} loading={yearlyLoading} />}
    </DashboardChartSection>
  </div>;
}

function DashboardChartSection({ title, subtitle, charts, children }) {
  return <section className="dashboard-chart-section" aria-label={title}>
    <header><div><h2>{title}</h2><p>{subtitle}</p></div></header>
    <div className="dashboard-chart-grid">{children}{charts.map((chart) => <article className="dashboard-chart-placeholder" key={chart}><div><span>CHART PLACEHOLDER</span><h3>{chart}</h3></div></article>)}</div>
  </section>;
}

function InsightList({ items = [] }) {
  return <ul className="dashboard-insight-list">{items.map((item, index) => <li key={`${item.title}-${index}`}><strong>{item.title}</strong><p>→ <em>{item.reason}</em></p></li>)}</ul>;
}
