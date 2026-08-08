import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from '../common/ChartCard';
import { formatCurrency } from '../../src/utils/calculations/financeCalculations';
import StackedTrendLegend from './StackedTrendLegend';

const colors = ['#112250', '#3b5078', '#4a7c59', '#c97a2b', '#6f83a1', '#a14a4a', '#9ec2d8', '#7b5ea7', '#597f88', '#ad7a4b'];

function CategoryTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return <div className="chart-tooltip dashboard-chart-tooltip"><p className="chart-tooltip-label">{label}</p>{payload.filter((item) => item.value).map((item) => <p className="chart-tooltip-value" key={item.dataKey}><span style={{ color: item.color }}>●</span> {item.name}: {formatCurrency(item.value)}</p>)}</div>;
}

export default function ExpenseCategoryTrendChart({ data, categories, year, loading }) {
  const totalExpenses = categories.reduce((sum, category) => sum + data.reduce((monthSum, month) => monthSum + (Number(month[`expense_${category}`]) || 0), 0), 0);
  const legendItems = categories.map((category, index) => {
    const value = data.reduce((sum, month) => sum + (Number(month[`expense_${category}`]) || 0), 0);
    return { name: category, color: colors[index % colors.length], value, percentage: totalExpenses ? Math.round((value / totalExpenses) * 100) : 0 };
  });
  return <ChartCard title="Expense Category Trend" description={`See how your spending categories changed throughout ${year}.`} className="dashboard-yearly-chart-card">
    {loading ? <div className="dashboard-chart-loading">Loading yearly data…</div> : !categories.length ? <div className="dashboard-chart-loading">No expense categories recorded for {year}.</div> : <div className="dashboard-stacked-trend-layout"><div className="dashboard-category-chart"><ResponsiveContainer width="100%" height={360}><BarChart data={data} margin={{ top: 12, right: 16, left: 4, bottom: 4 }}><CartesianGrid vertical={false} stroke="#eef2f6" strokeDasharray="3 3" /><XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#6e7b8e', fontSize: 12 }} /><YAxis tickLine={false} axisLine={false} tick={{ fill: '#6e7b8e', fontSize: 12 }} tickFormatter={(value) => formatCurrency(value)} width={76} /><Tooltip cursor={{ fill: '#f7fafc' }} content={<CategoryTooltip />} />{categories.map((category, index) => <Bar key={category} dataKey={`expense_${category}`} name={category} stackId="expenses" fill={colors[index % colors.length]} />)}</BarChart></ResponsiveContainer></div><StackedTrendLegend items={legendItems} /></div>}
  </ChartCard>;
}
