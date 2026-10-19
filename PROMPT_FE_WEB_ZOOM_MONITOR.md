# 🖥️ PROMPT: Bangun Frontend Web — Zoom Monitor (React + Vite + TypeScript)

> **Dokumen ini adalah arahan LENGKAP dan DEFINITIF untuk AI Agent agar membangun Frontend Web Zoom Monitor dari NOL.**
> Dokumen ini di-reverse-engineer dari seluruh source code API backend (Go + Chi + PostgreSQL + Redis) yang sudah **production-ready**, mencakup setiap endpoint, request/response DTO, business logic, validasi, dan error handling.

---

## 📋 Daftar Isi

1. [Project Overview](#1-project-overview)
2. [Tech Stack Frontend](#2-tech-stack-frontend)
3. [API Base Configuration & Auth Token Management](#3-api-base-configuration--auth-token-management)
4. [Standard API Response Format](#4-standard-api-response-format)
5. [Halaman & Fitur — Lengkap](#5-halaman--fitur--lengkap)
   - 5.1 [Login Page](#51-login-page)
   - 5.2 [Dashboard Monitoring](#52-dashboard-monitoring)
   - 5.3 [Zoom Account Management (CRUD)](#53-zoom-account-management-crud)
   - 5.4 [Smart Search & Book Meeting](#54-smart-search--book-meeting)
   - 5.5 [Schedule Management](#55-schedule-management)
   - 5.6 [Cloud Recordings](#56-cloud-recordings)
   - 5.7 [User Profile / Settings](#57-user-profile--settings)
6. [API Endpoints — Referensi Lengkap](#6-api-endpoints--referensi-lengkap)
7. [TypeScript Interfaces — Seluruh DTO](#7-typescript-interfaces--seluruh-dto)
8. [Authentication Flow — Detail](#8-authentication-flow--detail)
9. [Error Handling & Error Codes](#9-error-handling--error-codes)
10. [State Management & Data Fetching](#10-state-management--data-fetching)
11. [UI/UX Design Guidelines](#11-uiux-design-guidelines)
12. [Routing & Navigation Structure](#12-routing--navigation-structure)
13. [Environment Variables Frontend](#13-environment-variables-frontend)
14. [Phase-by-Phase Development Roadmap](#14-phase-by-phase-development-roadmap)

---

## 1. Project Overview

**Zoom Monitor** adalah sistem monitoring dan booking ruang rapat virtual terintegrasi untuk manajemen akun Zoom Corporate (Enterprise / Corporate Organization). Frontend Web ini adalah **dashboard admin berbasis browser** yang mengonsumsi seluruh API backend Go yang sudah ada.

### Fitur Utama yang Harus Diimplementasikan di FE Web:
1. **Login & Session Management** — Login password, token refresh otomatis, logout instant.
2. **Dashboard Monitoring Realtime** — Status seluruh akun Zoom (Available / Meeting / Scheduled / Error) dengan auto-refresh.
3. **Zoom Account CRUD** — Tambah, edit, hapus, dan tes koneksi akun Zoom S2S OAuth.
4. **Smart Search & Book** — Cari ketersediaan jadwal → tampilkan status per akun → booking langsung.
5. **Schedule Management** — Lihat semua meeting (Live, Upcoming, Past) dengan filter tanggal, akun, dan keyword. Update, hapus, dan akhiri meeting live.
6. **Cloud Recordings** — Akses arsip rekaman cloud Zoom dari semua akun dengan pencarian dan filter.
7. **User Profile** — Lihat data user yang sedang login.

### Perbedaan dengan Mobile App (Flutter):
- **FE Web TIDAK memerlukan** fitur PIN 6-digit, Biometric Login, atau Device Management — fitur-fitur tersebut khusus mobile.
- FE Web menggunakan `device_id` hardcoded/generated (misal `"web-admin-{uuid}"`) untuk memenuhi field wajib pada API login.
- FE Web fokus pada **Dashboard Admin** dan **Management Features**.

---

## 2. Tech Stack Frontend

Sistem ini dirancang sebagai **Internal Enterprise Admin Dashboard (SPA)** yang terisolasi di balik autentikasi. Pemilihan stack berfokus pada kecepatan render, kesederhanaan manajemen token & interceptor di browser, efisiensi caching, dan kemudahan deployment statis.

| Layer | Teknologi Pilihan | Alasan Teknis & Catatan |
|---|---|---|
| **Core & Bundler** | **React 18/19 + Vite** (SPA) | Build cepat, HMR instan, bundle ringan. Menghilangkan kompleksitas SSR/RSC Next.js yang tidak dibutuhkan untuk admin internal. Hasil build statis siap deploy ke Nginx/Docker. |
| **Language** | **TypeScript (Strict Mode)** | Type-safe API consumption. Menjamin keselarasan kontrak DTO dari API backend Go. |
| **Styling** | **Tailwind CSS (v3/v4)** | Utility-first CSS, styling dinamis status badge (`available`, `meeting`, `scheduled`, `error`), responsive design cepat. |
| **UI Primitives** | **shadcn/ui (Radix UI)** | Headless & fully accessible UI primitives (Dialog, Dropdown, Popover, Tabs, Skeleton, Tooltip, Sheet). Kode dimiliki langsung di project (`/components/ui`), zero vendor lock-in. |
| **Routing** | **React Router v6/v7** | Standar routing SPA dengan data APIs, nested layout (Sidebar + Header), dan `<ProtectedRoute>` guards. |
| **Server State / Cache** | **TanStack Query (React Query) v5** | Handling auto-refresh polling 30 detik pada dashboard, window focus refetching, optimistic updates, dan cache invalidation otomatis. |
| **Global Client State** | **Zustand** | Manajemen client-only state: token sesi (`access_token`, `refresh_token`), user profile, `device_id`, dan toggle sidebar. Sangat ringan (<2KB). |
| **HTTP Client** | **Axios** | Interceptor request (Bearer token) dan response (Auto-refresh token queue saat 401 / RTR). |
| **Form Handling** | **React Hook Form + Zod** | Validasi client-side deklaratif dengan tipe otomatis untuk Login, CRUD Akun, dan Smart Booking. |
| **Tabel / Data Grid** | **TanStack Table v8** | Headless data grid untuk Schedule Management & Akun: sorting, keyword search, filtering tab, pagination. |
| **Date & Timezone** | **date-fns** & **date-fns-tz** | Konversi format tanggal & waktu ISO UTC (`Z`) dari Zoom ke format WIB (`Asia/Jakarta` / UTC+7). |
| **Icons** | **Lucide React** | Icon set modern, konsisten, dan tree-shakeable. |
| **Notifications / Toast** | **Sonner** | Toast notification modern dan elegan untuk feedback aksi user (success/error/warning). |
| **Responsive** | **Mobile-first responsive design** | Optimal di desktop (>1024px), tablet (768px-1024px), dan mobile (<768px) dengan sidebar collapse. |

### 2.1 Arsitektur Folder Project (*Feature-Driven*)

Struktur project menggunakan pola domain/feature-driven agar mudah dirawat, diskalakan, dan dipahami oleh AI Agent maupun developer:

```text
src/
├── assets/                  # Logo instansi, favicon, ilustrasi SVG
├── components/
│   ├── ui/                  # Komponen shadcn/ui (button, dialog, badge, table, input, tabs, skeleton)
│   ├── layout/              # AppLayout, Sidebar, Navbar, PageHeader
│   └── shared/              # StatusBadge, ConfirmDialog, CopyButton, EmptyState, DataTable
├── features/                # Domain-Driven Modules
│   ├── auth/                # LoginPage, useAuthStore, auth.api.ts, auth.schemas.ts
│   ├── dashboard/           # DashboardPage, AccountCard, StatsSummary, useDashboardQuery.ts
│   ├── accounts/            # AccountsPage, AccountFormModal, TestConnectionDialog, accounts.api.ts
│   ├── bookings/            # SearchBookingPage, BookingModal, AvailabilityCard, bookings.api.ts
│   ├── schedules/           # SchedulesPage, MeetingTabs (Live/Upcoming/Past), EndMeetingDialog
│   └── recordings/          # RecordingsPage, RecordingCard, FileDownloadList
├── hooks/                   # Custom reusable hooks (useDebounce, useClipboard, useMediaQuery)
├── lib/
│   ├── api.ts               # Axios instance + 401 Refresh Token Queue Interceptor
│   ├── queryClient.ts       # TanStack Query Client global configuration
│   ├── device.ts            # getWebDeviceId() generator (UUID)
│   └── utils.ts             # formatWIBTime, cn helper (clsx + tailwind-merge)
├── types/                   # Seluruh TypeScript DTO & API Interfaces (Bagian 7)
├── router/                  # ProtectedRoute, AppRoutes, route configuration
├── App.tsx                  # Root Provider wrapper (QueryClient, Toaster, Router)
├── main.tsx                 # Entrypoint Vite
└── vite-env.d.ts            # Vite environment variables type declarations
```

### 2.2 Rationale Arsitektural: Kenapa Vite (SPA) Lebih Unggul untuk Kasus Ini?
1. **Tidak Ada Kebutuhan SEO:** Aplikasi ini adalah dashboard admin internal corporate (Enterprise / Corporate Organization) yang seluruh fiturnya berada di balik login. SSR (Server-Side Rendering) dari Next.js tidak memberikan manfaat SEO apa pun.
2. **Kesesuaian Autentikasi Client-Side:** Auto-refresh token rotation (RTR) dengan Axios interceptor dan queue handling berjalan 100% konsisten di browser tanpa problem sinkronisasi cookies/headers antara Server Components dan Client Components di Next.js App Router.
3. **Infrastruktur Ringan & Efisien:** Hasil build Vite adalah static bundle (`dist/`) yang dapat disajikan langsung oleh Nginx atau container Docker Alpine berukuran sangat kecil tanpa perlu menjalankan Node.js runtime server.

---

## 3. API Base Configuration & Auth Token Management

### 3.1 Axios Instance Setup

```typescript
// lib/api.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// --- Request Interceptor: Inject Access Token ---
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Response Interceptor: Auto Refresh Token pada 401 ---
let isRefreshing = false;
let failedQueue: Array<{ resolve: Function; reject: Function }> = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const deviceId = localStorage.getItem('device_id');

        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
          device_id: deviceId,
        });

        const newAccessToken = data.data.access_token;
        const newRefreshToken = data.data.refresh_token;

        localStorage.setItem('access_token', newAccessToken);
        localStorage.setItem('refresh_token', newRefreshToken);

        failedQueue.forEach(({ resolve }) => resolve(newAccessToken));
        failedQueue = [];

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        failedQueue.forEach(({ reject }) => reject(refreshError));
        failedQueue = [];
        // Redirect ke login
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

### 3.2 Device ID Generation untuk Web

```typescript
// lib/device.ts
import { v4 as uuidv4 } from 'uuid';

export function getWebDeviceId(): string {
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = `web-admin-${uuidv4()}`;
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
}

export const WEB_DEVICE_NAME = 'Web Admin Dashboard';
```

---

## 4. Standard API Response Format

**Semua response dari API mengikuti format JSON berikut secara konsisten:**

### Success Response:
```json
{
  "success": true,
  "message": "Daftar akun Zoom berhasil diambil",
  "data": { ... }
}
```

### Error Response:
```json
{
  "success": false,
  "message": "Waktu bertabrakan dengan meeting: 'Koordinasi Lapangan' (14:00 - 15:30)",
  "error_code": "MEETING_CONFLICT",
  "errors": null
}
```

### TypeScript Wrapper:
```typescript
interface APIResponse<T = any> {
  success: boolean;
  message: string;
  error_code?: string;
  data?: T;
  errors?: any;
}
```

### HTTP Status Code Reference:
| Code | Deskripsi | Kapan Muncul |
|---|---|---|
| `200 OK` | Operasi berhasil | GET, PUT, POST (non-create), DELETE |
| `201 Created` | Resource berhasil dibuat | POST akun Zoom, POST booking |
| `400 Bad Request` | Payload JSON tidak valid | Semua endpoint yang menerima body JSON |
| `401 Unauthorized` | Token JWT invalid/expired/blacklist | Protected routes saat token bermasalah |
| `404 Not Found` | Resource tidak ditemukan | GET detail akun, meeting detail |
| `409 Conflict` | Duplikasi nama akun | POST/PUT akun Zoom |
| `422 Unprocessable Entity` | Validasi gagal / business logic error | Validasi form, jadwal bentrok |
| `423 Locked` | PIN terkunci (khusus mobile) | PIN login gagal 5x |
| `429 Too Many Requests` | Rate limit tercapai | Login gagal berulang |
| `500 Internal Server Error` | Error server | Masalah server/Zoom API |
| `502 Bad Gateway` | Koneksi Zoom gagal | Test connection gagal |

---

## 5. Halaman & Fitur — Lengkap

### 5.1 Login Page

**Route:** `/login`

**Deskripsi:** Halaman login tunggal untuk admin web. Hanya menggunakan login password (bukan PIN/biometric).

**API Endpoint:**
```
POST /api/v1/auth/login
```

**Request Body:**
```json
{
  "username": "admin",
  "password": "password123",
  "device_id": "web-admin-uuid-generated",
  "device_name": "Web Admin Dashboard"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "a1b2c3d4e5f6...",
    "token_type": "Bearer",
    "expires_in": 900,
    "user": {
      "id": 1,
      "name": "Administrator",
      "username": "admin",
      "email": "admin@company.com",
      "has_pin": true,
      "biometric_enabled": false
    },
    "has_pin": true,
    "biometric_enabled": false
  }
}
```

**Validasi Client-Side:**
- `username` wajib diisi (tidak boleh kosong)
- `password` wajib diisi (tidak boleh kosong)
- `device_id` di-generate otomatis dari fungsi `getWebDeviceId()`

**Error yang mungkin terjadi:**
| Error Code | HTTP | Deskripsi |
|---|---|---|
| `LOGIN_FAILED` | 401 | Username/password salah |
| `RATE_LIMIT_EXCEEDED` | 429 | Terlalu banyak percobaan gagal (max 5x per 15 menit per username+IP) |
| `BAD_REQUEST` | 400 | JSON payload tidak valid |

**UI Requirements:**
- Form username + password dengan show/hide toggle
- Tombol login dengan loading state
- Error message tampil di bawah form
- Redirect ke `/dashboard` setelah login sukses
- Simpan `access_token`, `refresh_token`, `device_id`, dan `user` data ke localStorage/state

---

### 5.2 Dashboard Monitoring

**Route:** `/dashboard`

**Deskripsi:** Halaman utama yang menampilkan ringkasan status realtime seluruh akun Zoom corporate. Masing-masing akun ditampilkan sebagai kartu status.

#### 5.2.1 Get Dashboard Summary

**API Endpoint:**
```
GET /api/v1/dashboard
```

**Response (200):**
```json
{
  "success": true,
  "message": "Data dashboard monitoring berhasil diambil",
  "data": [
    {
      "id": 1,
      "account_name": "Zoom Room 1",
      "email": "room1@company.com",
      "host_key": "123456",
      "status": "available",
      "current_topic": null,
      "meeting_capacity": 300,
      "plan_type": "Licensed",
      "last_updated": "2026-10-19T15:30:00+07:00"
    },
    {
      "id": 2,
      "account_name": "Zoom Room 2",
      "email": "room2@company.com",
      "host_key": "654321",
      "status": "meeting",
      "current_topic": "Rapat Koordinasi Bulanan",
      "meeting_capacity": 300,
      "plan_type": "Licensed",
      "last_updated": "2026-10-19T15:30:00+07:00"
    },
    {
      "id": 3,
      "account_name": "Zoom Room 3",
      "email": null,
      "host_key": null,
      "status": "scheduled",
      "current_topic": "Review Anggaran Q4",
      "meeting_capacity": 100,
      "plan_type": "Basic",
      "last_updated": "2026-10-19T15:30:00+07:00"
    },
    {
      "id": 4,
      "account_name": "Zoom Room 4",
      "email": null,
      "host_key": null,
      "status": "error",
      "current_topic": "Token Expired / Connection Error",
      "meeting_capacity": 0,
      "plan_type": "Unknown",
      "last_updated": "2026-10-19T15:30:00+07:00"
    }
  ]
}
```

#### 5.2.2 Get Account Status (Detail per Akun)

**API Endpoint:**
```
GET /api/v1/dashboard/{id}/status
```

**Response (200):**
```json
{
  "success": true,
  "message": "Status akun Zoom berhasil diambil",
  "data": {
    "account_id": 1,
    "status": "meeting",
    "topic": "Koordinasi Regional",
    "start_time": "14:00",
    "end_time": "15:30",
    "host_name": "John Doe"
  }
}
```

**Nilai `status`:**
| Status | Warna Indikator | Deskripsi |
|---|---|---|
| `available` | 🟢 Hijau | Tidak ada meeting aktif atau terjadwal dekat |
| `meeting` | 🔴 Merah | Sedang ada meeting LIVE berlangsung |
| `scheduled` | 🟡 Kuning | Ada meeting terjadwal dalam 30 menit ke depan |
| `error` | ⚫ Abu-abu | Gagal terhubung ke Zoom API (token expired/invalid credential) |

#### 5.2.3 Get Account Specs (Kapasitas & Lisensi)

**API Endpoint:**
```
GET /api/v1/dashboard/{id}/specs
```

**Response (200):**
```json
{
  "success": true,
  "message": "Spesifikasi akun Zoom berhasil diambil",
  "data": {
    "account_id": 1,
    "meeting_capacity": 300,
    "plan_type": "Licensed",
    "error": null
  }
}
```

**UI Requirements:**
- Grid/list kartu per akun Zoom dengan badge status berwarna
- Tiap kartu menampilkan: nama akun, email, status, topik meeting saat ini (jika ada), kapasitas, plan type, host key (dengan tombol copy)
- **Auto-refresh setiap 30 detik** (gunakan `useQuery` dengan `refetchInterval: 30000`)
- Klik kartu membuka detail status terbaru via endpoint `/dashboard/{id}/status`
- Statistik ringkasan di atas: total akun, jumlah available, jumlah meeting, jumlah scheduled, jumlah error
- Tombol "Refresh All" untuk manual trigger refetch

---

### 5.3 Zoom Account Management (CRUD)

**Route:** `/accounts`

**Deskripsi:** CRUD pengelolaan akun Zoom S2S OAuth. Kredensial Zoom dienkripsi otomatis oleh API (AES-256-GCM).

#### 5.3.1 List Accounts

**API Endpoint:**
```
GET /api/v1/accounts
```

**Response (200):**
```json
{
  "success": true,
  "message": "Daftar akun Zoom berhasil diambil",
  "data": [
    {
      "id": 1,
      "account_name": "Zoom Room 1",
      "email": "room1@company.com",
      "host_key": "123456",
      "has_token": true,
      "token_expires_at": "2026-10-19T16:30:00+07:00",
      "created_at": "2026-01-15T10:00:00+07:00",
      "updated_at": "2026-10-19T14:30:00+07:00"
    }
  ]
}
```

#### 5.3.2 Get Account Detail

**API Endpoint:**
```
GET /api/v1/accounts/{id}
```

**Response (200):** Sama seperti item di list.

#### 5.3.3 Create Account

**API Endpoint:**
```
POST /api/v1/accounts
```

**Request Body:**
```json
{
  "account_name": "Zoom Room Baru",
  "email": "roombaru@company.com",
  "zoom_account_id": "ZOOM_ACCOUNT_ID_123",
  "host_key": "999888",
  "client_id": "CLIENT_ID_ABC",
  "client_secret": "CLIENT_SECRET_XYZ"
}
```

**Validasi Client-Side:**
- `account_name` — wajib, tidak boleh kosong
- `zoom_account_id` — wajib, tidak boleh kosong
- `client_id` — wajib, tidak boleh kosong
- `client_secret` — wajib, tidak boleh kosong
- `email` — opsional
- `host_key` — opsional

**Response (201):**
```json
{
  "success": true,
  "message": "Akun Zoom berhasil ditambahkan",
  "data": {
    "id": 5,
    "account_name": "Zoom Room Baru",
    "email": "roombaru@company.com",
    "host_key": "999888",
    "has_token": false,
    "token_expires_at": null,
    "created_at": "2026-10-19T15:00:00+07:00",
    "updated_at": "2026-10-19T15:00:00+07:00"
  }
}
```

**Error yang mungkin:**
| Error Code | HTTP | Deskripsi |
|---|---|---|
| `DUPLICATE_ACCOUNT_NAME` | 409 | Nama akun sudah digunakan |
| `VALIDATION_ERROR` | 422 | Field wajib kosong |
| `CREATE_ACCOUNT_FAILED` | 500 | Gagal enkripsi/simpan |

#### 5.3.4 Update Account

**API Endpoint:**
```
PUT /api/v1/accounts/{id}
```

**Request Body:**
```json
{
  "account_name": "Zoom Room 1 Updated",
  "email": "room1-new@company.com",
  "zoom_account_id": "UPDATED_ZOOM_ID",
  "host_key": "111222",
  "client_id": "UPDATED_CLIENT_ID",
  "client_secret": ""
}
```

> **CATATAN PENTING:** Jika `client_secret`, `client_id`, `zoom_account_id`, atau `host_key` dikirim sebagai string kosong `""`, API akan **mempertahankan nilai lama** yang sudah terenkripsi di database. Ini memungkinkan partial update tanpa mengekspos credential lama.

**Validasi Client-Side:**
- `account_name` — wajib, tidak boleh kosong

**Error yang mungkin:**
| Error Code | HTTP | Deskripsi |
|---|---|---|
| `ACCOUNT_NOT_FOUND` | 404 | Akun tidak ditemukan |
| `DUPLICATE_ACCOUNT_NAME` | 409 | Nama akun sudah digunakan oleh akun lain |
| `UPDATE_ACCOUNT_FAILED` | 500 | Gagal update |

#### 5.3.5 Delete Account

**API Endpoint:**
```
DELETE /api/v1/accounts/{id}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Akun Zoom berhasil dihapus",
  "data": null
}
```

**Error:** `ACCOUNT_NOT_FOUND` (404)

#### 5.3.6 Test Connection

**API Endpoint:**
```
GET /api/v1/accounts/{id}/check
```

**Response Sukses (200):**
```json
{
  "success": true,
  "message": "Koneksi berhasil! Terdeteksi 3 user aktif",
  "data": {
    "success": true,
    "account_id": 1,
    "account_name": "Zoom Room 1",
    "active_users_count": 3,
    "message": "Koneksi berhasil! Terdeteksi 3 user aktif"
  }
}
```

**Response Gagal (502):**
```json
{
  "success": true,
  "message": "Koneksi gagal: invalid_client",
  "data": {
    "success": false,
    "account_id": 1,
    "account_name": "Zoom Room 1",
    "active_users_count": 0,
    "message": "Koneksi gagal: invalid_client"
  }
}
```

> **CATATAN:** Endpoint ini juga melakukan invalidasi cache users Zoom di Redis, sehingga data fresh dari Zoom API.

**UI Requirements:**
- Tabel daftar akun dengan kolom: Nama, Email, Host Key (masked/copy), Status Token (✅/❌), Created, Actions
- Tombol "Tambah Akun" → membuka modal/form
- Form create/edit dengan field: account_name, email, zoom_account_id, host_key, client_id, client_secret
- Field credential (client_id, client_secret, zoom_account_id) ditampilkan sebagai password input
- Pada mode edit: tampilkan placeholder "••••••• (kosongkan jika tidak diubah)" untuk field credential
- Tombol "Test Connection" per akun → menampilkan hasil koneksi (sukses/gagal + jumlah active users)
- Konfirmasi dialog sebelum delete
- Tombol copy untuk Host Key

---

### 5.4 Smart Search & Book Meeting

**Route:** `/bookings/search`

**Deskripsi:** Fitur pencarian ketersediaan seluruh akun Zoom pada tanggal dan waktu tertentu, lalu booking langsung jika tersedia.

#### 5.4.1 Search Availability

**API Endpoint:**
```
GET /api/v1/bookings/search?date=2026-10-20&start_time=10:00&duration=60
```

**Query Parameters:**
| Param | Tipe | Wajib | Deskripsi |
|---|---|---|---|
| `date` | string (YYYY-MM-DD) | ✅ | Tanggal meeting yang diinginkan |
| `start_time` | string (HH:MM) | ✅ | Waktu mulai (WIB / Asia/Jakarta) |
| `duration` | integer | ❌ | Durasi dalam menit (default: 60, minimum: 15) |

**Response (200):**
```json
{
  "success": true,
  "message": "Pencarian ketersediaan ruang rapat berhasil",
  "data": [
    {
      "id": "1_abc123",
      "account": { "id": 1, "name": "Zoom Room 1" },
      "user_name": "John Doe",
      "email": "john@company.com",
      "booking_user_id": "abc123",
      "status": "AVAILABLE",
      "details": "Ready to use",
      "conflicting_meeting": null,
      "live_meeting": null,
      "scheduled_now": null
    },
    {
      "id": "2_def456",
      "account": { "id": 2, "name": "Zoom Room 2" },
      "user_name": "Jane Smith",
      "email": "jane@company.com",
      "booking_user_id": "def456",
      "status": "BUSY",
      "details": "Busy: Rapat Koordinasi (09:00 - 11:00)",
      "conflicting_meeting": {
        "topic": "Rapat Koordinasi",
        "start_time": "09:00",
        "end_time": "11:00"
      },
      "live_meeting": null,
      "scheduled_now": {
        "topic": "Rapat Koordinasi",
        "start_time": "09:00",
        "end_time": "11:00"
      }
    },
    {
      "id": "3_error",
      "account": { "id": 3, "name": "Zoom Room 3" },
      "user_name": "-",
      "email": "-",
      "booking_user_id": "",
      "status": "ERROR",
      "details": "Gagal menghubungi Zoom API (kredensial invalid / token expired)",
      "conflicting_meeting": null,
      "live_meeting": null,
      "scheduled_now": null
    }
  ]
}
```

**Urutan hasil:** `AVAILABLE` → `BUSY` → `ERROR` (sudah di-sort oleh API).

#### 5.4.2 Book Meeting

**API Endpoint:**
```
POST /api/v1/bookings
```

**Request Body — One-Time Meeting:**
```json
{
  "account_id": 1,
  "booking_user_id": "abc123",
  "topic": "Rapat Evaluasi Proyek",
  "date": "2026-10-20",
  "time": "10:00",
  "duration": 60,
  "is_recurring": false,
  "ignore_conflict": false
}
```

**Request Body — Recurring Meeting (Fixed Type 8):**
```json
{
  "account_id": 1,
  "booking_user_id": "abc123",
  "topic": "Standup Harian",
  "date": "2026-10-20",
  "time": "08:00",
  "duration": 30,
  "is_recurring": true,
  "recurrence_type": 1,
  "repeat_interval": 1,
  "weekly_days": "2,3,4,5,6",
  "end_date_time": "2026-12-31T23:59:59Z",
  "ignore_conflict": false
}
```

**Parameter Recurrence:**
| Field | Tipe | Deskripsi |
|---|---|---|
| `recurrence_type` | int | 1 = Daily, 2 = Weekly, 3 = Monthly |
| `repeat_interval` | int | Interval pengulangan (misal 1 = setiap hari/minggu) |
| `weekly_days` | string | Hari dalam seminggu: "1"=Sun, "2"=Mon, ... "7"=Sat. Contoh: "2,3,4,5,6" |
| `end_date_time` | string | Tanggal berakhir pengulangan (ISO 8601 UTC). Jika kosong, default 10 kali pertemuan |

**Validasi Client-Side:**
- `account_id` — wajib > 0
- `booking_user_id` — wajib, tidak boleh kosong
- `topic` — wajib, tidak boleh kosong
- `date` — wajib, format YYYY-MM-DD
- `time` — wajib, format HH:MM
- `duration` — wajib, minimal 15 menit

**Response Sukses (201):**
```json
{
  "success": true,
  "message": "Meeting berhasil di-booking via Zoom API",
  "data": {
    "id": 12345678901,
    "uuid": "abc-uuid-123",
    "topic": "Rapat Evaluasi Proyek",
    "start_time": "2026-10-20T03:00:00Z",
    "duration": 60,
    "join_url": "https://zoom.us/j/12345678901?pwd=...",
    "password": "abc123",
    "host_key": "999888",
    "type": 2
  }
}
```

**Error yang mungkin:**
| Error Code | HTTP | Deskripsi |
|---|---|---|
| `MEETING_CONFLICT` | 422 | "Gagal! Waktu bertabrakan dengan meeting: 'Koordinasi Lapangan' (14:00 - 15:30)" |
| `VALIDATION_ERROR` | 422 | Validasi field gagal |
| `BOOKING_FAILED` | 500 | Zoom API error |

**UI Requirements:**
- Form pencarian: Date Picker, Time Picker, Duration Selector (15/30/45/60/90/120 menit)
- Hasil ditampilkan sebagai kartu/list per akun Zoom:
  - `AVAILABLE` → warna hijau + tombol "📅 Book"
  - `BUSY` → warna merah + detail meeting yang bentrok
  - `ERROR` → warna abu-abu + pesan error
- Klik "Book" → membuka modal booking dengan pre-filled: account_id, booking_user_id
- Modal booking: input Topic, toggle One-time/Recurring, field Recurrence (jika recurring)
- Checkbox "Abaikan Konflik" (`ignore_conflict`) untuk force booking
- Setelah booking sukses: tampilkan dialog sukses dengan Join URL (copy button), Password, dan Host Key
- Loading skeleton saat pencarian

---

### 5.5 Schedule Management

**Route:** `/schedules`

**Deskripsi:** Melihat, mengelola, dan menghapus meeting yang sudah terjadwal/live/selesai.

#### 5.5.1 List Schedules

**API Endpoint:**
```
GET /api/v1/bookings?start_date=2026-10-01&end_date=2026-10-31&search=rapat&account_id=1
```

**Query Parameters:**
| Param | Tipe | Wajib | Deskripsi |
|---|---|---|---|
| `start_date` | string (YYYY-MM-DD) | ❌ | Default: hari ini |
| `end_date` | string (YYYY-MM-DD) | ❌ | Default: hari ini + 30 hari |
| `search` | string | ❌ | Filter berdasarkan topik meeting |
| `account_id` | integer | ❌ | Filter berdasarkan akun Zoom tertentu |

**Response (200):**
```json
{
  "success": true,
  "message": "Daftar jadwal meeting berhasil diambil",
  "data": {
    "live_meetings": [
      {
        "id": 111,
        "meeting_id": 111,
        "account_id": 1,
        "account_name": "Zoom Room 1",
        "host_key": "123456",
        "host": "John Doe",
        "topic": "Daily Standup",
        "password": "abc123",
        "start_time": "2026-10-19T15:00:00+07:00",
        "end_time": "2026-10-19T15:30:00+07:00",
        "duration": 30,
        "join_url": "https://zoom.us/j/111?pwd=...",
        "type": 2,
        "occurrence_id": null
      }
    ],
    "upcoming_meetings": [
      {
        "id": 222,
        "meeting_id": 222,
        "account_id": 2,
        "account_name": "Zoom Room 2",
        "host_key": "654321",
        "host": "Jane Smith",
        "topic": "Review Bulanan",
        "password": "xyz789",
        "start_time": "2026-10-20T09:00:00+07:00",
        "end_time": "2026-10-20T10:00:00+07:00",
        "duration": 60,
        "join_url": "https://zoom.us/j/222?pwd=...",
        "type": 2,
        "occurrence_id": null
      }
    ],
    "past_meetings": [
      {
        "id": 333,
        "meeting_id": 333,
        "account_id": 1,
        "account_name": "Zoom Room 1",
        "host_key": "123456",
        "host": "John Doe",
        "topic": "Closing Proyek A",
        "password": "qrs456",
        "start_time": "2026-10-18T14:00:00+07:00",
        "end_time": "2026-10-18T15:00:00+07:00",
        "duration": 60,
        "join_url": "https://zoom.us/j/333?pwd=...",
        "type": 2,
        "occurrence_id": null
      }
    ]
  }
}
```

**Sorting:**
- `upcoming_meetings` → ASC (terdekat di atas)
- `past_meetings` → DESC (terbaru di atas)

#### 5.5.2 Update Meeting

**API Endpoint:**
```
PUT /api/v1/bookings/{meetingId}
```

**Request Body:**
```json
{
  "account_id": 1,
  "topic": "Rapat Evaluasi (Diperbarui)",
  "start_time": "2026-10-20 14:00",
  "duration": 90,
  "is_recurring": false,
  "recurrence_type": null,
  "repeat_interval": null,
  "weekly_days": null,
  "end_date_time": null
}
```

**Validasi Client-Side:**
- `account_id` — wajib > 0
- `topic` — wajib, tidak boleh kosong
- `start_time` — wajib, format "YYYY-MM-DD HH:MM" (WIB)
- `duration` — wajib, minimal 15 menit

> **CATATAN:** API juga melakukan conflict detection saat update. Jika jadwal baru bentrok dengan meeting lain (kecuali meeting yang sedang di-update sendiri), akan ditolak dengan error `MEETING_CONFLICT` (422).

#### 5.5.3 Delete Meeting

**API Endpoint:**
```
DELETE /api/v1/bookings/{meetingId}
```

**Request Body (atau Query Params):**
```json
{
  "account_id": 1,
  "delete_option": "all",
  "occurrence_id": ""
}
```

| Field | Tipe | Deskripsi |
|---|---|---|
| `account_id` | uint | Wajib (bisa via body JSON atau query param `?account_id=1`) |
| `delete_option` | string | `"all"` = hapus seluruh meeting, `"occurrence"` = hapus satu occurrence saja |
| `occurrence_id` | string | Wajib jika `delete_option` = `"occurrence"` |

#### 5.5.4 End Live Meeting

**API Endpoint:**
```
POST /api/v1/bookings/{meetingId}/end
```

**Request Body (atau Query Params):**
```json
{
  "account_id": 1
}
```

> `account_id` wajib disertakan (bisa via body atau query `?account_id=1`).

#### 5.5.5 Get Meeting Details

**API Endpoint:**
```
GET /api/v1/bookings/{accountId}/{meetingId}/details
```

**Response (200):**
```json
{
  "success": true,
  "message": "Detail meeting berhasil diambil dari Zoom",
  "data": {
    "id": 12345678901,
    "uuid": "abc-uuid-123",
    "host_id": "user-host-id",
    "topic": "Rapat Evaluasi",
    "type": 2,
    "status": "waiting",
    "start_time": "2026-10-20T03:00:00Z",
    "duration": 60,
    "timezone": "Asia/Jakarta",
    "created_at": "2026-10-19T10:00:00Z",
    "join_url": "https://zoom.us/j/12345678901?pwd=...",
    "password": "abc123",
    "occurrences": []
  }
}
```

Meeting `type` values:
| Type | Deskripsi |
|---|---|
| 1 | Instant meeting |
| 2 | Scheduled (one-time) |
| 3 | Recurring, no fixed time |
| 8 | Recurring, fixed time |

**UI Requirements:**
- 3 tab/section: 🔴 Live, 📅 Upcoming, 📋 Past
- Filter bar: Date Range Picker, Search (topic keyword), Account Dropdown
- Tabel per section:
  - Kolom: Akun, Host, Topik, Waktu Mulai, Waktu Selesai, Durasi, Tipe, Actions
- Actions per meeting:
  - **Live meetings:** Tombol "🔗 Join" (buka join_url), "⏹️ End Meeting", "📋 Details"
  - **Upcoming meetings:** Tombol "✏️ Edit", "🗑️ Delete", "📋 Details"
  - **Past meetings:** Tombol "📋 Details"
- Modal edit meeting dengan pre-filled data
- Konfirmasi dialog sebelum delete dan end meeting
- Badge warna per tipe meeting (Scheduled vs Recurring)
- Tampilkan Host Key + Password dengan tombol copy
- Untuk recurring meeting (`type: 8`), tampilkan occurrence_id dan opsi delete per occurrence

---

### 5.6 Cloud Recordings

**Route:** `/recordings`

**Deskripsi:** Arsip rekaman cloud Zoom dari seluruh akun corporate secara terpusat. API melakukan batch chunking 30 hari per request Zoom untuk rentang maksimal 6 bulan.

#### 5.6.1 List Recordings

**API Endpoint:**
```
GET /api/v1/recordings?from=2026-07-01&to=2026-10-19&search=rapat&account_id=1
```

**Query Parameters:**
| Param | Tipe | Wajib | Deskripsi |
|---|---|---|---|
| `from` | string (YYYY-MM-DD) | ❌ | Tanggal mulai (default: 30 hari lalu) |
| `to` | string (YYYY-MM-DD) | ❌ | Tanggal akhir (default: hari ini) |
| `search` | string | ❌ | Filter berdasarkan topik atau nama host |
| `account_id` | integer | ❌ | Filter berdasarkan akun Zoom tertentu |

> **Batasan:** Rentang `from` — `to` maksimal 6 bulan (180 hari). Jika melebihi, API otomatis membatasi.

**Response (200):**
```json
{
  "success": true,
  "message": "Daftar rekaman cloud Zoom berhasil diambil",
  "data": [
    {
      "meeting_id": 12345678901,
      "uuid": "rec-uuid-123",
      "topic": "Rapat Koordinasi Regional",
      "start_time": "2026-10-15T09:00:00Z",
      "duration": 75,
      "total_size": 157286400,
      "share_url": "https://zoom.us/rec/share/...",
      "recording_count": 3,
      "recording_files": [
        {
          "file_type": "MP4",
          "file_extension": "MP4",
          "file_size": 104857600,
          "download_url": "https://zoom.us/rec/download/...",
          "play_url": "https://zoom.us/rec/play/...",
          "recording_type": "shared_screen_with_speaker_view",
          "status": "completed",
          "recording_start": "2026-10-15T09:00:00Z",
          "recording_end": "2026-10-15T10:15:00Z"
        },
        {
          "file_type": "M4A",
          "file_extension": "M4A",
          "file_size": 20971520,
          "download_url": "https://zoom.us/rec/download/...",
          "play_url": "https://zoom.us/rec/play/...",
          "recording_type": "audio_only",
          "status": "completed",
          "recording_start": "2026-10-15T09:00:00Z",
          "recording_end": "2026-10-15T10:15:00Z"
        },
        {
          "file_type": "TRANSCRIPT",
          "file_extension": "VTT",
          "file_size": 31457280,
          "download_url": "https://zoom.us/rec/download/...",
          "play_url": "",
          "recording_type": "audio_transcript",
          "status": "completed",
          "recording_start": "2026-10-15T09:00:00Z",
          "recording_end": "2026-10-15T10:15:00Z"
        }
      ],
      "account_name": "Zoom Room 1",
      "account_id": 1,
      "host_name": "John Doe",
      "host_email": "john@company.com"
    }
  ]
}
```

**UI Requirements:**
- Filter bar: Date Range (from/to), Search, Account Dropdown
- Kartu/list rekaman dengan: Topik, Tanggal, Durasi, Akun, Host, Total Size (formatted: MB/GB)
- Expand/accordion per item untuk menampilkan daftar recording files
- Per file: Badge tipe (MP4/M4A/VTT/Chat), ukuran file, tombol "▶️ Play" (play_url), tombol "⬇️ Download" (download_url)
- Tombol "🔗 Share" untuk share_url
- Format file size: bytes → human-readable (contoh: 157.28 MB, 1.5 GB)
- Pagination / infinite scroll jika banyak data
- Empty state jika tidak ada rekaman

---

### 5.7 User Profile / Settings

**Route:** `/profile` (atau panel di Navbar)

**Deskripsi:** Menampilkan profil user yang sedang login.

#### 5.7.1 Get Me

**API Endpoint:**
```
GET /api/v1/auth/me
```

**Response (200):**
```json
{
  "success": true,
  "message": "Data profil berhasil diambil",
  "data": {
    "id": 1,
    "name": "Administrator",
    "username": "admin",
    "email": "admin@company.com",
    "has_pin": true,
    "biometric_enabled": false
  }
}
```

**UI Requirements:**
- Dropdown/popover profil di navbar: avatar, nama, username
- Halaman/panel profil: ID, Nama, Username, Email, Status PIN, Status Biometric
- Tombol Logout

---

## 6. API Endpoints — Referensi Lengkap

### Base URL: `/api/v1`

### 6.1 Authentication
| Method | Path | Auth | Deskripsi | Digunakan di Web |
|---|---|---|---|---|
| `POST` | `/auth/login` | ❌ | Login password master | ✅ Ya |
| `POST` | `/auth/pin/setup` | ✅ | Setup PIN 6-digit | ❌ Khusus Mobile |
| `POST` | `/auth/pin/login` | ❌ | Login via PIN | ❌ Khusus Mobile |
| `POST` | `/auth/biometric/enable` | ✅ | Aktifkan biometrik | ❌ Khusus Mobile |
| `POST` | `/auth/biometric/disable` | ✅ | Nonaktifkan biometrik | ❌ Khusus Mobile |
| `POST` | `/auth/biometric/login` | ❌ | Login biometrik | ❌ Khusus Mobile |
| `POST` | `/auth/refresh` | ❌ | Token refresh rotation | ✅ Ya (via interceptor) |
| `POST` | `/auth/logout` | ✅ | Logout & blacklist token | ✅ Ya |
| `GET` | `/auth/me` | ✅ | Profil user login | ✅ Ya |

### 6.2 Dashboard
| Method | Path | Auth | Deskripsi |
|---|---|---|---|
| `GET` | `/dashboard` | ✅ | Ringkasan semua akun Zoom |
| `GET` | `/dashboard/{id}/status` | ✅ | Status realtime per akun |
| `GET` | `/dashboard/{id}/specs` | ✅ | Kapasitas & plan type per akun |

### 6.3 Zoom Accounts
| Method | Path | Auth | Deskripsi |
|---|---|---|---|
| `GET` | `/accounts` | ✅ | List semua akun |
| `POST` | `/accounts` | ✅ | Tambah akun baru |
| `GET` | `/accounts/{id}` | ✅ | Detail akun |
| `PUT` | `/accounts/{id}` | ✅ | Update akun |
| `DELETE` | `/accounts/{id}` | ✅ | Hapus akun |
| `GET` | `/accounts/{id}/check` | ✅ | Test koneksi Zoom API |

### 6.4 Bookings & Meetings
| Method | Path | Auth | Deskripsi |
|---|---|---|---|
| `GET` | `/bookings` | ✅ | List jadwal (Live/Upcoming/Past) |
| `GET` | `/bookings/search` | ✅ | Cari ketersediaan ruang rapat |
| `POST` | `/bookings` | ✅ | Booking meeting baru |
| `PUT` | `/bookings/{meetingId}` | ✅ | Update meeting |
| `DELETE` | `/bookings/{meetingId}` | ✅ | Hapus meeting |
| `POST` | `/bookings/{meetingId}/end` | ✅ | Akhiri meeting live |
| `GET` | `/bookings/{accountId}/{meetingId}/details` | ✅ | Detail meeting dari Zoom API |

### 6.5 Recordings
| Method | Path | Auth | Deskripsi |
|---|---|---|---|
| `GET` | `/recordings` | ✅ | List rekaman cloud Zoom |

### 6.6 Telegram (Backend Only)
| Method | Path | Auth | Deskripsi |
|---|---|---|---|
| `POST` | `/telegram/webhook` | Token | Webhook Telegram (tidak untuk FE Web) |

### 6.7 Health Check (No Auth)
| Method | Path | Auth | Deskripsi |
|---|---|---|---|
| `GET` | `/` | ❌ | Server info |
| `GET` | `/health` | ❌ | Health check (DB + Redis status) |

---

## 7. TypeScript Interfaces — Seluruh DTO

```typescript
// ═══════════════════════════════════════
// API Response Wrapper
// ═══════════════════════════════════════
interface APIResponse<T = any> {
  success: boolean;
  message: string;
  error_code?: string;
  data?: T;
  errors?: any;
}

// ═══════════════════════════════════════
// AUTH DTOs
// ═══════════════════════════════════════
interface LoginRequest {
  username: string;
  password: string;
  device_id: string;
  device_name: string;
}

interface RefreshTokenRequest {
  refresh_token: string;
  device_id: string;
}

interface LogoutRequest {
  device_id?: string;
}

interface UserResponse {
  id: number;
  name: string;
  username: string;
  email?: string | null;
  has_pin: boolean;
  biometric_enabled: boolean;
}

interface TokenResponse {
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
interface DashboardAccountSummary {
  id: number;
  account_name: string;
  email?: string | null;
  host_key?: string | null;
  status: 'available' | 'meeting' | 'scheduled' | 'error';
  current_topic?: string | null;
  meeting_capacity: number;
  plan_type: string;     // "Basic", "Licensed", "On-Prem"
  last_updated: string;  // ISO 8601
}

interface AccountStatusResponse {
  account_id: number;
  status: 'available' | 'meeting' | 'scheduled' | 'error';
  topic?: string | null;
  start_time?: string;   // "14:00" (HH:MM WIB)
  end_time?: string;     // "15:30" (HH:MM WIB)
  host_name?: string;
}

interface AccountSpecsResponse {
  account_id: number;
  meeting_capacity: number;
  plan_type: string;
  error?: string | null;
}

// ═══════════════════════════════════════
// ZOOM ACCOUNT DTOs
// ═══════════════════════════════════════
interface AccountResponse {
  id: number;
  account_name: string;
  email?: string | null;
  host_key?: string | null;
  has_token: boolean;
  token_expires_at?: string | null;  // ISO 8601
  created_at: string;
  updated_at: string;
}

interface CreateAccountRequest {
  account_name: string;
  email?: string;
  zoom_account_id: string;
  host_key?: string;
  client_id: string;
  client_secret: string;
}

interface UpdateAccountRequest {
  account_name: string;
  email?: string;
  zoom_account_id?: string;  // Kosong = pertahankan lama
  host_key?: string;         // Kosong = pertahankan lama
  client_id?: string;        // Kosong = pertahankan lama
  client_secret?: string;    // Kosong = pertahankan lama
}

interface CheckConnectionResponse {
  success: boolean;
  account_id: number;
  account_name: string;
  active_users_count: number;
  message: string;
}

// ═══════════════════════════════════════
// BOOKING & MEETING DTOs
// ═══════════════════════════════════════
interface MeetingSummary {
  topic: string;
  start_time: string;  // "HH:MM"
  end_time: string;    // "HH:MM"
}

interface AccountRef {
  id: number;
  name: string;
}

interface AvailabilityResult {
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

interface BookMeetingRequest {
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

interface UpdateMeetingRequest {
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

interface DeleteMeetingRequest {
  account_id: number;
  delete_option: 'all' | 'occurrence';
  occurrence_id?: string;
}

interface EndMeetingRequest {
  account_id: number;
}

interface ScheduleItem {
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

interface SchedulesResponse {
  live_meetings: ScheduleItem[];
  upcoming_meetings: ScheduleItem[];
  past_meetings: ScheduleItem[];
}

interface ListSchedulesFilter {
  start_date?: string;   // "YYYY-MM-DD"
  end_date?: string;     // "YYYY-MM-DD"
  search?: string;
  account_id?: number;
}

// Meeting Detail (dari Zoom API langsung)
interface ZoomOccurrence {
  occurrence_id: string;
  start_time: string;
  duration: number;
  status: string;  // "deleted" | "available"
}

interface ZoomMeetingDetail {
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
interface RecordingFile {
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

interface RecordingItem {
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

// ═══════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════
interface HealthCheckResponse {
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
```

---

## 8. Authentication Flow — Detail

### 8.1 Login Flow (Web)

```
┌─────────────┐      POST /auth/login           ┌───────────────┐
│  Login Page  │  ─────────────────────────────▶ │  Go API Server │
│             │  {username, password,            │               │
│             │   device_id, device_name}        │               │
│             │ ◀───────────────────────────────  │               │
│  Store:     │  {access_token, refresh_token,   │  Bcrypt verify │
│  - tokens   │   user, expires_in}              │  + JWT generate│
│  - user     │                                  │  + RTR upsert  │
│  Redirect→  │                                  └───────────────┘
│  /dashboard │
└─────────────┘
```

### 8.2 Auto Token Refresh (Axios Interceptor)

```
┌─────────────┐      Any Protected Request       ┌───────────────┐
│  Web App    │  ──────────────────────────────▶ │  Go API Server │
│  (Axios)    │  Authorization: Bearer <token>   │               │
│             │ ◀──────────────────────────────  │               │
│             │  HTTP 401 TOKEN_EXPIRED          │  JWT expired!  │
│             │                                  └───────────────┘
│  Interceptor│
│  catches 401│
│             │      POST /auth/refresh           ┌───────────────┐
│             │  ──────────────────────────────▶ │  Go API Server │
│             │  {refresh_token, device_id}      │               │
│             │ ◀──────────────────────────────  │  RTR: generate │
│  Update     │  {NEW access_token,              │  new tokens    │
│  tokens in  │   NEW refresh_token}             └───────────────┘
│  storage    │
│  Retry      │      Original Request (retry)     ┌───────────────┐
│  original   │  ──────────────────────────────▶ │  Go API Server │
│  request    │  Authorization: Bearer <new>     │               │
└─────────────┘                                  └───────────────┘
```

### 8.3 Logout Flow

```
┌─────────────┐      POST /auth/logout           ┌───────────────┐
│  Web App    │  ──────────────────────────────▶ │  Go API Server │
│             │  Authorization: Bearer <token>   │               │
│             │  Body: {device_id}               │  1. Revoke     │
│             │                                  │     device     │
│  Clear all  │                                  │  2. Blacklist  │
│  storage    │ ◀──────────────────────────────  │     JTI in     │
│  Redirect→  │  200 OK                          │     Redis      │
│  /login     │                                  └───────────────┘
└─────────────┘
```

### 8.4 JWT Claims Structure
Access token JWT berisi claims berikut:
```json
{
  "user_id": 1,
  "username": "admin",
  "device_id": "web-admin-uuid",
  "jti": "unique-token-id",
  "exp": 1729341600,
  "iat": 1729340700
}
```

---

## 9. Error Handling & Error Codes

### Error Codes Lengkap dari API:

#### Auth Errors
| Error Code | HTTP | Deskripsi | Handling di FE |
|---|---|---|---|
| `LOGIN_FAILED` | 401 | Username/password salah | Tampilkan pesan error di form |
| `RATE_LIMIT_EXCEEDED` | 429 | Terlalu banyak percobaan (5x/15min) | Tampilkan countdown timer |
| `UNAUTHORIZED` | 401 | Tidak terautentikasi | Redirect ke login |
| `TOKEN_EXPIRED` | 401 | Access token expired | Auto-refresh via interceptor |
| `TOKEN_INVALID` | 401 | Token rusak/invalid | Redirect ke login |
| `TOKEN_REVOKED` | 401 | Token sudah di-logout/blacklist | Redirect ke login |
| `REFRESH_TOKEN_FAILED` | 401 | Refresh token invalid/expired | Redirect ke login |
| `INVALID_TOKEN_FORMAT` | 401 | Format Bearer token salah | Redirect ke login |

#### Account Errors
| Error Code | HTTP | Deskripsi | Handling di FE |
|---|---|---|---|
| `ACCOUNT_NOT_FOUND` | 404 | Akun Zoom tidak ditemukan | Tampilkan "Not Found" |
| `DUPLICATE_ACCOUNT_NAME` | 409 | Nama akun sudah ada | Highlight field nama |
| `CREATE_ACCOUNT_FAILED` | 500 | Gagal membuat akun | Toast error |
| `UPDATE_ACCOUNT_FAILED` | 500 | Gagal update | Toast error |
| `DELETE_ACCOUNT_FAILED` | 500 | Gagal hapus | Toast error |
| `CHECK_CONNECTION_FAILED` | 500 | Gagal tes koneksi | Tampilkan hasil gagal |

#### Booking Errors
| Error Code | HTTP | Deskripsi | Handling di FE |
|---|---|---|---|
| `MEETING_CONFLICT` | 422 | Jadwal bentrok | Tampilkan detail bentrok + opsi force |
| `SEARCH_FAILED` | 400 | Format tanggal/waktu salah | Validasi client-side |
| `BOOKING_FAILED` | 500 | Zoom API error saat booking | Toast error |
| `UPDATE_FAILED` | 500 | Gagal update meeting | Toast error |
| `DELETE_FAILED` | 500 | Gagal hapus meeting | Toast error |
| `END_MEETING_FAILED` | 500 | Gagal akhiri meeting | Toast error |
| `MEETING_NOT_FOUND` | 404 | Meeting tidak ditemukan | Toast error |

#### Dashboard Errors
| Error Code | HTTP | Deskripsi | Handling di FE |
|---|---|---|---|
| `DASHBOARD_FETCH_FAILED` | 500 | Gagal memuat dashboard | Retry button |
| `FETCH_STATUS_FAILED` | 500 | Gagal ambil status akun | Tampilkan "error" badge |
| `FETCH_SPECS_FAILED` | 500 | Gagal ambil spesifikasi | Tampilkan default |

#### Recording Errors
| Error Code | HTTP | Deskripsi | Handling di FE |
|---|---|---|---|
| `FETCH_RECORDINGS_FAILED` | 500 | Gagal mengambil rekaman | Toast error + retry |

#### General Errors
| Error Code | HTTP | Deskripsi | Handling di FE |
|---|---|---|---|
| `BAD_REQUEST` | 400 | Payload JSON invalid | Toast error |
| `VALIDATION_ERROR` | 422 | Validasi field gagal | Tampilkan per-field error |
| `INVALID_ID` | 400 | ID path param tidak valid | Toast error |

---

## 10. State Management & Data Fetching

### 10.1 Auth Store (Zustand)

```typescript
interface AuthState {
  user: UserResponse | null;
  accessToken: string | null;
  refreshToken: string | null;
  deviceId: string | null;
  isAuthenticated: boolean;

  login: (data: TokenResponse) => void;
  logout: () => void;
  updateTokens: (accessToken: string, refreshToken: string) => void;
}
```

### 10.2 React Query Keys Convention

```typescript
const queryKeys = {
  // Dashboard
  dashboard: ['dashboard'] as const,
  dashboardStatus: (id: number) => ['dashboard', 'status', id] as const,
  dashboardSpecs: (id: number) => ['dashboard', 'specs', id] as const,

  // Accounts
  accounts: ['accounts'] as const,
  account: (id: number) => ['accounts', id] as const,

  // Bookings
  schedules: (filter: ListSchedulesFilter) => ['schedules', filter] as const,
  availability: (params: { date: string; start_time: string; duration: number }) =>
    ['availability', params] as const,
  meetingDetail: (accountId: number, meetingId: string) =>
    ['meeting', accountId, meetingId] as const,

  // Recordings
  recordings: (params: { from?: string; to?: string; search?: string; account_id?: number }) =>
    ['recordings', params] as const,

  // Auth
  me: ['auth', 'me'] as const,
};
```

### 10.3 Refetch Intervals

| Data | Interval | Alasan |
|---|---|---|
| Dashboard summary | 30 detik | Status bisa berubah kapan saja (meeting start/end) |
| Account status | 30 detik | Cache Redis TTL 30 detik |
| Account specs | 5 menit | Jarang berubah (cache Redis TTL 5 menit) |
| Schedules list | Manual / 60 detik | Data relatif stabil |
| Recordings | Manual only | Data historis, tidak berubah sering |
| Account list | Manual only | Data CRUD, berubah hanya saat user edit |

---

## 11. UI/UX Design Guidelines

### 11.1 Color Palette (Status)

| Status | Background | Text | Badge |
|---|---|---|---|
| Available | `#dcfce7` | `#166534` | 🟢 `#22c55e` |
| Meeting (Live) | `#fef2f2` | `#991b1b` | 🔴 `#ef4444` |
| Scheduled | `#fffbeb` | `#92400e` | 🟡 `#f59e0b` |
| Error | `#f3f4f6` | `#6b7280` | ⚫ `#9ca3af` |

### 11.2 Layout Structure

```
┌────────────────────────────────────────────────────────┐
│  Navbar: Logo | Navigation Links | Profile Dropdown    │
├──────────┬─────────────────────────────────────────────┤
│          │                                             │
│  Side    │           Main Content Area                 │
│  Nav     │                                             │
│          │  ┌─────────────────────────────────────────┐│
│  📊 Dash │  │  Page Title + Breadcrumb               ││
│  👤 Acct │  ├─────────────────────────────────────────┤│
│  🔍 Book │  │                                         ││
│  📅 Sched│  │       Content                           ││
│  🎬 Rec  │  │                                         ││
│          │  │                                         ││
│          │  └─────────────────────────────────────────┘│
│          │                                             │
└──────────┴─────────────────────────────────────────────┘
```

### 11.3 Responsive Breakpoints
- **Mobile:** < 768px → sidebar collapse ke hamburger menu
- **Tablet:** 768px - 1024px → sidebar auto-collapse
- **Desktop:** > 1024px → sidebar always visible

### 11.4 Key UX Patterns
1. **Optimistic Updates** — Saat delete/update, update UI duluan, rollback jika API error
2. **Loading Skeletons** — Bukan spinner, tapi skeleton placeholder untuk setiap data area
3. **Toast Notifications** — Semua success/error operation tampilkan toast
4. **Confirm Dialogs** — Delete dan End Meeting wajib konfirmasi
5. **Copy to Clipboard** — Host key, password, join URL, semua bisa di-copy satu klik
6. **Empty States** — Ilustrasi dan pesan informatif saat tidak ada data
7. **Error Boundaries** — Tangkap error rendering dan tampilkan fallback
8. **Auto-save Filter** — Simpan filter terakhir di URL query params atau sessionStorage

---

## 12. Routing & Navigation Structure

```
/login                          → Login Page (Public)
/dashboard                      → Dashboard Monitoring (Protected)
/accounts                       → Zoom Account List (Protected)
/accounts/create                → Create Account Form (Protected)
/accounts/:id/edit              → Edit Account Form (Protected)
/bookings/search                → Smart Search & Book (Protected)
/schedules                      → Schedule Management (Protected)
/schedules/:accountId/:meetingId → Meeting Detail (Protected)
/recordings                     → Cloud Recordings (Protected)
/profile                        → User Profile (Protected)
```

### 12.1 Route Guards & Implementation (React Router v6/v7)

Gunakan pattern `<ProtectedRoute>` wrapper di dalam React Router untuk mengamankan halaman dan menyajikan layout utama (Sidebar + Navbar):

```tsx
// router/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/useAuthStore';
import { AppLayout } from '@/components/layout/AppLayout';

export function ProtectedRoute() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

export function PublicRoute() {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
```

### Route Guards Rules:
- Semua route kecuali `/login` memerlukan `access_token` valid di Zustand/localStorage.
- Redirect otomatis ke `/login` jika token tidak ada atau refresh token gagal.
- Redirect otomatis ke `/dashboard` jika user yang sudah login mengakses `/login`.

---

## 13. Environment Variables Frontend

Gunakan prefix `VITE_` sesuai standar Vite. Buat file `.env.example` dan `.env.local`:

```env
# API Backend Go Server
VITE_API_URL=http://localhost:8080/api/v1

# App Info
VITE_APP_NAME="Zoom Monitor"
VITE_APP_VERSION="1.0.0"

# Feature Flags & Polling Configuration
VITE_ENABLE_RECORDINGS=true
VITE_DASHBOARD_REFRESH_INTERVAL=30000
```

### TypeScript Definition untuk Environment Variables:

```typescript
// src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_ENABLE_RECORDINGS: string;
  readonly VITE_DASHBOARD_REFRESH_INTERVAL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

---

## 14. Phase-by-Phase Development Roadmap

### 📍 Fase 1: Foundation & Core Setup
- Inisialisasi project (`npm create vite@latest . -- --template react-ts`)
- Konfigurasi Tailwind CSS + inisialisasi shadcn/ui (`npx shadcn@latest init`)
- Setup Axios instance dengan interceptor auth & RTR queue (Bagian 3)
- Implementasi Auth Store (Zustand)
- Implementasi seluruh TypeScript interfaces DTO backend (Bagian 7)
- Setup TanStack Query provider & QueryClient defaults
- Layout utama: Sidebar + Navbar + Content Area (responsive collapse)
- Setup React Router v6 & ProtectedRoute guards (Bagian 12)

### 📍 Fase 2: Authentication
- Halaman Login (`/login`)
- Integrasi `POST /auth/login`
- Token storage (localStorage)
- Auto-refresh token interceptor (`POST /auth/refresh`)
- Logout flow (`POST /auth/logout`)
- User profile dropdown (`GET /auth/me`)
- Protected route middleware

### 📍 Fase 3: Dashboard Monitoring
- Halaman Dashboard (`/dashboard`)
- Grid kartu status akun (`GET /dashboard`)
- Badge status berwarna (available/meeting/scheduled/error)
- Detail status per akun (`GET /dashboard/{id}/status`)
- Specs per akun (`GET /dashboard/{id}/specs`)
- Auto-refresh 30 detik
- Statistik ringkasan

### 📍 Fase 4: Zoom Account Management
- Halaman Account List (`/accounts`)
- Tabel daftar akun (`GET /accounts`)
- Form Create Account (`POST /accounts`)
- Form Edit Account (`PUT /accounts/{id}`)
- Delete Account + konfirmasi dialog (`DELETE /accounts/{id}`)
- Test Connection + hasil inline (`GET /accounts/{id}/check`)
- Partial update handling (credential preservation)

### 📍 Fase 5: Smart Search & Booking
- Halaman Search (`/bookings/search`)
- Form pencarian: Date, Time, Duration
- Hasil availability grid (`GET /bookings/search`)
- Kartu AVAILABLE/BUSY/ERROR per akun
- Modal booking meeting (`POST /bookings`)
- Form recurring meeting (type, interval, weekly_days, end_date)
- Conflict handling + ignore_conflict checkbox
- Dialog sukses booking (join_url, password, host_key)

### 📍 Fase 6: Schedule Management
- Halaman Schedules (`/schedules`)
- 3 tab: Live / Upcoming / Past (`GET /bookings`)
- Filter: Date Range, Search, Account
- Tabel per tab dengan sorting
- Modal Edit Meeting (`PUT /bookings/{meetingId}`)
- Delete Meeting + dialog (`DELETE /bookings/{meetingId}`)
- End Live Meeting + dialog (`POST /bookings/{meetingId}/end`)
- Detail Meeting (`GET /bookings/{accountId}/{meetingId}/details`)
- Occurrence handling untuk recurring meetings

### 📍 Fase 7: Cloud Recordings
- Halaman Recordings (`/recordings`)
- Filter: Date Range, Search, Account (`GET /recordings`)
- Kartu/list rekaman dengan expand/accordion
- Per file: play, download, badge tipe
- File size formatting
- Share URL button

### 📍 Fase 8: Polish & Production
- Error boundaries & fallback UI
- Loading skeletons di seluruh halaman & kartu status
- Empty states untuk seluruh list, search results, dan grid
- Responsive design audit (mobile <768px, tablet, desktop >1024px)
- Toast notification feedback (Sonner)
- Copy-to-clipboard utilities (Host key, Password, Join URL)
- Dynamic document title & favicon management
- Dockerfile multi-stage build (Vite build -> Nginx Alpine static serving)
- Build optimization, bundle analyzer, & deployment config
