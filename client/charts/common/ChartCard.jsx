export default function ChartCard({ title, description, children, className = '' }) {
  return (
    <article className={`chart-card ${className}`.trim()}>
      <div className="chart-card-header">
        <div>
          <h3>{title}</h3>
          {description ? <p>{description}</p> : null}
        </div>
      </div>
      <div className="chart-card-body">{children}</div>
    </article>
  );
}
