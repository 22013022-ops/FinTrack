import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from '../common/ChartCard';
import { formatCurrency } from '../../src/utils/calculations/expenseCalculations';

const colors = ['#112250', '#3b5078', '#6f83a1', '#c97a2b', '#4a7c59', '#a14a4a'];

function BudgetTooltip({ active, payload, formatter }) {
  if (!active || !payload?.length) return null;

  const [item] = payload;
  const label = item?.payload?.name || item?.name || 'Budget';

  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      <p className="chart-tooltip-value">{formatter ? formatter(item?.value ?? 0) : item?.value ?? 0}</p>
    </div>
  );
}

export default function BudgetCharts({ data = [] }) {
  const [activeIndex, setActiveIndex] = useState(null);

  const statusEntries = useMemo(() => {
    const safeData = Array.isArray(data) ? data : [];
    if (!safeData.length) return [];

    const counts = { within: 0, near: 0, exceeded: 0 };
    safeData.forEach((entry) => {
      const status = entry.status;
      if (status === 'exceeded') counts.exceeded += 1;
      else if (status === 'near') counts.near += 1;
      else counts.within += 1;
    });

    return [
      { name: 'Within Limit', value: counts.within, status: 'within', color: '#4a7c59' },
      { name: 'Near Limit', value: counts.near, status: 'near', color: '#c97a2b' },
      { name: 'Exceeded', value: counts.exceeded, status: 'exceeded', color: '#a14a4a' },
    ].filter((entry) => entry.value > 0);
  }, [data]);

  const comparisonEntries = useMemo(() => {
    const safeData = Array.isArray(data) ? data : [];
    return safeData.map((entry) => ({
      name: entry.category,
      budget: Number(entry.monthlyBudget) || 0,
      actual: Number(entry.spent) || 0,
    }));
  }, [data]);

  const remainingEntries = useMemo(() => {
    const safeData = Array.isArray(data) ? data : [];
    return safeData.map((entry) => ({
      name: entry.category,
      remaining: Math.max((Number(entry.monthlyBudget) || 0) - (Number(entry.spent) || 0), 0),
    }));
  }, [data]);

  const insight = useMemo(() => {
    if (!data.length) {
      return 'Set budgets for the selected month to review their status and compare planned spending against actuals.';
    }

    const exceededCount = statusEntries.find((entry) => entry.status === 'exceeded')?.value || 0;
    const nearCount = statusEntries.find((entry) => entry.status === 'near')?.value || 0;
    const highestStatus = exceededCount > 0 ? 'Exceeded' : nearCount > 0 ? 'Near Limit' : 'Within Limit';
    return `${highestStatus} budgets currently make up the most active portion of your monthly plan.`;
  }, [data.length, statusEntries]);

  if (!data.length) {
    return (
      <ChartCard
        title="Budget insights"
        description="Track how your monthly budget categories are performing against their planned limits."
      >
        <div className="income-chart-empty">
          <p>No budget categories recorded for this month yet.</p>
        </div>
      </ChartCard>
    );
  }

  return (
    <>
      <ChartCard
        title="Budget status distribution"
        description="Shows how many budget categories are within their limit, nearing the cap, or already exceeded for the selected month."
      >
        <div className="income-chart-shell">
          <div className="income-chart-layout">
            <div className="income-chart-visual">
              <ResponsiveContainer width="100%" height={325}>
                <PieChart>
                  <Pie
                    data={statusEntries}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={100}
                    outerRadius={150}
                    paddingAngle={3}
                    cornerRadius={6}
                    startAngle={90}
                    endAngle={450}
                    stroke="#f7f7f2"
                    strokeWidth={2}
                    isAnimationActive
                    animationDuration={900}
                    animationEasing="ease-out"
                    activeIndex={activeIndex}
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                    label={({ percent }) => `${Math.round(percent * 100)}%`}
                    labelLine={false}
                  >
                    {statusEntries.map((entry, index) => (
                      <Cell
                        key={`${entry.name}-${index}`}
                        fill={entry.color || colors[index % colors.length]}
                        opacity={activeIndex === null ? 1 : index === activeIndex ? 1 : 0.35}
                      />
                    ))}
                  </Pie>
                  <Tooltip isAnimationActive={false} content={<BudgetTooltip formatter={(value) => `${value} budget${Number(value) === 1 ? '' : 's'}`} />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="income-chart-center">
                <strong>{data.length}</strong>
                <span>Budget Categories</span>
              </div>
            </div>

            <div className="income-chart-legend" aria-label="Budget status legend">
              {statusEntries.map((entry, index) => (
                <div className="income-legend-item" key={`${entry.name}-${index}`}>
                  <div className="income-legend-bullet" style={{ backgroundColor: entry.color || colors[index % colors.length] }} />
                  <div className="income-legend-copy">
                    <span>{entry.name}</span>
                    <small>{entry.value} category{entry.value === 1 ? '' : 'ies'}</small>
                  </div>
                  <strong>{entry.value}</strong>
                </div>
              ))}
            </div>
          </div>

          <p className="chart-insight">{insight}</p>
        </div>
      </ChartCard>

      <ChartCard
        title="Budget vs actual spending"
        description="Compares the planned monthly budget with the actual amount spent for each category."
> 
        <div className="income-comparison-chart" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '14px', alignItems: 'start' }}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={comparisonEntries} margin={{ top: 10, right: 10, left: 0, bottom: 8 }}>
              <CartesianGrid vertical={false} stroke="#eef2f6" strokeDasharray="3 3" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#6e7b8e', fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: '#6e7b8e', fontSize: 12 }} tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip cursor={{ fill: '#f7fafc' }} content={<BudgetTooltip formatter={(value) => formatCurrency(value)} />} />
              <Bar dataKey="budget" radius={[6, 6, 0, 0]} fill="#3b5078" />
              <Bar dataKey="actual" radius={[6, 6, 0, 0]} fill="#c97a2b" />
            </BarChart>
          </ResponsiveContainer>
          <div className="income-chart-legend" aria-label="Budget comparison legend" style={{ display: 'grid', gap: '10px', paddingTop: '8px' }}>
            <div className="income-legend-item" style={{ padding: '8px 10px', minWidth: '160px' }}>
              <div className="income-legend-bullet" style={{ backgroundColor: '#3b5078' }} />
              <div className="income-legend-copy">
                <span>Budget</span>
                <small>Planned monthly allocation</small>
              </div>
            </div>
            <div className="income-legend-item" style={{ padding: '8px 10px', minWidth: '160px' }}>
              <div className="income-legend-bullet" style={{ backgroundColor: '#c97a2b' }} />
              <div className="income-legend-copy">
                <span>Actual</span>
                <small>Amount spent this month</small>
              </div>
            </div>
          </div>
        </div>
      </ChartCard>

      <ChartCard
        title="Remaining budget by category"
        description="Displays how much budget remains after deducting the actual spending for each category."
      >
        <div className="income-comparison-chart">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={remainingEntries} margin={{ top: 10, right: 10, left: 0, bottom: 8 }}>
              <CartesianGrid vertical={false} stroke="#eef2f6" strokeDasharray="3 3" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#6e7b8e', fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: '#6e7b8e', fontSize: 12 }} tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip cursor={{ fill: '#f7fafc' }} content={<BudgetTooltip formatter={(value) => formatCurrency(value)} />} />
              <Bar dataKey="remaining" radius={[6, 6, 0, 0]} fill="#4a7c59" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </>
  );
}
