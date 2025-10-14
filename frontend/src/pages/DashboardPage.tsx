/**
 * Dashboard Page
 * 
 * Main dashboard page showing user info and navigation.
 */
import { useAuthStore } from '../store/auth.store';

export default function DashboardPage() {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Gitzen</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* User Profile */}
              <div className="flex items-center space-x-3">
                {user?.avatar_url && (
                  <img
                    src={user.avatar_url}
                    alt={user.username}
                    className="h-8 w-8 rounded-full"
                  />
                )}
                <span className="text-sm font-medium text-gray-700">
                  {user?.username}
                </span>
              </div>
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Welcome, {user?.username}!
          </h2>
          <p className="text-gray-600 mb-6">
            You've successfully authenticated with GitHub. This is your dashboard.
          </p>

          {/* User Info Card */}
          <div className="bg-gray-50 rounded-lg p-6 space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">User ID:</span>
              <span className="ml-2 text-sm text-gray-900">{user?.id}</span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Username:</span>
              <span className="ml-2 text-sm text-gray-900">{user?.username}</span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Email:</span>
              <span className="ml-2 text-sm text-gray-900">{user?.email || 'Not provided'}</span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Role:</span>
              <span className="ml-2 text-sm text-gray-900">{user?.role}</span>
            </div>
            {user?.last_login_at && (
              <div>
                <span className="text-sm font-medium text-gray-500">Last Login:</span>
                <span className="ml-2 text-sm text-gray-900">
                  {new Date(user.last_login_at).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Coming Soon Notice */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">🚀 Coming Soon</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Findings management dashboard</li>
              <li>• Repository secret scanning</li>
              <li>• Guided cleanup workflow</li>
              <li>• Security metrics and trends</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
