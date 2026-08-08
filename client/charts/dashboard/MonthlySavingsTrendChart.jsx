import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from '../common/ChartCard';
import { formatCurrency } from '../../src/utils/calculations/financeCalculations';

function SavingsTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const value = Number(payload[0].value) || 0;
  return <div className="chart-tooltip dashboard-chart-tooltip"><p className="chart-tooltip-label">{label}</p><p className="chart-tooltip-value"><span style={{ color: value >= 0 ? '#4a7c59' : '#c92a2a' }}>●</span> Savings: {formatCurrency(value)}</p></div>;
}

export default function MonthlySavingsTrendChart({ data, year, loading }) {
  const chartData = data.map((month) => ({ ...month, savings: (Number(month.income) || 0) - (Number(month.expenses) || 0) }));
  return <ChartCard title="Monthly Savings / Cash Flow Trend" description={`See how much income remained after expenses each month in ${year}.`} className="dashboard-yearly-chart-card">
    {loading ? <div className="dashboard-chart-loading">Loading yearly data…</div> : <div className="dashboard-cashflow-layout"><div className="dashboard-yearly-bar-chart"><ResponsiveContainer width="100%" height={320}><BarChart data={chartData} margin={{ top: 12, right: 16, left: 4, bottom: 4 }}><CartesianGrid vertical={false} stroke="#eef2f6" strokeDasharray="3 3" /><XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#6e7b8e', fontSize: 12 }} /><YAxis tickLine={false} axisLine={false} tick={{ fill: '#6e7b8e', fontSize: 12 }} tickFormatter={(value) => formatCurrency(value)} width={76} /><Tooltip cursor={{ fill: '#f7fafc' }} content={<SavingsTooltip />} /><Bar dataKey="savings" name="Savings" radius={[6, 6, 0, 0]} maxBarSize={42}>{chartData.map((month) => <Cell key={month.month} fill={month.savings >= 0 ? '#4a7c59' : '#c92a2a'} />)}</Bar></BarChart></ResponsiveContainer></div><aside className="dashboard-cashflow-legend" aria-label="Cash flow legend"><p>Legend</p><span><i className="positive" /> Positive cash flow</span><span><i className="negative" /> Negative cash flow</span></aside></div>}
  </ChartCard>;
}
