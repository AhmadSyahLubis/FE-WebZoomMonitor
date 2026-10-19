import { NavLink, Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { navItems } from './navigation';
import { Navbar } from './Navbar';
import { BrandIcon } from '@/components/shared/BrandIcon';

export function AppLayout() {
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">Langsung ke konten</a>
      <div className="desktop-sidebar"><Sidebar /></div>
      <div className="workspace"><Navbar /><main id="main-content" className="workspace-content"><div className="page-container"><Outlet /></div></main></div>
      <nav className="mobile-navigation" aria-label="Navigasi utama">
        {navItems.map(item => <NavLink key={item.path} to={item.path} className={({ isActive }) => isActive ? 'is-active' : ''}><BrandIcon name={item.icon} /><span>{item.short}</span></NavLink>)}
      </nav>
    </div>
  );
}
