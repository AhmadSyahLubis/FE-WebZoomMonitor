import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useAuthStore } from '@/features/auth/useAuthStore';
import { Link, useLocation } from 'react-router-dom';
import { navItems } from './navigation';

export function Navbar() {
  const { user } = useAuthStore();
  const { pathname } = useLocation();
  const [time, setTime] = useState('');
  useEffect(() => {
    const update = () => setTime(new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);
  const title = navItems.find(item => item.path === pathname)?.title || 'Profil pengguna';
  return (
    <header className="topbar">
      <div className="topbar-breadcrumb"><img src="/brand/zoom-monitor.svg" alt="" className="mobile-brand" /><span className="desktop-breadcrumb">Ruang kerja <span className="breadcrumb-divider">/</span></span><strong>{title}</strong></div>
      <div className="topbar-tools"><span className="workspace-clock"><Clock size={15} />{time} WIB</span><Link to="/profile" className="profile-link" aria-label="Buka profil"><span className="user-avatar">{user?.name?.[0]?.toUpperCase() || 'P'}</span><span className="profile-name">{user?.name || 'Pengguna'}</span></Link></div>
    </header>
  );
}
