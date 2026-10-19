import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from './ProtectedRoute';
import { LoginPage } from '@/features/auth/LoginPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { AccountsPage } from '@/features/accounts/AccountsPage';
import { SearchBookingPage } from '@/features/bookings/SearchBookingPage';
import { SchedulesPage } from '@/features/schedules/SchedulesPage';
import { RecordingsPage } from '@/features/recordings/RecordingsPage';
import { ProfilePage } from '@/features/auth/ProfilePage';

export const router = createBrowserRouter([
  // Public Route (Login)
  {
    element: <PublicRoute />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
    ],
  },

  // Protected Routes (Dashboard & Management)
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: '/dashboard',
        element: <DashboardPage />,
      },
      {
        path: '/accounts',
        element: <AccountsPage />,
      },
      {
        path: '/bookings/search',
        element: <SearchBookingPage />,
      },
      {
        path: '/schedules',
        element: <SchedulesPage />,
      },
      {
        path: '/recordings',
        element: <RecordingsPage />,
      },
      {
        path: '/profile',
        element: <ProfilePage />,
      },
      {
        path: '*',
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },
]);
