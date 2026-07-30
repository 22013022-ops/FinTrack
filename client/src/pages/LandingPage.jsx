import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Menu } from 'lucide-react';
import Brand from '../components/ui/Brand';
import Button from '../components/ui/Button';
import heroBackground from '../assets/hero-background.png';

export default function LandingPage() {
  return <main className="landing">
    <nav className="landing-nav"><Brand /><div className="nav-links"><a href="#home">Home</a><a href="#features">Features</a><a href="#about">About us</a><a href="#contact">Contact</a><Link to="/signup" className="nav-signup">Sign up</Link></div><Menu className="menu-icon" /></nav>
    <section className="hero" id="home" style={{ backgroundImage: `url(${heroBackground})` }}>
      <div className="hero-copy"><p className="eyebrow">YOUR FINANCES, REIMAGINED</p><h1>SPEND SMARTER.<br />SAVE BETTER!</h1><p className="hero-text">Take control of your finances with a clear, simple space designed to help every rupee work harder for you.</p><div className="hero-actions"><Link to="/login"><Button>Get Started <ArrowRight size={19} /></Button></Link><div className="trust"><CheckCircle2 size={17} /> Your privacy, protected</div></div></div>
    </section>
    <section className="feature-strip" id="features"><div><span>01</span><b>Clarity first</b><p>See your money at a glance.</p></div><div><span>02</span><b>Plan with confidence</b><p>Build habits that last.</p></div><div><span>03</span><b>Designed for you</b><p>A calmer way to manage money.</p></div></section>
  </main>;
}
