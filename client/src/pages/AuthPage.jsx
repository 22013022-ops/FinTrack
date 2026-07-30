import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Eye, LockKeyhole, Mail, UserRound } from 'lucide-react';
import Brand from '../components/ui/Brand';
import Button from '../components/ui/Button';

export default function AuthPage({ mode }) {
  const signup = mode === 'signup'; const navigate = useNavigate();
  const submit = (e) => { e.preventDefault(); navigate('/app/income'); };
  return <main className="auth-page"><Link className="back-link" to="/"><ArrowLeft size={18}/> Back to home</Link><div className="auth-shell"><aside className="auth-art"><Brand light /><div><p className="eyebrow">FINANCE, FINELY TUNED</p><h2>Make room for<br/><i>what matters.</i></h2><p>FinTrack brings your financial world into one elegant, reassuring view.</p></div><small>© 2026 FinTrack. Built for a brighter future.</small></aside><section className="auth-card"><div className="auth-heading"><p className="eyebrow">WELCOME {signup ? 'TO FINTRACK' : 'BACK'}</p><h1>{signup ? 'Create your account' : 'Sign in to your account'}</h1><p>{signup ? 'Start making more of every moment.' : 'Pick up right where you left off.'}</p></div><form onSubmit={submit}>{signup && <Field icon={<UserRound />} label="Full name" placeholder="Enter your full name" />}<Field icon={<Mail />} label="Email address" placeholder="you@example.com" type="email" /><Field icon={<LockKeyhole />} label="Password" placeholder="Enter your password" type="password" />{signup && <Field icon={<LockKeyhole />} label="Confirm password" placeholder="Repeat your password" type="password" />} {!signup && <a className="forgot" href="#forgot">Forgot password?</a>}<Button type="submit" className="auth-submit">{signup ? 'Create account' : 'Sign in'} <ArrowRight size={18} /></Button></form><p className="auth-switch">{signup ? 'Already have an account?' : "Don't have an account?"} <Link to={signup ? '/login' : '/signup'}>{signup ? 'Login' : 'Sign up'}</Link></p></section></div></main>;
}

function Field({ icon, label, ...props }) { return <label className="field"><span>{label}</span><div>{icon}<input required {...props}/>{props.type === 'password' && <Eye size={18}/>}</div></label>; }
