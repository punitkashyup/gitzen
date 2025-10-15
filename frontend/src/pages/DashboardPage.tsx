/**
 * Dashboard Page - Statistics & Metrics
 * 
 * Main dashboard showing security metrics, trends, and repository comparison.
 * GITZ-25: Build statistics dashboard with metrics
 */
import { useMemo } from 'react';
import { useAuthStore } from '../store/auth.store';
import tokens from '../design/tokens';
import { Finding } from './FindingsListPage';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function DashboardPage() {
  const { user, logout } = useAuthStore();
  // Date range filter for future use
  // const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  // Mock findings data for dashboard (in production, this would come from API)
  const mockFindings: Finding[] = [
    {
      id: '1', repository: 'frontend-app', secretType: 'API Key', filePath: 'src/config/api.js',
      lineNumber: 12, description: 'Hardcoded API key', severity: 'critical', status: 'open',
      detectedAt: '2024-01-15T10:30:00Z', lastUpdated: '2024-01-15T10:30:00Z',
      assignee: 'john.doe@company.com', branch: 'main', commitHash: 'abc123'
    },
    {
      id: '2', repository: 'backend-services', secretType: 'Database Password', filePath: 'config/database.yaml',
      lineNumber: 8, description: 'Database password exposed', severity: 'high', status: 'in-progress',
      detectedAt: '2024-01-14T15:45:00Z', lastUpdated: '2024-01-16T09:20:00Z',
      assignee: 'jane.smith@company.com', branch: 'development', commitHash: 'def456'
    },
    {
      id: '3', repository: 'mobile-app', secretType: 'OAuth Token', filePath: 'src/services/auth.ts',
      lineNumber: 25, description: 'OAuth client secret found', severity: 'medium', status: 'resolved',
      detectedAt: '2024-01-13T08:15:00Z', lastUpdated: '2024-01-15T14:30:00Z',
      assignee: 'mike.wilson@company.com', branch: 'feature/oauth-fix', commitHash: 'ghi789'
    },
    {
      id: '4', repository: 'infrastructure', secretType: 'Private Key', filePath: 'terraform/aws/main.tf',
      lineNumber: 45, description: 'SSH private key embedded', severity: 'critical', status: 'false-positive',
      detectedAt: '2024-01-12T12:00:00Z', lastUpdated: '2024-01-14T16:45:00Z',
      assignee: 'sarah.jones@company.com', branch: 'main', commitHash: 'jkl012'
    },
    {
      id: '5', repository: 'data-pipeline', secretType: 'Connection String', filePath: '.env.example',
      lineNumber: 3, description: 'Connection string in example file', severity: 'low', status: 'resolved',
      detectedAt: '2024-01-11T09:00:00Z', lastUpdated: '2024-01-12T11:30:00Z',
      assignee: 'alex.brown@company.com', branch: 'main', commitHash: 'mno345'
    },
    {
      id: '6', repository: 'frontend-app', secretType: 'JWT Secret', filePath: 'src/auth/jwt.js',
      lineNumber: 18, description: 'JWT secret key hardcoded', severity: 'high', status: 'open',
      detectedAt: '2024-01-10T14:20:00Z', lastUpdated: '2024-01-10T14:20:00Z',
      assignee: 'john.doe@company.com', branch: 'main', commitHash: 'pqr678'
    },
    {
      id: '7', repository: 'backend-services', secretType: 'API Key', filePath: 'services/payment.js',
      lineNumber: 56, description: 'Payment API key exposed', severity: 'critical', status: 'resolved',
      detectedAt: '2024-01-09T11:30:00Z', lastUpdated: '2024-01-11T16:00:00Z',
      assignee: 'jane.smith@company.com', branch: 'main', commitHash: 'stu901'
    },
    {
      id: '8', repository: 'mobile-app', secretType: 'API Key', filePath: 'config/api.config.ts',
      lineNumber: 7, description: 'Third-party API key', severity: 'medium', status: 'in-progress',
      detectedAt: '2024-01-08T08:45:00Z', lastUpdated: '2024-01-14T10:00:00Z',
      assignee: 'mike.wilson@company.com', branch: 'develop', commitHash: 'vwx234'
    },
  ];

  // Calculate statistics
  const stats = useMemo(() => {
    const total = mockFindings.length;
    const byStatus = {
      open: mockFindings.filter(f => f.status === 'open').length,
      'in-progress': mockFindings.filter(f => f.status === 'in-progress').length,
      resolved: mockFindings.filter(f => f.status === 'resolved').length,
      'false-positive': mockFindings.filter(f => f.status === 'false-positive').length,
    };
    const bySeverity = {
      critical: mockFindings.filter(f => f.severity === 'critical').length,
      high: mockFindings.filter(f => f.severity === 'high').length,
      medium: mockFindings.filter(f => f.severity === 'medium').length,
      low: mockFindings.filter(f => f.severity === 'low').length,
      info: mockFindings.filter(f => f.severity === 'info').length,
    };
    const byType = mockFindings.reduce((acc, f) => {
      acc[f.secretType] = (acc[f.secretType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const resolutionRate = total > 0 
      ? Math.round((byStatus.resolved / total) * 100) 
      : 0;

    return { total, byStatus, bySeverity, byType, resolutionRate };
  }, [mockFindings]);

  // Repository comparison data
  const repositoryStats = useMemo(() => {
    const repos = mockFindings.reduce((acc, finding) => {
      if (!acc[finding.repository]) {
        acc[finding.repository] = {
          name: finding.repository,
          total: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          open: 0,
          resolved: 0
        };
      }
      acc[finding.repository].total++;
      acc[finding.repository][finding.severity]++;
      if (finding.status === 'open') acc[finding.repository].open++;
      if (finding.status === 'resolved') acc[finding.repository].resolved++;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(repos).sort((a: any, b: any) => 
      (b.critical + b.high) - (a.critical + a.high)
    );
  }, [mockFindings]);

  // Trend data (last 7 days)
  const trendData = useMemo(() => {
    const days = ['Jan 9', 'Jan 10', 'Jan 11', 'Jan 12', 'Jan 13', 'Jan 14', 'Jan 15'];
    const detected = [1, 1, 1, 1, 1, 2, 1];
    const resolved = [0, 0, 1, 0, 0, 1, 1];
    
    return {
      labels: days,
      datasets: [
        {
          label: 'Detected',
          data: detected,
          borderColor: tokens.colors.error[500],
          backgroundColor: `${tokens.colors.error[500]}20`,
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Resolved',
          data: resolved,
          borderColor: tokens.colors.success[500],
          backgroundColor: `${tokens.colors.success[500]}20`,
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }, []);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Repository', 'Total', 'Critical', 'High', 'Medium', 'Low', 'Open', 'Resolved'];
    const rows = repositoryStats.map((repo: any) => [
      repo.name,
      repo.total,
      repo.critical,
      repo.high,
      repo.medium,
      repo.low,
      repo.open,
      repo.resolved,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `findings-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: tokens.colors.neutral[50] }}>
      {/* Header */}
      <header style={{
        backgroundColor: tokens.colors.neutral[0],
        boxShadow: tokens.shadows.sm,
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: `${tokens.spacing[4]} ${tokens.spacing[6]}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[6] }}>
            <h1 style={{
              fontSize: tokens.typography.fontSize['2xl'].size,
              fontWeight: tokens.typography.fontWeight.bold,
              color: tokens.colors.neutral[900],
              margin: 0
            }}>
              Gitzen Dashboard
            </h1>
            <nav style={{ display: 'flex', gap: tokens.spacing[1] }}>
              <a href="/dashboard" style={{
                padding: `${tokens.spacing[2]} ${tokens.spacing[3]}`,
                borderRadius: tokens.borderRadius.md,
                color: tokens.colors.primary[600],
                backgroundColor: tokens.colors.primary[50],
                fontWeight: tokens.typography.fontWeight.medium,
                fontSize: tokens.typography.fontSize.sm.size,
                textDecoration: 'none'
              }}>
                Dashboard
              </a>
              <a href="/findings" style={{
                padding: `${tokens.spacing[2]} ${tokens.spacing[3]}`,
                borderRadius: tokens.borderRadius.md,
                color: tokens.colors.neutral[600],
                fontWeight: tokens.typography.fontWeight.medium,
                fontSize: tokens.typography.fontSize.sm.size,
                textDecoration: 'none'
              }}>
                Findings
              </a>
            </nav>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[4] }}>
            <a href="/profile" style={{
              display: 'flex',
              alignItems: 'center',
              gap: tokens.spacing[3],
              padding: `${tokens.spacing[2]} ${tokens.spacing[3]}`,
              borderRadius: tokens.borderRadius.md,
              textDecoration: 'none',
              transition: tokens.transitions.colors
            }}>
              {user?.avatar_url && (
                <img
                  src={user.avatar_url}
                  alt={user.username}
                  style={{ height: '32px', width: '32px', borderRadius: tokens.borderRadius.full }}
                />
              )}
              <span style={{
                fontSize: tokens.typography.fontSize.sm.size,
                fontWeight: tokens.typography.fontWeight.medium,
                color: tokens.colors.neutral[700]
              }}>
                {user?.username}
              </span>
            </a>
            <button
              onClick={handleLogout}
              style={{
                padding: `${tokens.spacing[2]} ${tokens.spacing[4]}`,
                fontSize: tokens.typography.fontSize.sm.size,
                fontWeight: tokens.typography.fontWeight.medium,
                color: tokens.colors.neutral[700],
                border: `1px solid ${tokens.colors.neutral[300]}`,
                borderRadius: tokens.borderRadius.md,
                backgroundColor: 'transparent',
                cursor: 'pointer',
                transition: tokens.transitions.colors
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: `${tokens.spacing[8]} ${tokens.spacing[6]}`
      }}>
        {/* Page Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: tokens.spacing[6]
        }}>
          <div>
            <h2 style={{
              fontSize: tokens.typography.fontSize.xl.size,
              fontWeight: tokens.typography.fontWeight.semibold,
              color: tokens.colors.neutral[900],
              margin: 0,
              marginBottom: tokens.spacing[1]
            }}>
              Security Overview
            </h2>
            <p style={{
              fontSize: tokens.typography.fontSize.sm.size,
              color: tokens.colors.neutral[600],
              margin: 0
            }}>
              Monitor your secret detection metrics and trends
            </p>
          </div>
          <button
            onClick={exportToCSV}
            style={{
              padding: `${tokens.spacing[2]} ${tokens.spacing[4]}`,
              fontSize: tokens.typography.fontSize.sm.size,
              fontWeight: tokens.typography.fontWeight.medium,
              color: tokens.colors.neutral[0],
              backgroundColor: tokens.colors.primary[600],
              border: 'none',
              borderRadius: tokens.borderRadius.md,
              cursor: 'pointer',
              transition: tokens.transitions.colors,
              display: 'flex',
              alignItems: 'center',
              gap: tokens.spacing[2]
            }}
          >
            <span>📥</span>
            Export to CSV
          </button>
        </div>

        {/* Metrics Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: tokens.spacing[4],
          marginBottom: tokens.spacing[6]
        }}>
          {/* Total Findings */}
          <div style={{
            backgroundColor: tokens.colors.neutral[0],
            borderRadius: tokens.borderRadius.lg,
            padding: tokens.spacing[6],
            boxShadow: tokens.shadows.sm,
            border: `1px solid ${tokens.colors.neutral[200]}`
          }}>
            <div style={{
              fontSize: tokens.typography.fontSize.sm.size,
              fontWeight: tokens.typography.fontWeight.medium,
              color: tokens.colors.neutral[600],
              marginBottom: tokens.spacing[2]
            }}>
              Total Findings
            </div>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: tokens.typography.fontWeight.bold,
              color: tokens.colors.neutral[900],
              marginBottom: tokens.spacing[2]
            }}>
              {stats.total}
            </div>
            <div style={{
              fontSize: tokens.typography.fontSize.xs.size,
              color: tokens.colors.neutral[500]
            }}>
              Across all repositories
            </div>
          </div>

          {/* Resolution Rate */}
          <div style={{
            backgroundColor: tokens.colors.neutral[0],
            borderRadius: tokens.borderRadius.lg,
            padding: tokens.spacing[6],
            boxShadow: tokens.shadows.sm,
            border: `1px solid ${tokens.colors.neutral[200]}`
          }}>
            <div style={{
              fontSize: tokens.typography.fontSize.sm.size,
              fontWeight: tokens.typography.fontWeight.medium,
              color: tokens.colors.neutral[600],
              marginBottom: tokens.spacing[2]
            }}>
              Resolution Rate
            </div>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: tokens.typography.fontWeight.bold,
              color: tokens.colors.success[600],
              marginBottom: tokens.spacing[2]
            }}>
              {stats.resolutionRate}%
            </div>
            <div style={{
              fontSize: tokens.typography.fontSize.xs.size,
              color: tokens.colors.neutral[500]
            }}>
              {stats.byStatus.resolved} of {stats.total} resolved
            </div>
          </div>

          {/* Open Findings */}
          <div style={{
            backgroundColor: tokens.colors.neutral[0],
            borderRadius: tokens.borderRadius.lg,
            padding: tokens.spacing[6],
            boxShadow: tokens.shadows.sm,
            border: `1px solid ${tokens.colors.neutral[200]}`
          }}>
            <div style={{
              fontSize: tokens.typography.fontSize.sm.size,
              fontWeight: tokens.typography.fontWeight.medium,
              color: tokens.colors.neutral[600],
              marginBottom: tokens.spacing[2]
            }}>
              Open Findings
            </div>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: tokens.typography.fontWeight.bold,
              color: tokens.colors.error[600],
              marginBottom: tokens.spacing[2]
            }}>
              {stats.byStatus.open}
            </div>
            <div style={{
              fontSize: tokens.typography.fontSize.xs.size,
              color: tokens.colors.neutral[500]
            }}>
              Requiring attention
            </div>
          </div>

          {/* In Progress */}
          <div style={{
            backgroundColor: tokens.colors.neutral[0],
            borderRadius: tokens.borderRadius.lg,
            padding: tokens.spacing[6],
            boxShadow: tokens.shadows.sm,
            border: `1px solid ${tokens.colors.neutral[200]}`
          }}>
            <div style={{
              fontSize: tokens.typography.fontSize.sm.size,
              fontWeight: tokens.typography.fontWeight.medium,
              color: tokens.colors.neutral[600],
              marginBottom: tokens.spacing[2]
            }}>
              In Progress
            </div>
            <div style={{
              fontSize: '2.5rem',
              fontWeight: tokens.typography.fontWeight.bold,
              color: tokens.colors.warning[600],
              marginBottom: tokens.spacing[2]
            }}>
              {stats.byStatus['in-progress']}
            </div>
            <div style={{
              fontSize: tokens.typography.fontSize.xs.size,
              color: tokens.colors.neutral[500]
            }}>
              Being remediated
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: tokens.spacing[4],
          marginBottom: tokens.spacing[6]
        }}>
          {/* Trend Chart */}
          <div style={{
            backgroundColor: tokens.colors.neutral[0],
            borderRadius: tokens.borderRadius.lg,
            padding: tokens.spacing[6],
            boxShadow: tokens.shadows.sm,
            border: `1px solid ${tokens.colors.neutral[200]}`
          }}>
            <h3 style={{
              fontSize: tokens.typography.fontSize.lg.size,
              fontWeight: tokens.typography.fontWeight.semibold,
              color: tokens.colors.neutral[900],
              margin: 0,
              marginBottom: tokens.spacing[4]
            }}>
              Findings Trend (Last 7 Days)
            </h3>
            <div style={{ height: '300px' }}>
              <Line data={trendData} options={chartOptions} />
            </div>
          </div>

          {/* Severity Breakdown */}
          <div style={{
            backgroundColor: tokens.colors.neutral[0],
            borderRadius: tokens.borderRadius.lg,
            padding: tokens.spacing[6],
            boxShadow: tokens.shadows.sm,
            border: `1px solid ${tokens.colors.neutral[200]}`
          }}>
            <h3 style={{
              fontSize: tokens.typography.fontSize.lg.size,
              fontWeight: tokens.typography.fontWeight.semibold,
              color: tokens.colors.neutral[900],
              margin: 0,
              marginBottom: tokens.spacing[4]
            }}>
              By Severity
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[3] }}>
              {[
                { label: 'Critical', count: stats.bySeverity.critical, color: tokens.colors.error[600] },
                { label: 'High', count: stats.bySeverity.high, color: tokens.colors.warning[600] },
                { label: 'Medium', count: stats.bySeverity.medium, color: tokens.colors.warning[500] },
                { label: 'Low', count: stats.bySeverity.low, color: tokens.colors.info[600] },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[3] }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: tokens.borderRadius.full,
                    backgroundColor: item.color,
                    flexShrink: 0
                  }} />
                  <div style={{
                    flex: 1,
                    fontSize: tokens.typography.fontSize.sm.size,
                    color: tokens.colors.neutral[700]
                  }}>
                    {item.label}
                  </div>
                  <div style={{
                    fontSize: tokens.typography.fontSize.lg.size,
                    fontWeight: tokens.typography.fontWeight.semibold,
                    color: tokens.colors.neutral[900]
                  }}>
                    {item.count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Repository Comparison Table */}
        <div style={{
          backgroundColor: tokens.colors.neutral[0],
          borderRadius: tokens.borderRadius.lg,
          padding: tokens.spacing[6],
          boxShadow: tokens.shadows.sm,
          border: `1px solid ${tokens.colors.neutral[200]}`
        }}>
          <h3 style={{
            fontSize: tokens.typography.fontSize.lg.size,
            fontWeight: tokens.typography.fontWeight.semibold,
            color: tokens.colors.neutral[900],
            margin: 0,
            marginBottom: tokens.spacing[4]
          }}>
            Repository Comparison
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: tokens.typography.fontSize.sm.size
            }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${tokens.colors.neutral[200]}` }}>
                  <th style={{
                    textAlign: 'left',
                    padding: `${tokens.spacing[3]} ${tokens.spacing[4]}`,
                    fontWeight: tokens.typography.fontWeight.semibold,
                    color: tokens.colors.neutral[700]
                  }}>
                    Repository
                  </th>
                  <th style={{
                    textAlign: 'center',
                    padding: `${tokens.spacing[3]} ${tokens.spacing[4]}`,
                    fontWeight: tokens.typography.fontWeight.semibold,
                    color: tokens.colors.neutral[700]
                  }}>
                    Total
                  </th>
                  <th style={{
                    textAlign: 'center',
                    padding: `${tokens.spacing[3]} ${tokens.spacing[4]}`,
                    fontWeight: tokens.typography.fontWeight.semibold,
                    color: tokens.colors.neutral[700]
                  }}>
                    Critical
                  </th>
                  <th style={{
                    textAlign: 'center',
                    padding: `${tokens.spacing[3]} ${tokens.spacing[4]}`,
                    fontWeight: tokens.typography.fontWeight.semibold,
                    color: tokens.colors.neutral[700]
                  }}>
                    High
                  </th>
                  <th style={{
                    textAlign: 'center',
                    padding: `${tokens.spacing[3]} ${tokens.spacing[4]}`,
                    fontWeight: tokens.typography.fontWeight.semibold,
                    color: tokens.colors.neutral[700]
                  }}>
                    Medium
                  </th>
                  <th style={{
                    textAlign: 'center',
                    padding: `${tokens.spacing[3]} ${tokens.spacing[4]}`,
                    fontWeight: tokens.typography.fontWeight.semibold,
                    color: tokens.colors.neutral[700]
                  }}>
                    Low
                  </th>
                  <th style={{
                    textAlign: 'center',
                    padding: `${tokens.spacing[3]} ${tokens.spacing[4]}`,
                    fontWeight: tokens.typography.fontWeight.semibold,
                    color: tokens.colors.neutral[700]
                  }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {repositoryStats.map((repo: any) => {
                  const isHighRisk = repo.critical > 0 || repo.high > 1;
                  return (
                    <tr
                      key={repo.name}
                      style={{
                        borderBottom: `1px solid ${tokens.colors.neutral[200]}`,
                        backgroundColor: isHighRisk ? `${tokens.colors.error[50]}` : 'transparent'
                      }}
                    >
                      <td style={{
                        padding: `${tokens.spacing[3]} ${tokens.spacing[4]}`,
                        fontWeight: tokens.typography.fontWeight.medium,
                        color: tokens.colors.neutral[900]
                      }}>
                        {repo.name}
                        {isHighRisk && (
                          <span style={{
                            marginLeft: tokens.spacing[2],
                            fontSize: tokens.typography.fontSize.xs.size,
                            padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
                            backgroundColor: tokens.colors.error[100],
                            color: tokens.colors.error[700],
                            borderRadius: tokens.borderRadius.md,
                            fontWeight: tokens.typography.fontWeight.medium
                          }}>
                            High Risk
                          </span>
                        )}
                      </td>
                      <td style={{
                        textAlign: 'center',
                        padding: `${tokens.spacing[3]} ${tokens.spacing[4]}`,
                        color: tokens.colors.neutral[700]
                      }}>
                        {repo.total}
                      </td>
                      <td style={{
                        textAlign: 'center',
                        padding: `${tokens.spacing[3]} ${tokens.spacing[4]}`,
                        color: repo.critical > 0 ? tokens.colors.error[600] : tokens.colors.neutral[500],
                        fontWeight: repo.critical > 0 ? tokens.typography.fontWeight.semibold : 'normal'
                      }}>
                        {repo.critical}
                      </td>
                      <td style={{
                        textAlign: 'center',
                        padding: `${tokens.spacing[3]} ${tokens.spacing[4]}`,
                        color: repo.high > 0 ? tokens.colors.warning[600] : tokens.colors.neutral[500],
                        fontWeight: repo.high > 0 ? tokens.typography.fontWeight.semibold : 'normal'
                      }}>
                        {repo.high}
                      </td>
                      <td style={{
                        textAlign: 'center',
                        padding: `${tokens.spacing[3]} ${tokens.spacing[4]}`,
                        color: tokens.colors.neutral[700]
                      }}>
                        {repo.medium}
                      </td>
                      <td style={{
                        textAlign: 'center',
                        padding: `${tokens.spacing[3]} ${tokens.spacing[4]}`,
                        color: tokens.colors.neutral[700]
                      }}>
                        {repo.low}
                      </td>
                      <td style={{
                        textAlign: 'center',
                        padding: `${tokens.spacing[3]} ${tokens.spacing[4]}`,
                      }}>
                        <span style={{
                          fontSize: tokens.typography.fontSize.xs.size,
                          padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
                          backgroundColor: repo.open > 0 ? tokens.colors.error[100] : tokens.colors.success[100],
                          color: repo.open > 0 ? tokens.colors.error[700] : tokens.colors.success[700],
                          borderRadius: tokens.borderRadius.md,
                          fontWeight: tokens.typography.fontWeight.medium
                        }}>
                          {repo.open} open
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
