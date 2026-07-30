export default function Brand({ light = false }) {
  return <div className={`brand ${light ? 'brand-light' : ''}`}><span className="brand-mark" /><span>FinTrack</span></div>;
}
