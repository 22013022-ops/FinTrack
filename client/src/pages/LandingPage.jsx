import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Menu, PieChart, ShieldCheck, Sparkles, WalletCards } from 'lucide-react';
import Brand from '../components/ui/Brand';
import Button from '../components/ui/Button';
import '../styles/landing.css';
import '../styles/landing-layout.css';

export default function LandingPage() {
  return <main className="landing landing-redesign">
    <nav className="landing-nav"><Brand /><div className="nav-links"><a href="#home">Home</a><a href="#features">Features</a><a href="#about">Why FinTrack</a><Link to="/login">Log in</Link><Link to="/signup" className="nav-signup">Get started</Link></div><Menu className="menu-icon" /></nav>
    <section className="landing-hero" id="home">
      <div className="landing-hero-copy"><p className="landing-kicker"><Sparkles size={15} /> YOUR MONEY, MADE CLEAR</p><h1>Build a calmer<br /><em>financial life.</em></h1><p>FinTrack brings your income, expenses, savings, and goals into one focused space—so every decision feels easier.</p><div className="landing-hero-actions"><Link to="/signup"><Button>Start tracking free <ArrowRight size={19} /></Button></Link><Link to="/login" className="landing-text-link">I already have an account</Link></div><div className="landing-proof"><CheckCircle2 size={17} /> Private by design. Built for everyday clarity.</div></div>
      <div className="landing-preview" aria-label="FinTrack dashboard preview"><div className="preview-top"><span>FINANCIAL OVERVIEW</span><b>August 2026</b><i><Sparkles size={17} /></i></div><div className="preview-balance"><span>Available to save</span><strong>₹28,450</strong><small><ArrowRight size={13} /> 18% more than last month</small></div><div className="preview-metrics"><article><span><WalletCards size={16} /></span><p>Income</p><b>₹68,000</b></article><article><span><PieChart size={16} /></span><p>Expenses</p><b>₹39,550</b></article></div><div className="preview-chart"><div className="preview-chart-head"><b>Monthly flow</b><span>Income <i /> Expenses</span></div><div className="preview-bars"><i style={{ height: '43%' }} /><i style={{ height: '68%' }} /><i style={{ height: '51%' }} /><i style={{ height: '86%' }} /><i style={{ height: '72%' }} /><i style={{ height: '96%' }} /></div></div></div>
    </section>
    <section className="landing-feature-row" id="features"><article><span><WalletCards size={19} /></span><div><b>One clear picture</b><p>Understand where your money goes.</p></div></article><article><span><PieChart size={19} /></span><div><b>Meaningful progress</b><p>Make savings a visible habit.</p></div></article><article><span><ShieldCheck size={19} /></span><div><b>Made for peace of mind</b><p>Your data stays yours, always.</p></div></article></section>
  </main>;
}
