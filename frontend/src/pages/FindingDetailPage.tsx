import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import tokens from '../design/tokens';

// TypeScript interfaces
interface Finding {
  id: string;
  repository: string;
  secretType: string;
  filePath: string;
  lineNumber: number;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  status: 'open' | 'in-progress' | 'resolved' | 'false-positive';
  detectedAt: string;
  lastUpdated: string;
  assignee: string | null;
  branch: string;
  commitHash: string;
  commitUrl?: string;
  prUrl?: string;
}

interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  avatar?: string;
}

interface RemediationGuide {
  title: string;
  description: string;
  steps: string[];
  resources: { title: string; url: string }[];
}

// Mock data for demonstration
const mockFindings: Finding[] = [
  {
    id: '1',
    repository: 'frontend-app',
    secretType: 'AWS Access Key',
    filePath: 'src/config/aws.ts',
    lineNumber: 23,
    description: 'AWS access key detected in configuration file',
    severity: 'critical',
    status: 'open',
    detectedAt: '2025-10-14T10:30:00Z',
    lastUpdated: '2025-10-14T10:30:00Z',
    assignee: 'john.doe',
    branch: 'main',
    commitHash: 'a3f2b9d',
    commitUrl: 'https://github.com/org/frontend-app/commit/a3f2b9d',
    prUrl: 'https://github.com/org/frontend-app/pull/123',
  },
  {
    id: '2',
    repository: 'frontend-app',
    secretType: 'API Key',
    filePath: 'src/utils/api.ts',
    lineNumber: 45,
    description: 'API key found in utility file',
    severity: 'high',
    status: 'in-progress',
    detectedAt: '2025-10-13T14:20:00Z',
    lastUpdated: '2025-10-14T09:15:00Z',
    assignee: 'jane.smith',
    branch: 'develop',
    commitHash: 'b7e4c1a',
    commitUrl: 'https://github.com/org/frontend-app/commit/b7e4c1a',
  },
  {
    id: '3',
    repository: 'backend-services',
    secretType: 'Database Password',
    filePath: 'config/database.yml',
    lineNumber: 12,
    description: 'Database password hardcoded in configuration',
    severity: 'critical',
    status: 'open',
    detectedAt: '2025-10-12T08:45:00Z',
    lastUpdated: '2025-10-12T08:45:00Z',
    assignee: null,
    branch: 'main',
    commitHash: 'c9a6d3e',
    commitUrl: 'https://github.com/org/backend-services/commit/c9a6d3e',
  },
];

const mockComments: Comment[] = [
  {
    id: '1',
    author: 'John Doe',
    content: 'This appears to be a test key, but we should still remove it from the codebase.',
    createdAt: '2025-10-14T11:00:00Z',
    avatar: 'JD',
  },
  {
    id: '2',
    author: 'Jane Smith',
    content: 'I\'ve created a ticket to rotate this key and remove it from the repository history.',
    createdAt: '2025-10-14T12:30:00Z',
    avatar: 'JS',
  },
];

