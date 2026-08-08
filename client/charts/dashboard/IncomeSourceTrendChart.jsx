import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from '../common/ChartCard';
import { formatCurrency } from '../../src/utils/calculations/financeCalculations';
import StackedTrendLegend from './StackedTrendLegend';

const colors = ['#112250', '#3b5078', '#4a7c59', '#c97a2b', '#7b5ea7', '#9ec2d8', '#a14a4a'];

function SourceTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return <div className="chart-tooltip dashboard-chart-tooltip"><p className="chart-tooltip-label">{label}</p>{payload.filter((item) => item.value).map((item) => <p className="chart-tooltip-value" key={item.dataKey}><span style={{ color: item.color }}>●</span> {item.name}: {formatCurrency(item.value)}</p>)}</div>;
}

export default function IncomeSourceTrendChart({ data, sources, year, loading }) {
  const totalIncome = sources.reduce((sum, source) => sum + data.reduce((monthSum, month) => monthSum + (Number(month[`income_${source}`]) || 0), 0), 0);
  const legendItems = sources.map((source, index) => {
    const value = data.reduce((sum, month) => sum + (Number(month[`income_${source}`]) || 0), 0);
    return { name: source, color: colors[index % colors.length], value, percentage: totalIncome ? Math.round((value / totalIncome) * 100) : 0 };
  });
  return <ChartCard title="Income Source Trend" description={`See how each income stream contributed throughout ${year}.`} className="dashboard-yearly-chart-card">
    {loading ? <div className="dashboard-chart-loading">Loading yearly data…</div> : !sources.length ? <div className="dashboard-chart-loading">No income sources recorded for {year}.</div> : <div className="dashboard-stacked-trend-layout"><div className="dashboard-source-chart"><ResponsiveContainer width="100%" height={360}><BarChart data={data} margin={{ top: 12, right: 16, left: 4, bottom: 4 }}><CartesianGrid vertical={false} stroke="#eef2f6" strokeDasharray="3 3" /><XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#6e7b8e', fontSize: 12 }} /><YAxis tickLine={false} axisLine={false} tick={{ fill: '#6e7b8e', fontSize: 12 }} tickFormatter={(value) => formatCurrency(value)} width={76} /><Tooltip cursor={{ fill: '#f7fafc' }} content={<SourceTooltip />} />{sources.map((source, index) => <Bar key={source} dataKey={`income_${source}`} name={source} stackId="sources" fill={colors[index % colors.length]} />)}</BarChart></ResponsiveContainer></div><StackedTrendLegend items={legendItems} /></div>}
  </ChartCard>;
}
