import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from '../common/ChartCard';
import ChartTooltip from '../common/ChartTooltip';
import { formatCurrency } from '../../src/utils/calculations/expenseCalculations';

const colors = ['#112250', '#3b5078', '#6f83a1', '#9ec2d8', '#4a7c59', '#c97a2b', '#a14a4a'];

export default function ExpenseCategoriesChart({ data, comparisonData = [], frequencyData = [], weeklyAmountData = [] }) {
  const [activeIndex, setActiveIndex] = useState(null);

  const totals = useMemo(() => {
    const safeData = Array.isArray(data) ? data : [];
    const expenseTotal = safeData.reduce((sum, entry) => sum + Number(entry.value || 0), 0);

    return {
      expenseTotal,
      entries: safeData.map((entry) => ({
        ...entry,
        percentage: expenseTotal ? Math.round((Number(entry.value || 0) / expenseTotal) * 100) : 0,
      })),
    };
  }, [data]);

  const insight = useMemo(() => {
    if (!totals.entries.length) {
      return 'Add expense records to unlock insights about your biggest spending categories.';
    }

    const highest = [...totals.entries].sort((left, right) => right.value - left.value)[0];
    return `Highest spending category this month: ${highest.name} contributes ${highest.percentage}% of your total expenses.`;
  }, [totals.entries]);

  const comparisonEntries = useMemo(() => Array.isArray(comparisonData) ? comparisonData : [], [comparisonData]);
  const weeklyEntries = useMemo(() => Array.isArray(frequencyData) ? frequencyData : [], [frequencyData]);
  const weeklyAmountEntries = useMemo(() => Array.isArray(weeklyAmountData) ? weeklyAmountData : [], [weeklyAmountData]);

  if (!data?.length) {
    return (
      <ChartCard
        title="Expense categories"
        description="A quick look at how each spending category contributes to your monthly expenses."
      >
        <div className="income-chart-empty">
          <p>No expense categories recorded for this month yet.</p>
        </div>
      </ChartCard>
    );
  }

  return (
    <>
      <ChartCard
        title="Expense categories"
        description="This view shows how each expense category contributes to your monthly spend, making it easier to spot where your money is going."
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
                    {totals.entries.map((entry, index) => (
                      <Cell
                        key={`${entry.name}-${index}`}
                        fill={colors[index % colors.length]}
                        opacity={activeIndex === null ? 1 : index === activeIndex ? 1 : 0.35}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    isAnimationActive={false}
                    content={<ChartTooltip formatter={(value) => formatCurrency(value)} />}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="income-chart-center">
                <strong>{formatCurrency(totals.expenseTotal)}</strong>
                <span>Total Expenses</span>
              </div>
            </div>

            <div className="income-chart-legend" aria-label="Expense contribution legend">
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
        title="Expense category comparison"
        description="Compares the total amount spent in each expense category during the selected month."
      >
        <div className="income-comparison-chart">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={comparisonEntries} margin={{ top: 10, right: 10, left: 0, bottom: 8 }}>
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
                {comparisonEntries.map((entry, index) => (
                  <Cell key={`${entry.name}-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard
        title="Expense frequency"
        description="Shows how many expense transactions were recorded each week of the selected month."
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

      <ChartCard
        title="Weekly expense amount"
        description="Shows how total expenses changed throughout the selected month based on transaction dates."
      >
        <div className="income-comparison-chart">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={weeklyAmountEntries} margin={{ top: 10, right: 10, left: 0, bottom: 8 }}>
              <CartesianGrid vertical={false} stroke="#eef2f6" strokeDasharray="3 3" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#6e7b8e', fontSize: 12 }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#6e7b8e', fontSize: 12 }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip
                cursor={{ stroke: '#3b5078', strokeWidth: 1 }}
                content={<ChartTooltip formatter={(value) => formatCurrency(value)} />}
              />
              <Line type="monotone" dataKey="value" stroke="#112250" strokeWidth={3} dot={{ r: 4, fill: '#112250' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </>
  );
}
