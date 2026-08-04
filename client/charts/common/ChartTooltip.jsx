export default function ChartTooltip({ active, payload, formatter }) {
  if (!active || !payload?.length) return null;

  const [item] = payload;
  const percent = item?.payload?.percentage ?? 0;

  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{item?.name || item?.payload?.name || 'Income source'}</p>
      <p className="chart-tooltip-value">
        {formatter ? formatter(item?.value ?? 0) : item?.value ?? 0}
      </p>
      <p className="chart-tooltip-meta">Share of monthly income: {percent}%</p>
    </div>
  );
}
