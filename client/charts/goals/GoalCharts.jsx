import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from '../common/ChartCard';
import { formatCurrency } from '../../src/utils/calculations/expenseCalculations';

const colors = ['#112250', '#3b5078', '#6f83a1', '#c97a2b', '#4a7c59', '#a14a4a'];

function GoalTooltip({ active, payload, formatter }) {
  if (!active || !payload?.length) return null;

  const [item] = payload;
  const label = item?.payload?.name || item?.name || 'Goal';

  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      <p className="chart-tooltip-value">{formatter ? formatter(item?.value ?? 0) : item?.value ?? 0}</p>
    </div>
  );
}

export default function GoalCharts({ data = [] }) {
  const [activeIndex, setActiveIndex] = useState(null);

  const statusEntries = useMemo(() => {
    const safeData = Array.isArray(data) ? data : [];
    if (!safeData.length) return [];

    const counts = { completed: 0, onTrack: 0, nearTarget: 0, notStarted: 0 };

    safeData.forEach((entry) => {
      const status = entry.status;
      if (status === 'completed') counts.completed += 1;
      else if (status === 'near target') counts.nearTarget += 1;
      else if (status === 'on track') counts.onTrack += 1;
      else counts.notStarted += 1;
    });

    return [
      { name: 'Completed', value: counts.completed, color: '#4a7c59' },
      { name: 'On Track', value: counts.onTrack, color: '#3b5078' },
      { name: 'Near Target', value: counts.nearTarget, color: '#c97a2b' },
      { name: 'Not Started', value: counts.notStarted, color: '#6f83a1' },
    ].filter((entry) => entry.value > 0);
  }, [data]);

  const progressEntries = useMemo(() => {
    const safeData = Array.isArray(data) ? data : [];
    return safeData.map((entry) => ({
      name: entry.name,
      saved: Number(entry.savedAmount) || 0,
      target: Number(entry.targetAmount) || 0,
    }));
  }, [data]);

  const deadlineEntries = useMemo(() => {
    const safeData = Array.isArray(data) ? data : [];
    return safeData
      .map((entry) => {
        const dueDate = new Date(entry.targetDate);
        const now = new Date();
        const daysRemaining = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
        return {
          name: entry.name,
          daysRemaining: Number.isNaN(daysRemaining) ? 0 : Math.max(daysRemaining, 0),
        };
      })
      .filter((entry) => entry.daysRemaining >= 0)
      .sort((left, right) => left.daysRemaining - right.daysRemaining);
  }, [data]);

  const insight = useMemo(() => {
    if (!data.length) {
      return 'Add goals to see a snapshot of your progress, deadlines, and momentum.';
    }

    const completed = statusEntries.find((entry) => entry.name === 'Completed')?.value || 0;
    const onTrack = statusEntries.find((entry) => entry.name === 'On Track')?.value || 0;
    const nextGoal = deadlineEntries[0];
    const prefix = completed > 0 ? `${completed} completed goal${completed === 1 ? '' : 's'}` : 'Your active goals';
    return `${prefix}${nextGoal ? ` — next deadline is ${nextGoal.name} in ${nextGoal.daysRemaining} day${nextGoal.daysRemaining === 1 ? '' : 's'}` : ''}.`;
  }, [data.length, statusEntries, deadlineEntries]);

  if (!data.length) {
    return (
      <ChartCard title="Goal insights" description="Track how your savings goals are progressing and where deadlines are approaching.">
        <div className="income-chart-empty">
          <p>No goals recorded for this month yet.</p>
        </div>
      </ChartCard>
    );
  }

  return (
    <>
      <ChartCard title="Goal status distribution" description="Shows how many goals are completed, on track, near target, or not started for the selected month.">
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
                      <Cell key={`${entry.name}-${index}`} fill={entry.color || colors[index % colors.length]} opacity={activeIndex === null ? 1 : index === activeIndex ? 1 : 0.35} />
                    ))}
                  </Pie>
                  <Tooltip isAnimationActive={false} content={<GoalTooltip formatter={(value) => `${value} goal${Number(value) === 1 ? '' : 's'}`} />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="income-chart-center">
                <strong>{data.length}</strong>
                <span>Goal Count</span>
              </div>
            </div>

            <div className="income-chart-legend" aria-label="Goal status legend">
              {statusEntries.map((entry, index) => (
                <div className="income-legend-item" key={`${entry.name}-${index}`}>
                  <div className="income-legend-bullet" style={{ backgroundColor: entry.color || colors[index % colors.length] }} />
                  <div className="income-legend-copy">
                    <span>{entry.name}</span>
                    <small>{entry.value} goal{entry.value === 1 ? '' : 's'}</small>
                  </div>
                  <strong>{entry.value}</strong>
                </div>
              ))}
            </div>
          </div>

          <p className="chart-insight">{insight}</p>
        </div>
      </ChartCard>

      <ChartCard title="Goal progress comparison" description="Compares the current savings amount against the target amount for each financial goal.">
        <div className="income-comparison-chart" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '14px', alignItems: 'start' }}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={progressEntries} margin={{ top: 10, right: 10, left: 0, bottom: 8 }}>
              <CartesianGrid vertical={false} stroke="#eef2f6" strokeDasharray="3 3" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#6e7b8e', fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: '#6e7b8e', fontSize: 12 }} tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip cursor={{ fill: '#f7fafc' }} content={<GoalTooltip formatter={(value) => formatCurrency(value)} />} />
              <Bar dataKey="target" radius={[6, 6, 0, 0]} fill="#3b5078" />
              <Bar dataKey="saved" radius={[6, 6, 0, 0]} fill="#c97a2b" />
            </BarChart>
          </ResponsiveContainer>
          <div className="income-chart-legend" aria-label="Goal comparison legend" style={{ display: 'grid', gap: '10px', paddingTop: '8px' }}>
            <div className="income-legend-item" style={{ padding: '8px 10px', minWidth: '150px' }}>
              <div className="income-legend-bullet" style={{ backgroundColor: '#3b5078' }} />
              <div className="income-legend-copy">
                <span>Target</span>
                <small>Full goal amount</small>
              </div>
            </div>
            <div className="income-legend-item" style={{ padding: '8px 10px', minWidth: '150px' }}>
              <div className="income-legend-bullet" style={{ backgroundColor: '#c97a2b' }} />
              <div className="income-legend-copy">
                <span>Saved</span>
                <small>Current progress</small>
              </div>
            </div>
          </div>
        </div>
      </ChartCard>

      <ChartCard title="Upcoming goal deadlines" description="Shows how many days remain until each active goal reaches its target date.">
        <div className="income-comparison-chart">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={deadlineEntries} margin={{ top: 10, right: 10, left: 0, bottom: 8 }}>
              <CartesianGrid vertical={false} stroke="#eef2f6" strokeDasharray="3 3" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#6e7b8e', fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: '#6e7b8e', fontSize: 12 }} allowDecimals={false} />
              <Tooltip cursor={{ fill: '#f7fafc' }} content={<GoalTooltip formatter={(value) => `${value} day${Number(value) === 1 ? '' : 's'}`} />} />
              <Bar dataKey="daysRemaining" radius={[6, 6, 0, 0]} fill="#4a7c59" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </>
  );
}
