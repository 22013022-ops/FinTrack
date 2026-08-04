import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from '../common/ChartCard';
import ChartTooltip from '../common/ChartTooltip';
import { formatCurrency } from '../../src/utils/calculations/incomeCalculations';

const colors = ['#112250', '#3b5078', '#6f83a1', '#9ec2d8', '#4a7c59', '#c97a2b', '#a14a4a'];

export default function IncomeSourcesChart({ data, frequencyData = [] }) {
  const [activeIndex, setActiveIndex] = useState(null);

  const totals = useMemo(() => {
    const safeData = Array.isArray(data) ? data : [];
    const incomeTotal = safeData.reduce((sum, entry) => sum + Number(entry.value || 0), 0);
    return {
      incomeTotal,
      entries: safeData.map((entry) => ({
        ...entry,
        percentage: incomeTotal ? Math.round((Number(entry.value || 0) / incomeTotal) * 100) : 0,
      })),
    };
  }, [data]);

  const insight = useMemo(() => {
    if (!totals.entries.length) {
      return 'Add income records to unlock insights about your biggest earnings sources.';
    }

    const highest = [...totals.entries].sort((left, right) => right.value - left.value)[0];
    return `Highest income source this month: ${highest.name} contributes ${highest.percentage}% of your total income.`;
  }, [totals.entries]);

  const weeklyEntries = useMemo(() => Array.isArray(frequencyData) ? frequencyData : [], [frequencyData]);

  console.log("Original data:", data);
  console.log("Chart entries:", totals.entries);
  console.log("Total income:", totals.incomeTotal);

  if (!data?.length) {
    return (
      <>
        <ChartCard
          title="Income sources"
          description="A quick look at how each income category contributes to your monthly inflow."
        >
          <div className="income-chart-empty">
            <p>No income sources recorded for this month yet.</p>
          </div>
        </ChartCard>

        <ChartCard
          title="Income frequency"
          description="Shows how many income transactions were recorded each week of the selected month."
        >
          <div className="income-chart-empty">
            <p>No weekly activity recorded for this month yet.</p>
          </div>
        </ChartCard>
      </>
    );
  }

  return (
    <>
      <ChartCard
        title="Income sources"
        description="This view shows how each income category contributes to your monthly inflow, making it easier to spot your strongest revenue streams."
      >
        <div className="income-chart-shell">
          <div className="income-chart-layout">
            <div className="income-chart-visual">
              <ResponsiveContainer width="100%" height={325}>
                <PieChart>
                  <Pie
                    data={totals.entries}
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
                    {totals.entries.map((entry, index) => {
                      console.log("Cell:", entry);

                      return (
                        <Cell
                          key={`${entry.name}-${index}`}
                          fill={colors[index % colors.length]}
                          opacity={activeIndex === null ? 1 : index === activeIndex ? 1 : 0.35}
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip
                    isAnimationActive={false}
                    content={<ChartTooltip formatter={(value) => formatCurrency(value)} />}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="income-chart-center">
                <strong>{formatCurrency(totals.incomeTotal)}</strong>
                <span>Total Income</span>
              </div>
            </div>

            <div className="income-chart-legend" aria-label="Income contribution legend">
              {totals.entries.map((entry, index) => (
                <div className="income-legend-item" key={`${entry.name}-${index}`}>
                  <div className="income-legend-bullet" style={{ backgroundColor: colors[index % colors.length] }} />
                  <div className="income-legend-copy">
                    <span>{entry.name}</span>
                    <small>{formatCurrency(entry.value)}</small>
                  </div>
                  <strong>{entry.percentage}%</strong>
                </div>
              ))}
            </div>
          </div>

          <p className="chart-insight">{insight}</p>
        </div>
      </ChartCard>

      <ChartCard
        title="Income source comparison"
        description="A side-by-side view of the total income earned from each category in the selected month."
      >
        <div className="income-comparison-chart">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={totals.entries} margin={{ top: 10, right: 10, left: 0, bottom: 8 }}>
              <CartesianGrid vertical={false} stroke="#eef2f6" strokeDasharray="3 3" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#6e7b8e', fontSize: 12 }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#6e7b8e', fontSize: 12 }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip
                cursor={{ fill: '#f7fafc' }}
                content={<ChartTooltip formatter={(value) => formatCurrency(value)} />}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {totals.entries.map((entry, index) => (
                  <Cell key={`${entry.name}-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard
        title="Income frequency"
        description="Shows how many income transactions were recorded each week of the selected month."
      >
        <div className="income-comparison-chart">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={weeklyEntries} margin={{ top: 10, right: 10, left: 0, bottom: 8 }}>
              <CartesianGrid vertical={false} stroke="#eef2f6" strokeDasharray="3 3" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#6e7b8e', fontSize: 12 }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#6e7b8e', fontSize: 12 }}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: '#f7fafc' }}
                content={<ChartTooltip formatter={(value) => `${value} transaction${Number(value) === 1 ? '' : 's'}`} />}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#3b5078" maxBarSize={34} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </>
  );
}
