import { NavLink } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { useAuthStore } from '@/features/auth/useAuthStore';
import { authApi } from '@/features/auth/auth.api';
import { toast } from 'sonner';
import { BrandIcon } from '@/components/shared/BrandIcon';
import { navItems } from './navigation';

export function Sidebar() {
  const { user, deviceId, logout } = useAuthStore();
  const handleLogout = async () => {
    try { await authApi.logout(deviceId); }
    catch { /* Clear the local session even when the server is unavailable. */ }
    finally { logout(); toast.success('Berhasil keluar dari akun'); }
  };
  return (
    <aside className="sidebar">
      <NavLink to="/dashboard" className="brand-lockup"><img src="/brand/zoom-monitor.svg" alt="" width="44" height="44" /><span><strong>Zoom Monitor</strong><small>Ruang kerja perusahaan</small></span></NavLink>
      <div className="sidebar-label">Ruang kerja</div>
      <nav aria-label="Navigasi utama" className="sidebar-nav">
        {navItems.map(item => <NavLink key={item.path} to={item.path} className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}><BrandIcon name={item.icon} /><span>{item.title}</span></NavLink>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-note"><BrandIcon name="nav_calendar" /><strong>Satu tempat untuk setiap meeting.</strong><p>Pantau akun, atur jadwal, dan temukan rekaman.</p></div>
        <NavLink to="/profile" className="sidebar-profile"><span className="user-avatar">{user?.name?.[0]?.toUpperCase() || <User size={18} />}</span><span><strong>{user?.name || 'Pengguna'}</strong><small>@{user?.username || 'pengguna'}</small></span></NavLink>
        <button type="button" onClick={handleLogout} className="logout-button"><LogOut size={17} />Keluar dari akun</button>
      </div>
    </aside>
  );
}
