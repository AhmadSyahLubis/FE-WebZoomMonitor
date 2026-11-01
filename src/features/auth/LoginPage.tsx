import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, Lock, User, AlertCircle } from 'lucide-react';
import { authApi } from './auth.api';
import { useAuthStore } from './useAuthStore';
import { getWebDeviceId, WEB_DEVICE_NAME } from '@/lib/device';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BrandIcon } from '@/components/shared/BrandIcon';
import { InstitutionCopyright } from '@/components/shared/InstitutionCopyright';
import { KolaborasiLogo } from '@/components/shared/KolaborasiLogo';
import { toast } from 'sonner';

const loginSchema = z.object({ username: z.string().min(1, 'Username wajib diisi'), password: z.string().min(1, 'Password wajib diisi') });
type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema), defaultValues: { username: '', password: '' } });
  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const response = await authApi.login({ ...data, device_id: getWebDeviceId(), device_name: WEB_DEVICE_NAME });
      login(response);
      toast.success(`Selamat datang kembali, ${response.user.name}!`);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const message = err.response?.data?.message || 'Gagal masuk. Periksa kembali username dan password Anda.';
      setApiError(message);
      toast.error(message);
    } finally { setIsLoading(false); }
  };
  return (
    <main className="login-page">
      <div className="login-shell">
        <section className="login-visual">
          <img src="/images/hybrid_desk_login.webp" alt="" />
          <div className="login-institution-logos"><div className="login-brand"><img src="/brand/sumatera-utara.png" alt="Lambang Pemerintah Provinsi Sumatera Utara" /><span>Pemerintah Provinsi<br />Sumatera Utara</span></div><KolaborasiLogo /></div>
          <div className="login-visual-copy"><h1>Sistem Informasi Pengelolaan Virtual Meeting</h1><p>Monitoring akun Zoom, booking jadwal meeting, dan pengelolaan rekaman untuk kebutuhan Pemerintah Provinsi Sumatera Utara.</p><div className="login-features"><span><BrandIcon name="nav_dashboard" />Monitoring</span><span><BrandIcon name="nav_calendar" />Booking</span><span><BrandIcon name="nav_recordings" />Rekaman</span></div></div>
        </section>
        <section className="login-form-panel" aria-labelledby="login-title">
          <span className="text-xs font-medium text-blue-600">Dinas Komunikasi dan Informatika<br />Provinsi Sumatera Utara</span>
          <h2 id="login-title">Selamat datang kembali</h2>
          <p>Masuk dengan akun instansi yang terdaftar. Sesi tetap aktif selama tab browser terbuka.</p>
          {apiError && <div role="alert" className="mt-5 flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"><AlertCircle size={17} className="shrink-0" />{apiError}</div>}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div><Label htmlFor="username" required>Username</Label><div className="relative"><Input id="username" {...register('username')} placeholder="Masukkan username" className="pl-11" error={errors.username?.message} aria-invalid={!!errors.username} aria-describedby={errors.username ? 'username-error' : undefined} autoComplete="username" /><User size={17} className="absolute left-4 top-4 text-slate-500 pointer-events-none" /></div></div>
            <div><Label htmlFor="password" required>Password</Label><div className="relative"><Input id="password" {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="Masukkan password" className="pl-11 pr-12" error={errors.password?.message} aria-invalid={!!errors.password} aria-describedby={errors.password ? 'password-error' : undefined} autoComplete="current-password" /><Lock size={17} className="absolute left-4 top-4 text-slate-500 pointer-events-none" /><button type="button" className="password-toggle" aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
            <Button type="submit" isLoading={isLoading} className="w-full min-h-12 mt-2">{isLoading ? 'Sedang masuk…' : 'Masuk ke beranda'}</Button>
          </form>
          <footer><strong>Sistem Informasi Pengelolaan Virtual Meeting</strong><InstitutionCopyright /></footer>
        </section>
      </div>
    </main>
  );
}
