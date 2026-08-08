import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from '../common/ChartCard';
import { formatCurrency } from '../../src/utils/calculations/financeCalculations';

function DashboardTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return <div className="chart-tooltip dashboard-chart-tooltip"><p className="chart-tooltip-label">{label}</p>{payload.map((item) => <p className="chart-tooltip-value" key={item.dataKey}><span style={{ color: item.color }}>●</span> {item.name}: {formatCurrency(item.value)}</p>)}</div>;
}

export default function MonthlyIncomeExpensesChart({ data, year, loading }) {
  return <ChartCard title="Monthly Income vs Expenses" description={`Compare your income and expenses across all months of ${year}.`} className="dashboard-yearly-chart-card">
    {loading ? <div className="dashboard-chart-loading">Loading yearly data…</div> : <div className="dashboard-yearly-line-chart"><ResponsiveContainer width="100%" height={320}><LineChart data={data} margin={{ top: 12, right: 16, left: 4, bottom: 4 }}><CartesianGrid vertical={false} stroke="#eef2f6" strokeDasharray="3 3" /><XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#6e7b8e', fontSize: 12 }} /><YAxis tickLine={false} axisLine={false} tick={{ fill: '#6e7b8e', fontSize: 12 }} tickFormatter={(value) => formatCurrency(value)} width={76} /><Tooltip cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }} content={<DashboardTooltip />} /><Legend wrapperStyle={{ fontSize: 13, paddingTop: 12 }} /><Line type="monotone" dataKey="income" name="Income" stroke="#112250" strokeWidth={3} dot={{ r: 3, fill: '#112250' }} activeDot={{ r: 6 }} /><Line type="monotone" dataKey="expenses" name="Expenses" stroke="#c97a2b" strokeWidth={3} dot={{ r: 3, fill: '#c97a2b' }} activeDot={{ r: 6 }} /></LineChart></ResponsiveContainer></div>}
  </ChartCard>;
}
