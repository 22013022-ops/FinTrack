import { Link } from 'react-router-dom';
import { ArrowRight, Menu, PieChart, ShieldCheck, WalletCards } from 'lucide-react';
import Brand from '../components/ui/Brand';
import Button from '../components/ui/Button';
import landingHeroBackground from '../assets/images/landing-hero-background.png';
import '../styles/landing.css';
import '../styles/landing-layout.css';

export default function LandingPage() {
  return <main className="landing landing-redesign">
    <nav className="landing-nav"><Brand /><div className="nav-links"><a href="#home">Home</a><a href="#features">Features</a><a href="#about">Why FinTrack</a><Link to="/login">Log in</Link></div><Menu className="menu-icon" /></nav>
    <section className="landing-hero" id="home" style={{ '--landing-hero-background': `url(${landingHeroBackground})` }}>
      <div className="landing-hero-copy"><h1>Build a calmer<br /><em>financial life.</em></h1><p>FinTrack brings your income, expenses, savings, and goals into one focused space—so every decision feels easier.</p><div className="landing-hero-actions"><Link to="/signup"><Button>Let’s Start <ArrowRight size={19} /></Button></Link></div></div>
    </section>
    <section className="landing-feature-row" id="features"><article><span><WalletCards size={19} /></span><div><b>One clear picture</b><p>Understand where your money goes.</p></div></article><article><span><PieChart size={19} /></span><div><b>Meaningful progress</b><p>Make savings a visible habit.</p></div></article><article><span><ShieldCheck size={19} /></span><div><b>Made for peace of mind</b><p>Your data stays yours, always.</p></div></article></section>
  </main>;
}
