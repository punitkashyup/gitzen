/**
 * Profile Page Component
 * 
 * User profile and settings page with GitHub integration
 * GITZ-20: Build user profile and settings page (8 points)
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useUser } from '../store/auth.store';
import { Button } from '../components/ui';
import githubService, { GitHubProfile, GitHubRepository } from '../services/github.service';
import { 
  User, 
  Settings, 
  Calendar, 
  Clock, 
  Github, 
  Mail, 
  Shield,
  LogOut,
  Bell,
  Monitor,
  Star,
  GitFork,
  ExternalLink,
  Eye,
  Lock
} from 'lucide-react';

export default function ProfilePage() {
  const navigate = useNavigate();
  const user = useUser();
  const { logout } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [githubProfile, setGithubProfile] = useState<GitHubProfile | null>(null);
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubError, setGithubError] = useState('');
  const [notificationSettings, setNotificationSettings] = useState({
    secretDetectionAlerts: true,
    weeklyReports: true,
    systemUpdates: false,
  });
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth', { replace: true });
      return;
    }
  }, [user, navigate]);

  // Load GitHub data
  useEffect(() => {
    const loadGithubData = async () => {
      if (!user || user.auth_provider !== 'github') return;
      
      setGithubLoading(true);
      setGithubError('');
      
      try {
        const [profileData, reposData] = await Promise.all([
          githubService.getGitHubProfile(),
          githubService.getGitHubRepositories()
        ]);
        
        setGithubProfile(profileData);
        setRepositories(reposData);
      } catch (error) {
        console.error('Error loading GitHub data:', error);
        setGithubError('Failed to load GitHub data. Please try again later.');
      } finally {
        setGithubLoading(false);
      }
    };

    loadGithubData();
  }, [user]);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
      navigate('/auth');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back to Dashboard
              </Button>
            </div>
            <div className="flex items-center space-x-4">
              <img
                src={user.avatar_url || '/default-avatar.png'}
                alt={user.username}
                className="w-10 h-10 rounded-full border-2 border-gray-200"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://ui-avatars.com/api/?name=${user.username}&background=3F3FF3&color=fff`;
                }}
              />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{user.username}</h1>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'profile'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <User className="w-4 h-4 inline-block mr-2" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'settings'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="w-4 h-4 inline-block mr-2" />
              Settings
            </button>
          </nav>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-8">
            {/* Account Information Card */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <User className="w-5 h-5 mr-2 text-indigo-600" />
                Account Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile Picture and Basic Info */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <img
                      src={user.avatar_url || '/default-avatar.png'}
                      alt={user.username}
                      className="w-16 h-16 rounded-full border-4 border-gray-100"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://ui-avatars.com/api/?name=${user.username}&background=3F3FF3&color=fff`;
                      }}
                    />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{user.username}</h3>
                      <p className="text-sm text-gray-500 flex items-center">
                        <Mail className="w-4 h-4 mr-1" />
                        {user.email || 'No email provided'}
                      </p>
                    </div>
                  </div>

                  {/* Authentication Provider */}
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Github className="w-4 h-4" />
                    <span>Connected via {user.auth_provider}</span>
                    {user.email_verified && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Shield className="w-3 h-3 mr-1" />
                        Verified
                      </span>
                    )}
                  </div>
                </div>

                {/* Account Dates */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-gray-500">Account Created</p>
                      <p className="font-medium text-gray-900">{formatDate(user.created_at)}</p>
                    </div>
                  </div>

                  {user.last_login_at && (
                    <div className="flex items-center space-x-3 text-sm">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-gray-500">Last Login</p>
                        <p className="font-medium text-gray-900">{formatDate(user.last_login_at)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* GitHub Profile Card */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Github className="w-5 h-5 mr-2 text-indigo-600" />
                  GitHub Profile
                </h2>
                {user?.auth_provider === 'github' && !githubLoading && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="text-gray-600"
                  >
                    Refresh
                  </Button>
                )}
              </div>
              
              {user?.auth_provider === 'github' ? (
                githubLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-sm text-gray-500">Loading GitHub profile...</p>
                  </div>
                ) : githubError ? (
                  <div className="text-center py-8 text-red-600">
                    <Github className="w-12 h-12 mx-auto mb-4 text-red-300" />
                    <p className="text-sm mb-4">{githubError}</p>
                    <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                      Retry
                    </Button>
                  </div>
                ) : githubProfile ? (
                  <div className="space-y-6">
                    {/* Profile Header */}
                    <div className="flex items-start space-x-4">
                      <img
                        src={githubProfile.avatar_url}
                        alt={githubProfile.login}
                        className="w-16 h-16 rounded-full border-2 border-gray-100"
                      />
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          {githubProfile.name || githubProfile.login}
                        </h3>
                        <p className="text-sm text-gray-600">@{githubProfile.login}</p>
                        {githubProfile.bio && (
                          <p className="text-sm text-gray-700 mt-2">{githubProfile.bio}</p>
                        )}
                        <a
                          href={githubProfile.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800 mt-2"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View on GitHub
                        </a>
                      </div>
                    </div>

                    {/* GitHub Stats */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{githubProfile.public_repos}</p>
                        <p className="text-sm text-gray-500">Repositories</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{githubProfile.followers}</p>
                        <p className="text-sm text-gray-500">Followers</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{githubProfile.following}</p>
                        <p className="text-sm text-gray-500">Following</p>
                      </div>
                    </div>

                    {/* Additional Info */}
                    {(githubProfile.location || githubProfile.company || githubProfile.blog) && (
                      <div className="pt-4 border-t space-y-2">
                        {githubProfile.location && (
                          <p className="text-sm text-gray-600 flex items-center">
                            <span className="w-4 h-4 mr-2">📍</span>
                            {githubProfile.location}
                          </p>
                        )}
                        {githubProfile.company && (
                          <p className="text-sm text-gray-600 flex items-center">
                            <span className="w-4 h-4 mr-2">🏢</span>
                            {githubProfile.company}
                          </p>
                        )}
                        {githubProfile.blog && (
                          <a
                            href={githubProfile.blog}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                          >
                            <span className="w-4 h-4 mr-2">🔗</span>
                            {githubProfile.blog}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Github className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-sm mb-4">No GitHub profile data available</p>
                  </div>
                )
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Github className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm mb-4">GitHub profile available for GitHub-authenticated users</p>
                  <p className="text-xs text-gray-400">You signed in with {user?.auth_provider}</p>
                </div>
              )}
            </div>

            {/* Repositories Card */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Monitor className="w-5 h-5 mr-2 text-indigo-600" />
                Connected Repositories
              </h2>
              
              {user?.auth_provider === 'github' ? (
                githubLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-sm text-gray-500">Loading repositories...</p>
                  </div>
                ) : repositories.length > 0 ? (
                  <div className="space-y-4">
                    {repositories.map((repo) => (
                      <div
                        key={repo.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-sm font-medium text-gray-900">{repo.name}</h3>
                              {repo.private ? (
                                <Lock className="w-4 h-4 text-gray-400" />
                              ) : (
                                <Eye className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                            {repo.description && (
                              <p className="text-sm text-gray-600 mt-1">{repo.description}</p>
                            )}
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              {repo.language && (
                                <span className="flex items-center">
                                  <span className="w-3 h-3 rounded-full bg-blue-400 mr-1"></span>
                                  {repo.language}
                                </span>
                              )}
                              <span className="flex items-center">
                                <Star className="w-3 h-3 mr-1" />
                                {repo.stargazers_count}
                              </span>
                              <span className="flex items-center">
                                <GitFork className="w-3 h-3 mr-1" />
                                {repo.forks_count}
                              </span>
                              <span>
                                Updated {new Date(repo.updated_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <a
                            href={repo.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 ml-4"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    ))}
                    
                    {repositories.length >= 3 && (
                      <div className="text-center pt-4">
                        <Button variant="outline" size="sm">
                          View All Repositories
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Monitor className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-sm mb-4">No repositories found</p>
                  </div>
                )
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Monitor className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm mb-4">Repository listing available for GitHub-authenticated users</p>
                  <p className="text-xs text-gray-400">You signed in with {user?.auth_provider}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-8">
            {/* Notification Settings */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Bell className="w-5 h-5 mr-2 text-indigo-600" />
                Notification Preferences
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Secret Detection Alerts</h3>
                    <p className="text-sm text-gray-500">Get notified when secrets are found in your repositories</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.secretDetectionAlerts}
                    onChange={(e) => 
                      setNotificationSettings(prev => ({
                        ...prev,
                        secretDetectionAlerts: e.target.checked
                      }))
                    }
                    disabled={settingsLoading}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Weekly Reports</h3>
                    <p className="text-sm text-gray-500">Receive weekly security summaries via email</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.weeklyReports}
                    onChange={(e) => 
                      setNotificationSettings(prev => ({
                        ...prev,
                        weeklyReports: e.target.checked
                      }))
                    }
                    disabled={settingsLoading}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">System Updates</h3>
                    <p className="text-sm text-gray-500">Get notified about system maintenance and updates</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.systemUpdates}
                    onChange={(e) => 
                      setNotificationSettings(prev => ({
                        ...prev,
                        systemUpdates: e.target.checked
                      }))
                    }
                    disabled={settingsLoading}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
                  />
                </div>
                
                {settingsLoading && (
                  <div className="flex items-center justify-center pt-4">
                    <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full mr-2"></div>
                    <span className="text-sm text-gray-500">Updating settings...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Security Settings */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-indigo-600" />
                Security & Sessions
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Current Session</h3>
                    <p className="text-sm text-gray-500">This browser session is active</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    isLoading={isLoading}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    {!isLoading && <LogOut className="w-4 h-4 mr-2" />}
                    {isLoading ? 'Signing Out...' : 'Sign Out'}
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Log Out From All Devices</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    This will sign you out from all browsers and devices where you're currently logged in.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    Log Out Everywhere
                  </Button>
                </div>
              </div>
            </div>

            {/* Account Management */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <User className="w-5 h-5 mr-2 text-indigo-600" />
                Account Management
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Account Type</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Your account role: <span className="font-medium capitalize">{user.role}</span>
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium text-gray-900 text-red-600 mb-2">Danger Zone</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}