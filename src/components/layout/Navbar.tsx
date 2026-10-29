import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useAuthStore } from '@/features/auth/useAuthStore';
import { Link, useLocation } from 'react-router-dom';
import { navItems } from './navigation';
import { KolaborasiLogo } from '@/components/shared/KolaborasiLogo';

export function Navbar() {
  const { user } = useAuthStore();
  const { pathname } = useLocation();
  const [time, setTime] = useState('');
  useEffect(() => {
    const formatter = new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false });
    let timer: ReturnType<typeof setTimeout>;
    const update = () => {
      setTime(formatter.format(new Date()));
      timer = setTimeout(update, 60_000 - (Date.now() % 60_000));
    };
    update();
    return () => clearTimeout(timer);
  }, []);
  const title = navItems.find(item => item.path === pathname)?.title || 'Profil pengguna';
  return (
    <header className="topbar">
      <div className="topbar-breadcrumb"><span className="mobile-institution-logos"><img src="/brand/sumatera-utara.png" alt="Lambang Pemerintah Provinsi Sumatera Utara" className="mobile-brand" /><KolaborasiLogo /></span><span className="desktop-breadcrumb">Diskominfo Sumut <span className="breadcrumb-divider">/</span></span><strong>{title}</strong></div>
      <div className="topbar-tools"><span className="workspace-clock"><Clock size={15} />{time} WIB</span><Link to="/profile" className="profile-link" aria-label="Buka profil"><span className="user-avatar">{user?.name?.[0]?.toUpperCase() || 'P'}</span><span className="profile-name">{user?.name || 'Pengguna'}</span></Link></div>
    </header>
  );
}
