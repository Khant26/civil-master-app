import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/authContextValue';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Separate query client for the admin area so admin caching settings and
// cached admin data never mix with the public website's cache.
const adminQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes (shorter for admin)
      gcTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

const FullScreenSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="spinner"></div>
  </div>
);

// Only authenticated users can see the dashboard.
const ProtectedRoute = ({ children }) => {
  const { user, initializing } = useAuth();
  if (initializing) return <FullScreenSpinner />;
  return user ? children : <Navigate to="/admin/login" replace />;
};

// Logged-in users are sent from the login page to the dashboard.
const PublicRoute = ({ children }) => {
  const { user, initializing } = useAuth();
  if (initializing) return <FullScreenSpinner />;
  return user ? <Navigate to="/admin" replace /> : children;
};

/**
 * CMS admin dashboard, mounted by the main router at /admin/*.
 * All admin styles are scoped under the `.admin-root` element.
 */
function AdminApp() {
  return (
    <div className="admin-root">
      <div className="min-h-screen bg-gray-50 font-sans">
        <ErrorBoundary>
          <QueryClientProvider client={adminQueryClient}>
            <AuthProvider>
              <Routes>
                <Route
                  path="login"
                  element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  }
                />
                <Route
                  path="*"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </AuthProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </div>
    </div>
  );
}

export default AdminApp;
