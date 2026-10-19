// ═══════════════════════════════════════
// API Response Wrapper
// ═══════════════════════════════════════
export interface APIResponse<T = any> {
  success: boolean;
  message: string;
  error_code?: string;
  data?: T;
  errors?: any;
}

// ═══════════════════════════════════════
// AUTH DTOs
// ═══════════════════════════════════════
export interface LoginRequest {
  username: string;
  password: string;
  device_id: string;
  device_name: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
  device_id: string;
}

export interface LogoutRequest {
  device_id?: string;
}

export interface UserResponse {
  id: number;
  name: string;
  username: string;
  email?: string | null;
  has_pin: boolean;
  biometric_enabled: boolean;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;    // "Bearer"
  expires_in: number;    // detik (900 = 15 menit)
  user: UserResponse;
  has_pin: boolean;
  biometric_enabled: boolean;
}

// ═══════════════════════════════════════
// DASHBOARD DTOs
// ═══════════════════════════════════════
export type AccountStatus = 'available' | 'meeting' | 'scheduled' | 'error';

export interface DashboardAccountSummary {
  id: number;
  account_name: string;
  email?: string | null;
  host_key?: string | null;
  status: AccountStatus;
  current_topic?: string | null;
  meeting_capacity: number;
  plan_type: string;     // "Basic", "Licensed", "On-Prem"
  last_updated: string;  // ISO 8601
}

export interface AccountStatusResponse {
  account_id: number;
  status: AccountStatus;
  topic?: string | null;
  start_time?: string;   // "14:00" (HH:MM WIB)
  end_time?: string;     // "15:30" (HH:MM WIB)
  host_name?: string;
}

export interface AccountSpecsResponse {
  account_id: number;
  meeting_capacity: number;
  plan_type: string;
  error?: string | null;
}

// ═══════════════════════════════════════
// ZOOM ACCOUNT DTOs
// ═══════════════════════════════════════
export interface AccountResponse {
  id: number;
  account_name: string;
  email?: string | null;
  host_key?: string | null;
  has_token: boolean;
  token_expires_at?: string | null;  // ISO 8601
  created_at: string;
  updated_at: string;
}

export interface CreateAccountRequest {
  account_name: string;
  email?: string;
  zoom_account_id: string;
  host_key?: string;
  client_id: string;
  client_secret: string;
}

export interface UpdateAccountRequest {
  account_name: string;
  email?: string;
  zoom_account_id?: string;  // Kosong = pertahankan lama
  host_key?: string;         // Kosong = pertahankan lama
  client_id?: string;        // Kosong = pertahankan lama
  client_secret?: string;    // Kosong = pertahankan lama
}

export interface CheckConnectionResponse {
  success: boolean;
  account_id: number;
  account_name: string;
  active_users_count: number;
  message: string;
}

// ═══════════════════════════════════════
// BOOKING & MEETING DTOs
// ═══════════════════════════════════════
export interface MeetingSummary {
  topic: string;
  start_time: string;  // "HH:MM"
  end_time: string;    // "HH:MM"
}

export interface AccountRef {
  id: number;
  name: string;
}

export interface AvailabilityResult {
  id: string;
  account: AccountRef;
  user_name: string;
  email: string;
  booking_user_id: string;
  status: 'AVAILABLE' | 'BUSY' | 'ERROR';
  details: string;
  conflicting_meeting?: MeetingSummary | null;
  live_meeting?: MeetingSummary | null;
  scheduled_now?: MeetingSummary | null;
}

export interface BookMeetingRequest {
  account_id: number;
  booking_user_id: string;
  topic: string;
  date: string;              // "YYYY-MM-DD"
  time: string;              // "HH:MM"
  duration: number;          // menit, minimal 15
  is_recurring: boolean;
  recurrence_type?: number;  // 1=daily, 2=weekly, 3=monthly
  repeat_interval?: number;
  weekly_days?: string;      // "1,2,3,4,5,6,7"
  end_date_time?: string;    // ISO 8601 UTC
  ignore_conflict: boolean;
}

export interface BookingCreatedResponse {
  id: number;
  uuid: string;
  topic: string;
  start_time: string;
  duration: number;
  join_url: string;
  password: string;
  host_key?: string;
  type: number;
}

export interface UpdateMeetingRequest {
  account_id: number;
  topic: string;
  start_time: string;         // "YYYY-MM-DD HH:MM" (WIB)
  duration: number;
  is_recurring: boolean;
  recurrence_type?: number | null;
  repeat_interval?: number | null;
  weekly_days?: string | null;
  end_date_time?: string | null;
}

export interface DeleteMeetingRequest {
  account_id: number;
  delete_option: 'all' | 'occurrence';
  occurrence_id?: string;
}

export interface EndMeetingRequest {
  account_id: number;
}

export interface ScheduleItem {
  id: number;
  meeting_id: number;
  account_id: number;
  account_name: string;
  host_key?: string | null;
  host: string;
  topic: string;
  password: string;
  start_time: string;    // ISO 8601
  end_time: string;      // ISO 8601
  duration: number;      // menit
  join_url: string;
  type: number;          // 1=instant, 2=scheduled, 3=rec no fixed, 8=rec fixed
  occurrence_id?: string | null;
}

export interface SchedulesResponse {
  live_meetings: ScheduleItem[];
  upcoming_meetings: ScheduleItem[];
  past_meetings: ScheduleItem[];
}

export interface ListSchedulesFilter {
  start_date?: string;   // "YYYY-MM-DD"
  end_date?: string;     // "YYYY-MM-DD"
  search?: string;
  account_id?: number;
}

export interface ZoomOccurrence {
  occurrence_id: string;
  start_time: string;
  duration: number;
  status: string;  // "deleted" | "available"
}

export interface ZoomMeetingDetail {
  id: number;
  uuid: string;
  host_id: string;
  topic: string;
  type: number;
  status: string;
  start_time: string;
  duration: number;
  timezone: string;
  created_at: string;
  join_url: string;
  password: string;
  occurrences?: ZoomOccurrence[];
}

// ═══════════════════════════════════════
// RECORDING DTOs
// ═══════════════════════════════════════
export interface RecordingFile {
  file_type: string;        // "MP4", "M4A", "TRANSCRIPT", "CHAT", "CC"
  file_extension: string;   // "MP4", "M4A", "VTT", "TXT"
  file_size: number;        // bytes
  download_url: string;
  play_url: string;
  recording_type: string;   // "shared_screen_with_speaker_view", "audio_only", "audio_transcript"
  status: string;           // "completed", "processing"
  recording_start: string;  // ISO 8601
  recording_end: string;    // ISO 8601
}

export interface RecordingItem {
  meeting_id: number;
  uuid: string;
  topic: string;
  start_time: string;        // ISO 8601
  duration: number;          // menit
  total_size: number;        // bytes
  share_url: string;
  recording_count: number;
  recording_files: RecordingFile[];
  account_name: string;
  account_id: number;
  host_name: string;
  host_email: string;
}

export interface ListRecordingsFilter {
  from?: string;
  to?: string;
  search?: string;
  account_id?: number;
}

// ═══════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════
export interface HealthCheckResponse {
  status: string;
  app_name: string;
  env: string;
  uptime: string;
  timestamp: string;
  services: {
    postgres: string;  // "connected" | "disconnected" | "not_initialized"
    redis: string;
  };
}
