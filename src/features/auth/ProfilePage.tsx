import React from 'react';
import { QueryError } from '@/components/shared/QueryError';
import { useQuery } from '@tanstack/react-query';
import { authApi } from './auth.api';
import { useAuthStore } from './useAuthStore';
import { queryKeys } from '@/lib/queryClient';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  User,
  Laptop,
  LogOut,
} from 'lucide-react';
import { toast } from 'sonner';

export const ProfilePage: React.FC = () => {
  const { user: localUser, deviceId, logout } = useAuthStore();

  const { data: me, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.me,
    queryFn: authApi.getMe,
  });

  const currentUser = me || localUser;

  const handleLogout = async () => {
    try {
      await authApi.logout(deviceId);
    } catch {
      // Ignore
    } finally {
      logout();
      toast.success('Berhasil logout dari sistem');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Profil pengguna
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Informasi sesi aktif dan detail akun pengguna
        </p>
      </div>

      {isError && <QueryError onRetry={() => refetch()} />}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Card */}
        <Card className="md:col-span-1 border-slate-200 bg-white shadow-xs text-center p-6 flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-semibold text-2xl mb-4">
            {currentUser?.name ? currentUser.name[0].toUpperCase() : 'A'}
          </div>
          <h2 className="text-lg font-bold text-slate-900">{currentUser?.name || 'Pengguna'}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{currentUser?.username ? `@${currentUser.username}` : 'Username belum tersedia'}</p>
          <Badge className="mt-3 bg-blue-50 text-blue-700 border-blue-200">
            Akun pengguna
          </Badge>

          <Button
            variant="destructive"
            size="sm"
            onClick={handleLogout}
            className="w-full mt-6"
          >
            <LogOut className="w-4 h-4 mr-1.5" />
            <span>Keluar Akun</span>
          </Button>
        </Card>

        {/* Detailed Info Card */}
        <Card className="md:col-span-2 border-slate-200 bg-white shadow-xs">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <span>Informasi Kredensial & Hak Akses</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-sm">
                <div className="py-3 flex justify-between items-center">
                  <span className="text-slate-500">ID Pengguna</span>
                  <span className="font-mono font-medium text-slate-900">
                    {currentUser?.id ? `#${currentUser.id}` : 'Belum tersedia'}
                  </span>
                </div>

                <div className="py-3 flex justify-between items-center">
                  <span className="text-slate-500">Nama Lengkap</span>
                  <span className="font-semibold text-slate-900">
                    {currentUser?.name || 'Belum tersedia'}
                  </span>
                </div>

                <div className="py-3 flex justify-between items-center">
                  <span className="text-slate-500">Username</span>
                  <span className="font-mono text-slate-900">
                    {currentUser?.username || 'Belum tersedia'}
                  </span>
                </div>

                <div className="py-3 flex justify-between items-center">
                  <span className="text-slate-500">Email Dinas</span>
                  <span className="text-slate-900">
                    {currentUser?.email || 'Belum diatur'}
                  </span>
                </div>

                <div className="py-3 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-500">Web Device ID</span>
                  </div>
                  <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    {deviceId}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
