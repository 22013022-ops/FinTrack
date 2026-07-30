import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BanknoteArrowUp, ChartNoAxesCombined, CircleDollarSign, Goal, LayoutDashboard, LogOut } from 'lucide-react';
import Brand from '../components/ui/Brand';

const links = [['income','Income',BanknoteArrowUp],['expenses','Expenses',CircleDollarSign],['budget','Budget',ChartNoAxesCombined],['goals','Goals',Goal],['dashboard','Dashboard',LayoutDashboard]];
export default function AppLayout() { const navigate = useNavigate(); return <div className="app-shell"><aside className="sidebar"><Brand /><nav>{links.map(([to,label,Icon])=><NavLink key={to} to={to}><Icon size={20}/><span>{label}</span></NavLink>)}</nav><button className="logout" onClick={()=>navigate('/')}><LogOut size={20}/><span>Logout</span></button></aside><main className="app-content"><Outlet /></main><nav className="mobile-nav">{links.map(([to,label,Icon])=><NavLink key={to} to={to}><Icon size={21}/><span>{label}</span></NavLink>)}</nav></div>; }
