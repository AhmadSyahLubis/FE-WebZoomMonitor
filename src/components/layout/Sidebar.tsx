import { NavLink } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { useAuthStore } from '@/features/auth/useAuthStore';
import { authApi } from '@/features/auth/auth.api';
import { toast } from 'sonner';
import { BrandIcon } from '@/components/shared/BrandIcon';
import { navItems } from './navigation';
import { KolaborasiLogo } from '@/components/shared/KolaborasiLogo';

export function Sidebar() {
  const { user, deviceId, logout } = useAuthStore();
  const handleLogout = async () => {
    try { await authApi.logout(deviceId); }
    catch { /* Clear the local session even when the server is unavailable. */ }
    finally { logout(); toast.success('Berhasil keluar dari akun'); }
  };
  return (
    <aside className="sidebar">
      <NavLink to="/dashboard" className="brand-lockup"><img src="/brand/sumatera-utara.png" alt="Lambang Pemerintah Provinsi Sumatera Utara" width="44" height="55" /><span><strong>Diskominfo</strong><small>Provinsi Sumatera Utara</small></span></NavLink>
      <KolaborasiLogo className="sidebar-collaboration" />
      <div className="sidebar-label">Layanan rapat daring</div>
      <nav aria-label="Navigasi utama" className="sidebar-nav">
        {navItems.map(item => <NavLink key={item.path} to={item.path} className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}><BrandIcon name={item.icon} /><span>{item.title}</span></NavLink>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-note"><BrandIcon name="nav_calendar" /><strong>Koordinasi rapat instansi.</strong><p>Layanan meeting Pemerintah Provinsi Sumatera Utara, dikelola oleh Diskominfo.</p></div>
        <NavLink to="/profile" className="sidebar-profile"><span className="user-avatar">{user?.name?.[0]?.toUpperCase() || <User size={18} />}</span><span><strong>{user?.name || 'Pengguna'}</strong><small>@{user?.username || 'pengguna'}</small></span></NavLink>
        <button type="button" onClick={handleLogout} className="logout-button"><LogOut size={17} />Keluar dari akun</button>
      </div>
    </aside>
  );
}
