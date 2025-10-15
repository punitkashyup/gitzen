/**
 * Main App Component
 * 
 * Root component with routing, authentication, and theme setup.
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import AuthPage from './pages/AuthPage';
import CallbackPage from './pages/CallbackPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import FindingsListPage from './pages/FindingsListPage';
import FindingDetailPage from './pages/FindingDetailPage';
import ProtectedRoute from './components/ProtectedRoute';
import './styles/design-system.css';
import './App.css';

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <BrowserRouter>
        <Routes>
          {/* Public Routes - Unified Auth Page */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/login" element={<Navigate to="/auth" replace />} />
          <Route path="/register" element={<Navigate to="/auth" replace />} />
          <Route path="/callback" element={<CallbackPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/findings" element={<FindingsListPage />} />
            <Route path="/findings/:id" element={<FindingDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* Redirect root to auth */}
          <Route path="/" element={<Navigate to="/auth" replace />} />

          {/* 404 - Redirect to auth */}
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