const remediationGuides: Record<string, RemediationGuide> = {
  'AWS Access Key': {
    title: 'AWS Access Key Remediation',
    description: 'AWS access keys provide programmatic access to AWS services. If exposed, they can be used to access your AWS resources.',
    steps: [
      'Immediately rotate the exposed AWS access key in the AWS IAM Console',
      'Remove the key from your codebase and git history',
      'Use AWS Secrets Manager or environment variables for key storage',
      'Review CloudTrail logs for any unauthorized access',
      'Implement AWS IAM roles for applications running on AWS infrastructure',
    ],
    resources: [
      { title: 'AWS Security Best Practices', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html' },
      { title: 'Rotating AWS Access Keys', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html#Using_RotateAccessKey' },
    ],
  },
  'API Key': {
    title: 'API Key Remediation',
    description: 'API keys provide access to external services. Exposed keys can lead to unauthorized usage and potential data breaches.',
    steps: [
      'Revoke the exposed API key immediately',
      'Generate a new API key from the service provider',
      'Remove the key from your codebase and git history',
      'Store API keys in environment variables or secure vaults',
      'Implement key rotation policies',
    ],
    resources: [
      { title: 'API Key Best Practices', url: 'https://cloud.google.com/docs/authentication/api-keys' },
    ],
  },
  'Database Password': {
    title: 'Database Password Remediation',
    description: 'Database passwords provide access to your database. Exposure can lead to data breaches and unauthorized access.',
    steps: [
      'Change the database password immediately',
      'Remove the password from your codebase and git history',
      'Use environment variables or secret management tools',
      'Review database access logs for suspicious activity',
      'Implement connection string encryption',
      'Consider using managed database services with IAM authentication',
    ],
    resources: [
      { title: 'Database Security Best Practices', url: 'https://www.postgresql.org/docs/current/auth-password.html' },
    ],
  },
};

interface FindingDetailPageProps {
  findingId?: string;
  inModal?: boolean;
}

const FindingDetailPage: React.FC<FindingDetailPageProps> = ({ findingId: propFindingId, inModal = false }) => {
  const { id: paramId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const id = propFindingId || paramId;
  const [finding, setFinding] = useState<Finding | null>(null);
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [newComment, setNewComment] = useState('');
  const [relatedFindings, setRelatedFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'remediation' | 'activity'>('details');
  const [showConfirmation, setShowConfirmation] = useState<'false-positive' | 'resolved' | null>(null);
  const [actionReason, setActionReason] = useState('');

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const foundFinding = mockFindings.find((f) => f.id === id);
      if (foundFinding) {
        setFinding(foundFinding);
        // Find related findings (same repository or same secret type)
        const related = mockFindings.filter(
          (f) => f.id !== id && (f.repository === foundFinding.repository || f.secretType === foundFinding.secretType)
        );
        setRelatedFindings(related);
      }
      setLoading(false);
    }, 300);
  }, [id]);

  const handleStatusChange = (newStatus: 'false-positive' | 'resolved') => {
    if (!finding) return;
    setFinding({ ...finding, status: newStatus, lastUpdated: new Date().toISOString() });
    setShowConfirmation(null);
    setActionReason('');
    
    // Add a comment about the status change
    const newComment: Comment = {
      id: String(comments.length + 1),
      author: 'Current User',
      content: `Changed status to ${newStatus}${actionReason ? `: ${actionReason}` : ''}`,
      createdAt: new Date().toISOString(),
      avatar: 'CU',
    };
    setComments([...comments, newComment]);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const comment: Comment = {
      id: String(comments.length + 1),
      author: 'Current User',
      content: newComment,
      createdAt: new Date().toISOString(),
      avatar: 'CU',
    };
    setComments([...comments, comment]);
    setNewComment('');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return tokens.colors.severity.critical;
      case 'high': return tokens.colors.severity.high;
      case 'medium': return tokens.colors.severity.medium;
      case 'low': return tokens.colors.severity.low;
      default: return tokens.colors.severity.info;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return tokens.colors.status.open;
      case 'in-progress': return tokens.colors.status.inProgress;
      case 'resolved': return tokens.colors.status.resolved;
      case 'false-positive': return tokens.colors.status.falsePositive;
      default: return tokens.colors.neutral[500];
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div style={{ padding: tokens.spacing[32], textAlign: 'center' }}>
        <div style={{ fontSize: tokens.typography.fontSize.lg.size, color: tokens.colors.neutral[600] }}>
          Loading finding details...
        </div>
      </div>
    );
  }

  if (!finding) {
    return (
      <div style={{ padding: tokens.spacing[32], textAlign: 'center' }}>
        <div style={{ fontSize: tokens.typography.fontSize.xl.size, fontWeight: tokens.typography.fontWeight.semibold, color: tokens.colors.neutral[900], marginBottom: tokens.spacing[8] }}>
          Finding Not Found
        </div>
        <div style={{ color: tokens.colors.neutral[600], marginBottom: tokens.spacing[16] }}>
          The finding you're looking for doesn't exist or has been removed.
        </div>
        <button
          onClick={() => navigate('/findings')}
          className="btn btn-primary"
          style={{
            padding: `${tokens.spacing[8]} ${tokens.spacing[16]}`,
            backgroundColor: tokens.colors.primary[600],
            color: tokens.colors.neutral[50],
            borderRadius: tokens.borderRadius.md,
            border: 'none',
            cursor: 'pointer',
            fontWeight: tokens.typography.fontWeight.medium,
          }}
        >
          Back to Findings
        </button>
      </div>
    );
  }

  const remediation = remediationGuides[finding.secretType];

  return (
    <div style={{ 
      padding: inModal ? tokens.spacing[12] : `${tokens.spacing[12]} ${tokens.spacing[12]}`,
      maxWidth: '1400px', 
      margin: '0 auto',
      minHeight: inModal ? 'auto' : '100vh',
      backgroundColor: tokens.colors.neutral[50],
    }}>
      {/* Header - Ultra Compact */}
      <div style={{ 
        marginBottom: tokens.spacing[12],
        paddingBottom: tokens.spacing[12],
        borderBottom: `1px solid ${tokens.colors.neutral[200]}`,
        backgroundColor: tokens.colors.neutral[50],
      }}>
        {!inModal && (
          <button
            onClick={() => navigate('/findings')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: tokens.spacing[4],
              padding: `${tokens.spacing[4]} ${tokens.spacing[8]}`,
              backgroundColor: 'transparent',
              border: 'none',
              color: tokens.colors.primary[600],
              cursor: 'pointer',
              fontSize: tokens.typography.fontSize.xs.size,
              fontWeight: tokens.typography.fontWeight.medium,
              marginBottom: tokens.spacing[8],
            }}
          >
            ← Back
          </button>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: tokens.spacing[12], marginBottom: tokens.spacing[8] }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ 
              fontSize: '10px',
              color: tokens.colors.neutral[500],
              fontWeight: tokens.typography.fontWeight.medium,
              marginBottom: tokens.spacing[2],
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Finding #{finding.id}
            </div>
            <h1 style={{ 
              fontSize: tokens.typography.fontSize.lg.size, 
              fontWeight: tokens.typography.fontWeight.bold, 
              color: tokens.colors.neutral[900], 
              marginBottom: 0,
              lineHeight: '1.3',
            }}>
              {finding.secretType} in {finding.repository}
            </h1>
          </div>

          {finding.status === 'open' && (
            <div style={{ display: 'flex', gap: tokens.spacing[6], flexShrink: 0 }}>
              <button
                onClick={() => setShowConfirmation('false-positive')}
                style={{
                  padding: `${tokens.spacing[6]} ${tokens.spacing[10]}`,
                  backgroundColor: tokens.colors.neutral[100],
                  color: tokens.colors.neutral[700],
                  border: `1px solid ${tokens.colors.neutral[300]}`,
                  borderRadius: tokens.borderRadius.sm,
                  cursor: 'pointer',
                  fontWeight: tokens.typography.fontWeight.medium,
                  fontSize: tokens.typography.fontSize.xs.size,
                  whiteSpace: 'nowrap',
                }}
              >
                False Positive
              </button>
              <button
                onClick={() => setShowConfirmation('resolved')}
                style={{
                  padding: `${tokens.spacing[6]} ${tokens.spacing[10]}`,
                  backgroundColor: tokens.colors.success[600],
                  color: tokens.colors.neutral[50],
                  border: 'none',
                  borderRadius: tokens.borderRadius.sm,
                  cursor: 'pointer',
                  fontWeight: tokens.typography.fontWeight.medium,
                  fontSize: tokens.typography.fontSize.xs.size,
                  whiteSpace: 'nowrap',
                }}
              >
                Resolve
              </button>
            </div>
          )}
        </div>

        {/* Ultra Compact Badges Row */}
        <div style={{ display: 'flex', gap: tokens.spacing[6], flexWrap: 'wrap', alignItems: 'center' }}>
          <span
            style={{
              padding: `${tokens.spacing[2]} ${tokens.spacing[8]}`,
              backgroundColor: getSeverityColor(finding.severity),
              color: tokens.colors.neutral[50],
              borderRadius: tokens.borderRadius.sm,
              fontSize: '10px',
              fontWeight: tokens.typography.fontWeight.bold,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {finding.severity}
          </span>
          <span
            style={{
              padding: `${tokens.spacing[2]} ${tokens.spacing[8]}`,
              backgroundColor: getStatusColor(finding.status),
              color: tokens.colors.neutral[50],
              borderRadius: tokens.borderRadius.sm,
              fontSize: '10px',
              fontWeight: tokens.typography.fontWeight.bold,
              textTransform: 'capitalize',
            }}
          >
            {finding.status.replace('-', ' ')}
          </span>
          <div style={{ width: '1px', height: '12px', backgroundColor: tokens.colors.neutral[300] }} />
          <span style={{ fontSize: '11px', color: tokens.colors.neutral[600] }}>
            {finding.branch}
          </span>
          <span style={{ fontSize: '11px', color: tokens.colors.neutral[500] }}>
            {formatDate(finding.detectedAt)}
          </span>
          {finding.assignee && (
            <span style={{ fontSize: '11px', color: tokens.colors.neutral[600] }}>
              @{finding.assignee}
            </span>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: tokens.zIndex.modal,
        }}>
          <div style={{
            backgroundColor: tokens.colors.neutral[50],
            borderRadius: tokens.borderRadius.lg,
            padding: tokens.spacing[24],
            maxWidth: '500px',
            width: '90%',
            boxShadow: tokens.shadows.xl,
          }}>
            <h3 style={{ fontSize: tokens.typography.fontSize.xl.size, fontWeight: tokens.typography.fontWeight.semibold, marginBottom: tokens.spacing[16] }}>
              Confirm {showConfirmation === 'false-positive' ? 'False Positive' : 'Resolution'}
            </h3>
            <p style={{ color: tokens.colors.neutral[600], marginBottom: tokens.spacing[16] }}>
              {showConfirmation === 'false-positive'
                ? 'Please provide a reason for marking this finding as a false positive:'
                : 'Please confirm that this security issue has been resolved:'}
            </p>
            <textarea
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="Enter reason (optional)..."
              style={{
                width: '100%',
                minHeight: '80px',
                padding: tokens.spacing[12],
                border: `1px solid ${tokens.colors.neutral[300]}`,
                borderRadius: tokens.borderRadius.md,
                fontSize: tokens.typography.fontSize.sm.size,
                marginBottom: tokens.spacing[16],
                fontFamily: tokens.typography.fontFamily.sans,
              }}
            />
            <div style={{ display: 'flex', gap: tokens.spacing[12], justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowConfirmation(null); setActionReason(''); }}
                style={{
                  padding: `${tokens.spacing[8]} ${tokens.spacing[16]}`,
                  backgroundColor: tokens.colors.neutral[100],
                  color: tokens.colors.neutral[700],
                  border: `1px solid ${tokens.colors.neutral[300]}`,
                  borderRadius: tokens.borderRadius.md,
                  cursor: 'pointer',
                  fontWeight: tokens.typography.fontWeight.medium,
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleStatusChange(showConfirmation)}
                style={{
                  padding: `${tokens.spacing[8]} ${tokens.spacing[16]}`,
                  backgroundColor: tokens.colors.primary[600],
                  color: tokens.colors.neutral[50],
                  border: 'none',
                  borderRadius: tokens.borderRadius.md,
                  cursor: 'pointer',
                  fontWeight: tokens.typography.fontWeight.medium,
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: tokens.spacing[12] }}>
        {/* Main Content */}
        <div>
          {/* Tabs - Ultra Compact */}
          <div style={{ borderBottom: `1px solid ${tokens.colors.neutral[200]}`, marginBottom: tokens.spacing[12] }}>
            <div style={{ display: 'flex', gap: tokens.spacing[8] }}>
              {(['details', 'remediation', 'activity'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: `${tokens.spacing[6]} ${tokens.spacing[10]}`,
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: `2px solid ${activeTab === tab ? tokens.colors.primary[600] : 'transparent'}`,
                    color: activeTab === tab ? tokens.colors.primary[600] : tokens.colors.neutral[600],
                    cursor: 'pointer',
                    fontWeight: tokens.typography.fontWeight.semibold,
                    fontSize: tokens.typography.fontSize.xs.size,
                    textTransform: 'capitalize',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content - Ultra Compact */}
          {activeTab === 'details' && (
            <div className="card" style={{ 
              padding: tokens.spacing[12], 
              backgroundColor: tokens.colors.neutral[50], 
              borderRadius: tokens.borderRadius.sm, 
              border: `1px solid ${tokens.colors.neutral[200]}`,
            }}>
              {/* Description - Compact */}
              <div style={{ marginBottom: tokens.spacing[12], paddingBottom: tokens.spacing[10], borderBottom: `1px solid ${tokens.colors.neutral[200]}` }}>
                <div style={{ 
                  fontSize: '10px', 
                  fontWeight: tokens.typography.fontWeight.bold, 
                  color: tokens.colors.neutral[500], 
                  marginBottom: tokens.spacing[4],
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  Description
                </div>
                <div style={{ fontSize: tokens.typography.fontSize.xs.size, color: tokens.colors.neutral[800], lineHeight: '1.5' }}>
                  {finding.description}
                </div>
              </div>

              {/* Ultra Compact 3-Column Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: tokens.spacing[10], marginBottom: tokens.spacing[10] }}>
                <div>
                  <div style={{ 
                    fontSize: '10px', 
                    fontWeight: tokens.typography.fontWeight.bold, 
                    color: tokens.colors.neutral[500], 
                    marginBottom: tokens.spacing[2],
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>
                    Repository
                  </div>
                  <div style={{ fontSize: tokens.typography.fontSize.xs.size, color: tokens.colors.neutral[900], fontFamily: tokens.typography.fontFamily.mono, wordBreak: 'break-all' }}>
                    {finding.repository}
                  </div>
                </div>

                <div>
                  <div style={{ 
                    fontSize: '10px', 
                    fontWeight: tokens.typography.fontWeight.bold, 
                    color: tokens.colors.neutral[500], 
                    marginBottom: tokens.spacing[2],
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>
                    Branch
                  </div>
                  <div style={{ fontSize: tokens.typography.fontSize.xs.size, color: tokens.colors.neutral[900], fontFamily: tokens.typography.fontFamily.mono }}>
                    {finding.branch}
                  </div>
                </div>

                <div>
                  <div style={{ 
                    fontSize: '10px', 
                    fontWeight: tokens.typography.fontWeight.bold, 
                    color: tokens.colors.neutral[500], 
                    marginBottom: tokens.spacing[2],
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>
                    Commit
                  </div>
                  <div style={{ fontSize: tokens.typography.fontSize.xs.size, color: tokens.colors.neutral[900], fontFamily: tokens.typography.fontFamily.mono }}>
                    {finding.commitHash}
                  </div>
                </div>
              </div>

              {/* File Path - Full Width */}
              <div style={{ 
                padding: tokens.spacing[8], 
                backgroundColor: tokens.colors.neutral[900], 
                borderRadius: tokens.borderRadius.sm,
                marginBottom: tokens.spacing[10],
              }}>
                <div style={{ 
                  fontSize: '9px', 
                  fontWeight: tokens.typography.fontWeight.bold, 
                  color: tokens.colors.neutral[400], 
                  marginBottom: tokens.spacing[2],
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  File Location
                </div>
                <div style={{ fontSize: tokens.typography.fontSize.xs.size, color: tokens.colors.neutral[50], fontFamily: tokens.typography.fontFamily.mono, wordBreak: 'break-all' }}>
                  {finding.filePath}:<span style={{ color: tokens.colors.warning[500], fontWeight: tokens.typography.fontWeight.bold }}>{finding.lineNumber}</span>
                </div>
              </div>

              {/* Links and Timestamps - 2 Column */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: tokens.spacing[10] }}>
                {finding.commitUrl && (
                  <div>
                    <div style={{ 
                      fontSize: '10px', 
                      fontWeight: tokens.typography.fontWeight.bold, 
                      color: tokens.colors.neutral[500], 
                      marginBottom: tokens.spacing[2],
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}>
                      GitHub
                    </div>
                    <a href={finding.commitUrl} target="_blank" rel="noopener noreferrer" style={{ color: tokens.colors.primary[600], fontSize: tokens.typography.fontSize.xs.size, textDecoration: 'none', fontWeight: tokens.typography.fontWeight.medium }}>
                      View Commit →
                    </a>
                  </div>
                )}

                {finding.prUrl && (
                  <div>
                    <div style={{ 
                      fontSize: '10px', 
                      fontWeight: tokens.typography.fontWeight.bold, 
                      color: tokens.colors.neutral[500], 
                      marginBottom: tokens.spacing[2],
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}>
                      Pull Request
                    </div>
                    <a href={finding.prUrl} target="_blank" rel="noopener noreferrer" style={{ color: tokens.colors.primary[600], fontSize: tokens.typography.fontSize.xs.size, textDecoration: 'none', fontWeight: tokens.typography.fontWeight.medium }}>
                      View PR →
                    </a>
                  </div>
                )}

                <div>
                  <div style={{ 
                    fontSize: '10px', 
                    fontWeight: tokens.typography.fontWeight.bold, 
                    color: tokens.colors.neutral[500], 
                    marginBottom: tokens.spacing[2],
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>
                    Detected
                  </div>
                  <div style={{ fontSize: tokens.typography.fontSize.sm.size, color: tokens.colors.neutral[600] }}>
                    {formatDate(finding.detectedAt)}
                  </div>
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: tokens.typography.fontSize.xs.size, 
                    fontWeight: tokens.typography.fontWeight.semibold, 
                    color: tokens.colors.neutral[600], 
                    marginBottom: tokens.spacing[4],
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>
                    Last Updated
                  </label>
                  <div style={{ fontSize: tokens.typography.fontSize.sm.size, color: tokens.colors.neutral[600] }}>
                    {formatDate(finding.lastUpdated)}
                  </div>
                </div>

                {finding.assignee && (
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontSize: tokens.typography.fontSize.xs.size, 
                      fontWeight: tokens.typography.fontWeight.semibold, 
                      color: tokens.colors.neutral[600], 
                      marginBottom: tokens.spacing[4],
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}>
                      Assignee
                    </label>
                    <div style={{ fontSize: tokens.typography.fontSize.sm.size, color: tokens.colors.neutral[900] }}>
                      {finding.assignee}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'remediation' && remediation && (
            <div className="card" style={{ padding: tokens.spacing[24], backgroundColor: tokens.colors.neutral[50], borderRadius: tokens.borderRadius.lg, border: `1px solid ${tokens.colors.neutral[200]}` }}>
              <h3 style={{ fontSize: tokens.typography.fontSize.lg.size, fontWeight: tokens.typography.fontWeight.semibold, marginBottom: tokens.spacing[8] }}>
                {remediation.title}
              </h3>
              <p style={{ color: tokens.colors.neutral[600], marginBottom: tokens.spacing[20], lineHeight: 1.6 }}>
                {remediation.description}
              </p>

              <h4 style={{ fontSize: tokens.typography.fontSize.base.size, fontWeight: tokens.typography.fontWeight.semibold, marginBottom: tokens.spacing[12] }}>
                Remediation Steps
              </h4>
              <ol style={{ paddingLeft: tokens.spacing[20], marginBottom: tokens.spacing[20] }}>
                {remediation.steps.map((step, index) => (
                  <li key={index} style={{ color: tokens.colors.neutral[700], marginBottom: tokens.spacing[8], lineHeight: 1.6 }}>
                    {step}
                  </li>
                ))}
              </ol>

              <h4 style={{ fontSize: tokens.typography.fontSize.base.size, fontWeight: tokens.typography.fontWeight.semibold, marginBottom: tokens.spacing[12] }}>
                Additional Resources
              </h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {remediation.resources.map((resource, index) => (
                  <li key={index} style={{ marginBottom: tokens.spacing[8] }}>
                    <a href={resource.url} target="_blank" rel="noopener noreferrer" style={{ color: tokens.colors.primary[600], textDecoration: 'none' }}>
                      {resource.title} →
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="card" style={{ padding: tokens.spacing[24], backgroundColor: tokens.colors.neutral[50], borderRadius: tokens.borderRadius.lg, border: `1px solid ${tokens.colors.neutral[200]}` }}>
              <h3 style={{ fontSize: tokens.typography.fontSize.lg.size, fontWeight: tokens.typography.fontWeight.semibold, marginBottom: tokens.spacing[16] }}>
                Comments & Activity
              </h3>

              {/* Comments List */}
              <div style={{ marginBottom: tokens.spacing[24] }}>
                {comments.map((comment) => (
                  <div key={comment.id} style={{ display: 'flex', gap: tokens.spacing[12], marginBottom: tokens.spacing[16] }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: tokens.borderRadius.full,
                      backgroundColor: tokens.colors.primary[100],
                      color: tokens.colors.primary[700],
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: tokens.typography.fontWeight.semibold,
                      fontSize: tokens.typography.fontSize.sm.size,
                      flexShrink: 0,
                    }}>
                      {comment.avatar}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: tokens.spacing[4] }}>
                        <span style={{ fontWeight: tokens.typography.fontWeight.semibold, fontSize: tokens.typography.fontSize.sm.size }}>
                          {comment.author}
                        </span>
                        <span style={{ fontSize: tokens.typography.fontSize.xs.size, color: tokens.colors.neutral[500] }}>
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <div style={{ color: tokens.colors.neutral[700], fontSize: tokens.typography.fontSize.sm.size, lineHeight: 1.6 }}>
                        {comment.content}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Comment */}
              <div>
                <label style={{ display: 'block', fontSize: tokens.typography.fontSize.sm.size, fontWeight: tokens.typography.fontWeight.medium, marginBottom: tokens.spacing[8] }}>
                  Add a comment
                </label>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share updates, ask questions, or provide context..."
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: tokens.spacing[12],
                    border: `1px solid ${tokens.colors.neutral[300]}`,
                    borderRadius: tokens.borderRadius.md,
                    fontSize: tokens.typography.fontSize.sm.size,
                    fontFamily: tokens.typography.fontFamily.sans,
                    marginBottom: tokens.spacing[12],
                  }}
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  style={{
                    padding: `${tokens.spacing[10]} ${tokens.spacing[20]}`,
                    backgroundColor: newComment.trim() ? tokens.colors.primary[600] : tokens.colors.neutral[300],
                    color: tokens.colors.neutral[50],
                    border: 'none',
                    borderRadius: tokens.borderRadius.md,
                    cursor: newComment.trim() ? 'pointer' : 'not-allowed',
                    fontWeight: tokens.typography.fontWeight.medium,
                    fontSize: tokens.typography.fontSize.sm.size,
                  }}
                >
                  Add Comment
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Ultra Compact */}
        <div>
          {/* Related Findings */}
          {relatedFindings.length > 0 && (
            <div className="card" style={{ 
              padding: tokens.spacing[10], 
              backgroundColor: tokens.colors.neutral[50], 
              borderRadius: tokens.borderRadius.sm, 
              border: `1px solid ${tokens.colors.neutral[200]}`, 
              marginBottom: tokens.spacing[10],
            }}>
              <h3 style={{ 
                fontSize: '11px', 
                fontWeight: tokens.typography.fontWeight.bold, 
                marginBottom: tokens.spacing[8],
                color: tokens.colors.neutral[600],
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Related ({relatedFindings.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[6] }}>
                {relatedFindings.map((relatedFinding) => (
                  <Link
                    key={relatedFinding.id}
                    to={`/findings/${relatedFinding.id}`}
                    style={{
                      padding: tokens.spacing[8],
                      backgroundColor: tokens.colors.neutral[100],
                      borderRadius: tokens.borderRadius.sm,
                      textDecoration: 'none',
                      display: 'block',
                      transition: `background-color ${tokens.transitions.duration[200]}`,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = tokens.colors.neutral[200]; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = tokens.colors.neutral[100]; }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: tokens.typography.fontWeight.semibold, color: tokens.colors.neutral[900], marginBottom: tokens.spacing[2], lineHeight: '1.3' }}>
                      {relatedFinding.secretType}
                    </div>
                    <div style={{ fontSize: '10px', color: tokens.colors.neutral[600], marginBottom: tokens.spacing[2] }}>
                      {relatedFinding.repository}
                    </div>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: `${tokens.spacing[2]} ${tokens.spacing[8]}`,
                        backgroundColor: getSeverityColor(relatedFinding.severity),
                        color: tokens.colors.neutral[50],
                        borderRadius: tokens.borderRadius.full,
                        fontSize: tokens.typography.fontSize.xs.size,
                        fontWeight: tokens.typography.fontWeight.medium,
                        textTransform: 'uppercase',
                      }}
                    >
                      {relatedFinding.severity}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions - Ultra Compact */}
          <div className="card" style={{ 
            padding: tokens.spacing[10], 
            backgroundColor: tokens.colors.neutral[50], 
            borderRadius: tokens.borderRadius.sm, 
            border: `1px solid ${tokens.colors.neutral[200]}`,
          }}>
            <h3 style={{ 
              fontSize: '11px', 
              fontWeight: tokens.typography.fontWeight.bold, 
              marginBottom: tokens.spacing[8],
              color: tokens.colors.neutral[600],
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Actions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[4] }}>
              <button
                style={{
                  padding: tokens.spacing[6],
                  backgroundColor: tokens.colors.neutral[100],
                  border: `1px solid ${tokens.colors.neutral[300]}`,
                  borderRadius: tokens.borderRadius.sm,
                  cursor: 'pointer',
                  fontSize: '11px',
                  textAlign: 'left',
                  color: tokens.colors.neutral[700],
                  fontWeight: tokens.typography.fontWeight.medium,
                }}
              >
                Copy ID
              </button>
              <button
                style={{
                  padding: tokens.spacing[6],
                  backgroundColor: tokens.colors.neutral[100],
                  border: `1px solid ${tokens.colors.neutral[300]}`,
                  borderRadius: tokens.borderRadius.sm,
                  cursor: 'pointer',
                  fontSize: '11px',
                  textAlign: 'left',
                  color: tokens.colors.neutral[700],
                  fontWeight: tokens.typography.fontWeight.medium,
                }}
              >
                Share
              </button>
              <button
                style={{
                  padding: tokens.spacing[6],
                  backgroundColor: tokens.colors.neutral[100],
                  border: `1px solid ${tokens.colors.neutral[300]}`,
                  borderRadius: tokens.borderRadius.sm,
                  cursor: 'pointer',
                  fontSize: '11px',
                  textAlign: 'left',
                  color: tokens.colors.neutral[700],
                  fontWeight: tokens.typography.fontWeight.medium,
                }}
              >
                Export
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindingDetailPage;
