import React, { useState } from 'react';
import { PageBanner } from '@/components/shared/PageBanner';
import { QueryError } from '@/components/shared/QueryError';
import { useQuery } from '@tanstack/react-query';
import { recordingsApi } from './recordings.api';
import { recordingRowKey } from './recordingIdentity';
import { accountsApi } from '@/features/accounts/accounts.api';
import { queryKeys } from '@/lib/queryClient';
import type { ListRecordingsFilter } from '@/types/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Video,
  Search,
  Play,
  Download,
  Share2,
  ChevronDown,
  ChevronUp,
  FileText,
  Music,
  Film,
} from 'lucide-react';
import { formatWIBDateTime, formatFileSize } from '@/lib/utils';
import { toast } from 'sonner';

export const RecordingsPage: React.FC = () => {
  const [filter, setFilter] = useState<ListRecordingsFilter>({
    from: '',
    to: '',
    search: '',
    account_id: undefined,
  });
  const [appliedFilter, setAppliedFilter] = useState(filter);
  const applyFilters = () => {
    if (JSON.stringify(filter) === JSON.stringify(appliedFilter)) void refetch();
    else setAppliedFilter({ ...filter });
  };
  const resetFilters = () => {
    const empty = { from: '', to: '', search: '', account_id: undefined };
    setFilter(empty);
    setAppliedFilter(empty);
  };

  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Accounts for filter
  const { data: accounts = [] } = useQuery({
    queryKey: queryKeys.accounts,
    queryFn: accountsApi.list,
  });

  // Recordings Query
  const {
    data: recordings = [],
    isLoading,
    isFetching,
    refetch,
    isError,
  } = useQuery({
    queryKey: queryKeys.recordings(appliedFilter),
    queryFn: ({ signal }) => recordingsApi.list(appliedFilter, signal),
  });

  const toggleExpand = (id: string) => {
    setExpandedId(current => current === id ? null : id);
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType.toUpperCase()) {
      case 'MP4':
        return <Film className="w-4 h-4 text-blue-500" />;
      case 'M4A':
        return <Music className="w-4 h-4 text-emerald-500" />;
      case 'TRANSCRIPT':
      case 'CHAT':
      case 'CC':
      case 'VTT':
        return <FileText className="w-4 h-4 text-amber-500" />;
      default:
        return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <PageBanner title="Arsip rekaman rapat" description="Telusuri video, audio, dan transkrip rapat Diskominfo Provinsi Sumatera Utara." image="recordings_console.webp" />

      {isError && <QueryError onRetry={() => refetch()} />}
      {/* Filter Card */}
      <Card className="border-slate-200 bg-white shadow-xs">
        <CardContent className="p-4">
          <form onSubmit={event => { event.preventDefault(); applyFilters(); }} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 items-end">
            <div>
              <Label htmlFor="recording_search" className="text-xs">Cari Topik / Host</Label>
              <div className="relative">
                <Input
                  placeholder="Ketik kata kunci..."
                  id="recording_search"
                  value={filter.search || ''}
                  onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                  className="h-9 text-xs pl-8"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <Label htmlFor="recording_account" className="text-xs">Filter Akun Zoom</Label>
              <select
                id="recording_account"
                value={filter.account_id || ''}
                onChange={(e) =>
                  setFilter({
                    ...filter,
                    account_id: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <option value="">Semua Akun Zoom</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.account_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs">Rentang Tanggal (Maks 6 Bulan)</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  aria-label="Tanggal mulai rekaman"
                  value={filter.from || ''}
                  onChange={(e) => setFilter({ ...filter, from: e.target.value })}
                  className="h-9 text-xs"
                />
                <Input
                  type="date"
                  aria-label="Tanggal akhir rekaman"
                  value={filter.to || ''}
                  onChange={(e) => setFilter({ ...filter, to: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={resetFilters}
                className="h-9 text-xs flex-1"
              >
                Reset Filter
              </Button>
              <Button
                size="sm"
                type="submit"
                isLoading={isFetching}
                className="h-9 text-xs flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Cari Rekaman
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* List of Recordings */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <Video className="w-4 h-4 text-blue-600" />
          <span>Daftar Rekaman ({recordings.length} Sesi Rapat)</span>
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-5 space-y-3">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </Card>
            ))}
          </div>
        ) : recordings.length === 0 && !isError ? (
          <Card className="p-12 text-center border-dashed">
            <img src="/icons/state_recordings.svg" alt="" className="w-40 h-24 mx-auto mb-3" />
            <p className="font-semibold text-slate-800">Tidak ada rekaman yang ditemukan</p>
            <p className="text-xs text-slate-400 mt-1">
              Pastikan rentang tanggal sesuai atau meeting tersebut telah diaktifkan fitur Cloud Recording.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {recordings.map((rec) => {
              const recordingKey = recordingRowKey(rec);
              const isExpanded = expandedId === recordingKey;

              return (
                <Card
                  key={recordingKey}
                  className="border-slate-200 bg-white transition-all shadow-xs overflow-hidden"
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left info */}
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-base text-slate-900">{rec.topic}</h3>
                          <Badge variant="outline" className="text-[10px] text-slate-600 bg-slate-50">
                            {rec.account_name}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span>{formatWIBDateTime(rec.start_time)}</span>
                          <span>•</span>
                          <span>Durasi: {rec.duration} Menit</span>
                          <span>•</span>
                          <span>Host: {rec.host_name || '-'}</span>
                          <span>•</span>
                          <span className="font-mono text-slate-700 font-medium">
                            Total: {formatFileSize(rec.total_size)}
                          </span>
                        </div>
                      </div>

                      {/* Right actions */}
                      <div className="flex items-center gap-2 self-end md:self-auto">
                        {rec.share_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={() => {
                              navigator.clipboard.writeText(rec.share_url);
                              toast.success('Tautan share rekaman disalin!');
                            }}
                          >
                            <Share2 className="w-3.5 h-3.5 mr-1" />
                            <span>Share Link</span>
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-slate-700"
                          onClick={() => toggleExpand(recordingKey)}
                          aria-expanded={isExpanded}
                        >
                          <span className="mr-1">
                            {rec.recording_files?.length || 0} File Rekaman
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Expandable Files Area */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                        <p className="text-xs font-semibold text-slate-700 mb-2">
                          Daftar File Cloud Zoom:
                        </p>
                        {rec.recording_files && rec.recording_files.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            {rec.recording_files.map((file, idx) => (
                              <div
                                key={idx}
                                className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-wrap gap-3 items-center justify-between text-xs"
                              >
                                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                  {getFileIcon(file.file_type)}
                                  <div className="min-w-0">
                                    <p className="font-semibold text-slate-800 truncate">
                                      {file.file_type} ({file.recording_type.replace(/_/g, ' ')})
                                    </p>
                                    <p className="text-slate-400 text-[11px]">
                                      {formatFileSize(file.file_size)}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  {file.play_url && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 px-2 text-xs text-blue-600 hover:bg-blue-50"
                                      onClick={() => window.open(file.play_url, '_blank')}
                                    >
                                      <Play className="w-3 h-3 mr-1" />
                                      <span>Putar</span>
                                    </Button>
                                  )}
                                  {file.download_url && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 px-2 text-xs text-slate-700 hover:bg-slate-100"
                                      onClick={() => window.open(file.download_url, '_blank')}
                                    >
                                      <Download className="w-3 h-3 mr-1" />
                                      <span>Unduh</span>
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">
                            Tidak ada file yang dapat diunduh untuk sesi ini.
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
