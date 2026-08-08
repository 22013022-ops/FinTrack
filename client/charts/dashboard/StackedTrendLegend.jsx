import { formatCurrency } from '../../src/utils/calculations/financeCalculations';

export default function StackedTrendLegend({ items }) {
  return <aside className="dashboard-stacked-legend" aria-label="Chart legend">
    {items.map((item) => <div className="dashboard-stacked-legend-item" key={item.name}><i style={{ backgroundColor: item.color }} /><div><strong>{item.name}</strong><small>{formatCurrency(item.value)}</small></div><b>{item.percentage}%</b></div>)}
  </aside>;
}
