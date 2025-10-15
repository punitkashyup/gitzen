import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  labels?: string[];
  priority?: 'low' | 'medium' | 'high' | 'critical';
  sprint?: string;
  team?: string;
}

interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  avatar?: string;
  reactions?: {
    thumbsUp: number;
    checkmark: number;
    cross: number;
    question: number;
  };
}

interface ActivityLog {
  id: string;
  type: 'detected' | 'assigned' | 'pr_opened' | 'status_changed' | 'commented';
  description: string;
  author?: string;
  timestamp: string;
  icon: string;
}

interface RemediationGuide {
  title: string;
  description: string;
  steps: string[];
  resources: { title: string; url: string }[];
  suggestedFix?: string;
  aiSuggestion?: string;
  remediationStatus?: 'pending' | 'in-progress' | 'verified';
}

// Mock data for demonstration
const mockFindings: Finding[] = [
  {
    id: '1',
    repository: 'frontend-app',
    secretType: 'AWS Access Key',
    filePath: 'src/config/aws.ts',
    lineNumber: 23,
    description: 'AWS access key detected in configuration file. This key provides full access to AWS services and should be rotated immediately.',
    severity: 'critical',
    status: 'open',
    detectedAt: '2025-10-14T10:30:00Z',
    lastUpdated: '2025-10-14T10:30:00Z',
    assignee: 'john.doe',
    branch: 'main',
    commitHash: 'a3f2b9d',
    commitUrl: 'https://github.com/org/frontend-app/commit/a3f2b9d',
    prUrl: 'https://github.com/org/frontend-app/pull/123',
    labels: ['Security', 'AWS', 'Critical', 'Config'],
    priority: 'critical',
    sprint: 'Sprint 24',
    team: 'Security Team',
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
    labels: ['Security', 'API'],
    priority: 'high',
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
    labels: ['Security', 'Database'],
    priority: 'critical',
  },
];

const mockComments: Comment[] = [
  {
    id: '1',
    author: 'John Doe',
    content: 'This appears to be a test key, but we should still remove it from the codebase. @jane.smith can you help with the rotation?',
    createdAt: '2025-10-14T11:00:00Z',
    avatar: 'JD',
    reactions: { thumbsUp: 3, checkmark: 1, cross: 0, question: 0 },
  },
  {
    id: '2',
    author: 'Jane Smith',
    content: 'I\'ve created a ticket to rotate this key and remove it from the repository history. Working on PR #45 now.',
    createdAt: '2025-10-14T12:30:00Z',
    avatar: 'JS',
    reactions: { thumbsUp: 2, checkmark: 2, cross: 0, question: 0 },
  },
  {
    id: '3',
    author: 'Security Bot',
    content: 'Automated scan detected this secret. Priority: Critical. Immediate action required.',
    createdAt: '2025-10-14T10:31:00Z',
    avatar: 'SB',
    reactions: { thumbsUp: 0, checkmark: 0, cross: 0, question: 1 },
  },
];

const mockActivityLog: ActivityLog[] = [
  {
    id: '1',
    type: 'detected',
    description: 'AWS key detected by scanner',
    timestamp: '2025-10-14T10:30:00Z',
    icon: '🔍',
  },
  {
    id: '2',
    type: 'assigned',
    description: 'Assigned to John Doe',
    author: 'System',
    timestamp: '2025-10-14T10:32:00Z',
    icon: '👤',
  },
  {
    id: '3',
    type: 'commented',
    description: 'John Doe added a comment',
    author: 'John Doe',
    timestamp: '2025-10-14T11:00:00Z',
    icon: '💬',
  },
  {
    id: '4',
    type: 'pr_opened',
    description: 'PR #45 opened by @alice',
    author: 'Alice Johnson',
    timestamp: '2025-10-14T12:15:00Z',
    icon: '🔀',
  },
  {
    id: '5',
    type: 'commented',
    description: 'Jane Smith added a comment',
    author: 'Jane Smith',
    timestamp: '2025-10-14T12:30:00Z',
    icon: '💬',
  },
];

const remediationGuides: Record<string, RemediationGuide> = {
  'AWS Access Key': {
    title: 'AWS Access Key Remediation',
    description: 'AWS access keys provide programmatic access to AWS services. If exposed, they can be used to access your AWS resources.',
    suggestedFix: `// Use AWS Secrets Manager or environment variables
const AWS = require('aws-sdk');

// Instead of hardcoding keys:
// const credentials = { accessKeyId: 'AKIAIOSFODNN7EXAMPLE', secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY' };

// Use environment variables or AWS SDK's default credential provider chain
const credentials = new AWS.EC2MetadataCredentials();
AWS.config.credentials = credentials;`,
    steps: [
      'Immediately rotate the exposed AWS access key in the AWS IAM Console',
      'Remove the key from your codebase and git history using git filter-branch or BFG Repo-Cleaner',
      'Use AWS Secrets Manager or environment variables for key storage',
      'Review CloudTrail logs for any unauthorized access',
      'Implement AWS IAM roles for applications running on AWS infrastructure',
      'Enable MFA for IAM users with console access',
    ],
    resources: [
      { title: 'AWS Security Best Practices', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html' },
      { title: 'Rotating AWS Access Keys', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html#Using_RotateAccessKey' },
      { title: 'AWS Secrets Manager', url: 'https://aws.amazon.com/secrets-manager/' },
    ],
    aiSuggestion: '🤖 AI Analysis: This appears to be a production AWS key with admin privileges. High risk of account compromise. Recommend immediate rotation and implementation of temporary credentials using AWS STS.',
    remediationStatus: 'in-progress',
  },
  'API Key': {
    title: 'API Key Remediation',
    description: 'API keys provide access to external services. Exposed keys can lead to unauthorized usage and potential data breaches.',
    suggestedFix: `// Store API keys in environment variables
// .env file:
// API_KEY=your_secure_api_key_here

// In your code:
const apiKey = process.env.API_KEY;

// Or use a secure vault service like HashiCorp Vault
const vault = require('node-vault')();
const apiKey = await vault.read('secret/data/api-key');`,
    steps: [
      'Revoke the exposed API key immediately',
      'Generate a new API key from the service provider',
      'Remove the key from your codebase and git history',
      'Store API keys in environment variables or secure vaults',
      'Implement key rotation policies',
      'Set up API key usage monitoring and alerts',
    ],
    resources: [
      { title: 'API Key Best Practices', url: 'https://cloud.google.com/docs/authentication/api-keys' },
      { title: 'Environment Variables Guide', url: 'https://12factor.net/config' },
    ],
    aiSuggestion: '🤖 AI Analysis: This API key has been committed 3 times. Consider implementing pre-commit hooks to prevent future leaks.',
    remediationStatus: 'pending',
  },
  'Database Password': {
    title: 'Database Password Remediation',
    description: 'Database passwords provide access to your database. Exposure can lead to data breaches and unauthorized access.',
    suggestedFix: `// Use connection string from environment variables
// Instead of:
// const connection = mysql.createConnection({
//   host: 'localhost',
//   user: 'root',
//   password: 'hardcoded_password'
// });

// Use:
const connection = mysql.createConnection(process.env.DATABASE_URL);

// Or use AWS RDS IAM authentication:
const token = await rds.signer.getAuthToken({
  hostname: process.env.DB_HOST,
  port: 3306,
  username: process.env.DB_USER
});`,
    steps: [
      'Change the database password immediately',
      'Remove the password from your codebase and git history',
      'Use environment variables or secret management tools',
      'Review database access logs for suspicious activity',
      'Implement connection string encryption',
      'Consider using managed database services with IAM authentication',
      'Enable database audit logging',
    ],
    resources: [
      { title: 'Database Security Best Practices', url: 'https://www.postgresql.org/docs/current/auth-password.html' },
      { title: 'AWS RDS Security', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.html' },
    ],
    aiSuggestion: '🤖 AI Analysis: Database password exposed for 72 hours. High risk. Recommend immediate password change and full security audit.',
    remediationStatus: 'pending',
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
  const [activityLog, setActivityLog] = useState<ActivityLog[]>(mockActivityLog);
  const [newComment, setNewComment] = useState('');
  const [relatedFindings, setRelatedFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'remediation' | 'activity'>('details');
  const [showConfirmation, setShowConfirmation] = useState<'false-positive' | 'resolved' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [selectedPriority, setSelectedPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const foundFinding = mockFindings.find((f) => f.id === id);
      if (foundFinding) {
        setFinding(foundFinding);
        setSelectedLabels(foundFinding.labels || []);
        setSelectedPriority(foundFinding.priority || 'medium');
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
    const newCommentObj: Comment = {
      id: String(comments.length + 1),
      author: 'Current User',
      content: `Changed status to ${newStatus}${actionReason ? `: ${actionReason}` : ''}`,
      createdAt: new Date().toISOString(),
      avatar: 'CU',
      reactions: { thumbsUp: 0, checkmark: 0, cross: 0, question: 0 },
    };
    setComments([...comments, newCommentObj]);

    // Add activity log entry
    const newActivity: ActivityLog = {
      id: String(activityLog.length + 1),
      type: 'status_changed',
      description: `Finding marked as ${newStatus}`,
      author: 'Current User',
      timestamp: new Date().toISOString(),
      icon: newStatus === 'resolved' ? '✅' : '❌',
    };
    setActivityLog([...activityLog, newActivity]);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const comment: Comment = {
      id: String(comments.length + 1),
      author: 'Current User',
      content: newComment,
      createdAt: new Date().toISOString(),
      avatar: 'CU',
      reactions: { thumbsUp: 0, checkmark: 0, cross: 0, question: 0 },
    };
    setComments([...comments, comment]);
    setNewComment('');

    // Add activity log entry
    const newActivity: ActivityLog = {
      id: String(activityLog.length + 1),
      type: 'commented',
      description: 'Current User added a comment',
      author: 'Current User',
      timestamp: new Date().toISOString(),
      icon: '💬',
    };
    setActivityLog([...activityLog, newActivity]);
  };

  const handleReaction = (commentId: string, reaction: 'thumbsUp' | 'checkmark' | 'cross' | 'question') => {
    setComments(comments.map(c => {
      if (c.id === commentId && c.reactions) {
        return {
          ...c,
          reactions: {
            ...c.reactions,
            [reaction]: c.reactions[reaction] + 1,
          },
        };
      }
      return c;
    }));
  };

  const handleEditComment = (commentId: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
      setEditingCommentId(commentId);
      setEditingContent(comment.content);
    }
  };

  const handleSaveEdit = (commentId: string) => {
    setComments(comments.map(c => {
      if (c.id === commentId) {
        return { ...c, content: editingContent };
      }
      return c;
    }));
    setEditingCommentId(null);
    setEditingContent('');
  };

  const handleDeleteComment = (commentId: string) => {
    if (confirm('Are you sure you want to delete this comment?')) {
      setComments(comments.filter(c => c.id !== commentId));
    }
  };

  const handleCopyId = () => {
    if (finding) {
      navigator.clipboard.writeText(finding.id);
      alert('Finding ID copied to clipboard!');
    }
  };

  const handleExport = () => {
    if (finding) {
      const data = JSON.stringify(finding, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finding-${finding.id}.json`;
      a.click();
    }
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

  const getRemediationStatusColor = (status?: string) => {
    switch (status) {
      case 'verified': return tokens.colors.success[600];
      case 'in-progress': return tokens.colors.warning[600];
      case 'pending': return tokens.colors.neutral[500];
      default: return tokens.colors.neutral[500];
    }
  };

  return (
    <div style={{ 
      padding: tokens.spacing[24],
      maxWidth: '1400px', 
      margin: '0 auto',
      minHeight: '100vh',
      backgroundColor: tokens.colors.neutral[50],
    }}>
      {/* Clean Header - Jira Style */}
      <div style={{ 
        marginBottom: tokens.spacing[24],
      }}>
        {/* Breadcrumbs */}
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: tokens.spacing[8],
          marginBottom: tokens.spacing[16],
          fontSize: tokens.typography.fontSize.sm.size,
          color: tokens.colors.neutral[500],
        }}>
          <Link to="/findings" style={{ color: tokens.colors.neutral[700], textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.color = tokens.colors.primary[600]}
            onMouseLeave={(e) => e.currentTarget.style.color = tokens.colors.neutral[700]}
          >
            Findings
          </Link>
          <span>/</span>
          <span style={{ color: tokens.colors.neutral[900] }}>
            {finding.id}
          </span>
        </div>

        {/* Title and Action Buttons Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: tokens.spacing[24] }}>
          <h1 style={{ 
            fontSize: tokens.typography.fontSize['3xl'].size, 
            fontWeight: tokens.typography.fontWeight.semibold, 
            color: tokens.colors.neutral[900], 
            margin: 0,
            lineHeight: 1.2,
          }}>
            {finding.secretType} Detected
          </h1>

          {/* Action Buttons */}
          {finding.status === 'open' && (
            <div style={{ display: 'flex', gap: tokens.spacing[8], flexShrink: 0 }}>
              <button
                onClick={() => setShowConfirmation('false-positive')}
                style={{
                  padding: `${tokens.spacing[8]} ${tokens.spacing[16]}`,
                  backgroundColor: tokens.colors.neutral[100],
                  color: tokens.colors.neutral[700],
                  border: `1px solid ${tokens.colors.neutral[300]}`,
                  borderRadius: tokens.borderRadius.md,
                  cursor: 'pointer',
                  fontWeight: tokens.typography.fontWeight.medium,
                  fontSize: tokens.typography.fontSize.sm.size,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = tokens.colors.neutral[200];
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = tokens.colors.neutral[100];
                }}
              >
                False Positive
              </button>
              <button
                onClick={() => {
                  if (confirm('Mark this finding as In Progress?')) {
                    setFinding({ ...finding, status: 'in-progress', lastUpdated: new Date().toISOString() });
                    const newComment: Comment = {
                      id: String(comments.length + 1),
                      author: 'Current User',
                      content: 'Started working on this finding',
                      createdAt: new Date().toISOString(),
                      avatar: 'CU',
                      reactions: { thumbsUp: 0, checkmark: 0, cross: 0, question: 0 },
                    };
                    setComments([...comments, newComment]);
                    const newActivity: ActivityLog = {
                      id: String(activityLog.length + 1),
                      type: 'status_changed',
                      description: 'Finding marked as in progress',
                      author: 'Current User',
                      timestamp: new Date().toISOString(),
                      icon: '🔧',
                    };
                    setActivityLog([...activityLog, newActivity]);
                  }
                }}
                style={{
                  padding: `${tokens.spacing[8]} ${tokens.spacing[16]}`,
                  backgroundColor: tokens.colors.primary[600],
                  color: tokens.colors.neutral[50],
                  border: 'none',
                  borderRadius: tokens.borderRadius.md,
                  cursor: 'pointer',
                  fontWeight: tokens.typography.fontWeight.medium,
                  fontSize: tokens.typography.fontSize.sm.size,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = tokens.colors.primary[700];
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = tokens.colors.primary[600];
                }}
              >
                In Progress
              </button>
              <button
                onClick={() => setShowConfirmation('resolved')}
                style={{
                  padding: `${tokens.spacing[8]} ${tokens.spacing[16]}`,
                  backgroundColor: tokens.colors.success[600],
                  color: tokens.colors.neutral[50],
                  border: 'none',
                  borderRadius: tokens.borderRadius.md,
                  cursor: 'pointer',
                  fontWeight: tokens.typography.fontWeight.medium,
                  fontSize: tokens.typography.fontSize.sm.size,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = tokens.colors.success[700];
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = tokens.colors.success[600];
                }}
              >
                Resolve
              </button>
            </div>
          )}

          {/* Actions for In Progress findings */}
          {finding.status === 'in-progress' && (
            <div style={{ display: 'flex', gap: tokens.spacing[8], flexShrink: 0 }}>
              <button
                onClick={() => {
                  if (confirm('Revert this finding back to Open status?')) {
                    setFinding({ ...finding, status: 'open', lastUpdated: new Date().toISOString() });
                    const newComment: Comment = {
                      id: String(comments.length + 1),
                      author: 'Current User',
                      content: 'Reverted finding back to Open status',
                      createdAt: new Date().toISOString(),
                      avatar: 'CU',
                      reactions: { thumbsUp: 0, checkmark: 0, cross: 0, question: 0 },
                    };
                    setComments([...comments, newComment]);
                    const newActivity: ActivityLog = {
                      id: String(activityLog.length + 1),
                      type: 'status_changed',
                      description: 'Finding reverted from in progress to open',
                      author: 'Current User',
                      timestamp: new Date().toISOString(),
                      icon: '↩️',
                    };
                    setActivityLog([...activityLog, newActivity]);
                  }
                }}
                style={{
                  padding: `${tokens.spacing[8]} ${tokens.spacing[16]}`,
                  backgroundColor: tokens.colors.neutral[100],
                  color: tokens.colors.neutral[700],
                  border: `1px solid ${tokens.colors.neutral[300]}`,
                  borderRadius: tokens.borderRadius.md,
                  cursor: 'pointer',
                  fontWeight: tokens.typography.fontWeight.medium,
                  fontSize: tokens.typography.fontSize.sm.size,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = tokens.colors.neutral[200];
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = tokens.colors.neutral[100];
                }}
              >
                Revert to Open
              </button>
              <button
                onClick={() => setShowConfirmation('resolved')}
                style={{
                  padding: `${tokens.spacing[8]} ${tokens.spacing[16]}`,
                  backgroundColor: tokens.colors.success[600],
                  color: tokens.colors.neutral[50],
                  border: 'none',
                  borderRadius: tokens.borderRadius.md,
                  cursor: 'pointer',
                  fontWeight: tokens.typography.fontWeight.medium,
                  fontSize: tokens.typography.fontSize.sm.size,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = tokens.colors.success[700];
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = tokens.colors.success[600];
                }}
              >
                Resolve
              </button>
            </div>
          )}

          {/* Revert to Open button for false positives */}
          {finding.status === 'false-positive' && (
            <div style={{ display: 'flex', gap: tokens.spacing[8], flexShrink: 0 }}>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to revert this false positive back to Open status?')) {
                    setFinding({ ...finding, status: 'open', lastUpdated: new Date().toISOString() });
                    const newComment: Comment = {
                      id: String(comments.length + 1),
                      author: 'Current User',
                      content: 'Reverted false positive back to Open status',
                      createdAt: new Date().toISOString(),
                      avatar: 'CU',
                      reactions: { thumbsUp: 0, checkmark: 0, cross: 0, question: 0 },
                    };
                    setComments([...comments, newComment]);
                    const newActivity: ActivityLog = {
                      id: String(activityLog.length + 1),
                      type: 'status_changed',
                      description: 'Finding reverted from false positive to open',
                      author: 'Current User',
                      timestamp: new Date().toISOString(),
                      icon: '↩️',
                    };
                    setActivityLog([...activityLog, newActivity]);
                  }
                }}
                style={{
                  padding: `${tokens.spacing[8]} ${tokens.spacing[16]}`,
                  backgroundColor: tokens.colors.warning[600],
                  color: tokens.colors.neutral[50],
                  border: 'none',
                  borderRadius: tokens.borderRadius.md,
                  cursor: 'pointer',
                  fontWeight: tokens.typography.fontWeight.medium,
                  fontSize: tokens.typography.fontSize.sm.size,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = tokens.colors.warning[700];
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = tokens.colors.warning[600];
                }}
              >
                Revert to Open
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: tokens.zIndex.modal + 10,
            }}
            onClick={() => { setShowConfirmation(null); setActionReason(''); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                backgroundColor: tokens.colors.neutral[50],
                borderRadius: tokens.borderRadius['2xl'],
                padding: tokens.spacing[32],
                maxWidth: '500px',
                width: '90%',
                boxShadow: tokens.shadows['2xl'],
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ fontSize: tokens.typography.fontSize['2xl'].size, fontWeight: tokens.typography.fontWeight.bold, marginBottom: tokens.spacing[16], color: tokens.colors.neutral[900] }}>
                Confirm {showConfirmation === 'false-positive' ? 'False Positive' : 'Resolution'}
              </h3>
              <p style={{ color: tokens.colors.neutral[600], marginBottom: tokens.spacing[20], lineHeight: 1.6, fontSize: tokens.typography.fontSize.base.size }}>
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
                  minHeight: '100px',
                  padding: tokens.spacing[16],
                  border: `2px solid ${tokens.colors.neutral[300]}`,
                  borderRadius: tokens.borderRadius.lg,
                  fontSize: tokens.typography.fontSize.base.size,
                  marginBottom: tokens.spacing[20],
                  fontFamily: tokens.typography.fontFamily.sans,
                  resize: 'vertical',
                }}
              />
              <div style={{ display: 'flex', gap: tokens.spacing[12], justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setShowConfirmation(null); setActionReason(''); }}
                  style={{
                    padding: `${tokens.spacing[12]} ${tokens.spacing[24]}`,
                    backgroundColor: tokens.colors.neutral[100],
                    color: tokens.colors.neutral[700],
                    border: `2px solid ${tokens.colors.neutral[300]}`,
                    borderRadius: tokens.borderRadius.lg,
                    cursor: 'pointer',
                    fontWeight: tokens.typography.fontWeight.semibold,
                    fontSize: tokens.typography.fontSize.base.size,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleStatusChange(showConfirmation)}
                  style={{
                    padding: `${tokens.spacing[12]} ${tokens.spacing[24]}`,
                    backgroundColor: tokens.colors.primary[600],
                    color: tokens.colors.neutral[50],
                    border: 'none',
                    borderRadius: tokens.borderRadius.lg,
                    cursor: 'pointer',
                    fontWeight: tokens.typography.fontWeight.semibold,
                    fontSize: tokens.typography.fontSize.base.size,
                    boxShadow: tokens.shadows.md,
                  }}
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: tokens.zIndex.modal + 10,
            }}
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                backgroundColor: tokens.colors.neutral[50],
                borderRadius: tokens.borderRadius['2xl'],
                padding: tokens.spacing[32],
                maxWidth: '500px',
                width: '90%',
                boxShadow: tokens.shadows['2xl'],
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ fontSize: tokens.typography.fontSize['2xl'].size, fontWeight: tokens.typography.fontWeight.bold, marginBottom: tokens.spacing[16] }}>
                Share Finding
              </h3>
              <p style={{ color: tokens.colors.neutral[600], marginBottom: tokens.spacing[16], fontSize: tokens.typography.fontSize.sm.size }}>
                Share this link with your team:
              </p>
              <div style={{
                padding: tokens.spacing[12],
                backgroundColor: tokens.colors.neutral[100],
                borderRadius: tokens.borderRadius.md,
                fontFamily: tokens.typography.fontFamily.mono,
                fontSize: tokens.typography.fontSize.sm.size,
                wordBreak: 'break-all',
                marginBottom: tokens.spacing[20],
              }}>
                {window.location.href}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link copied to clipboard!');
                  setShowShareModal(false);
                }}
                style={{
                  width: '100%',
                  padding: `${tokens.spacing[12]} ${tokens.spacing[24]}`,
                  backgroundColor: tokens.colors.primary[600],
                  color: tokens.colors.neutral[50],
                  border: 'none',
                  borderRadius: tokens.borderRadius.lg,
                  cursor: 'pointer',
                  fontWeight: tokens.typography.fontWeight.semibold,
                  fontSize: tokens.typography.fontSize.base.size,
                  boxShadow: tokens.shadows.md,
                }}
              >
                Copy Link
              </button>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Main Content Grid: Content (wider) + Sidebar (narrower) */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: tokens.spacing[24], alignItems: 'start' }}>
        {/* Main Content Area */}
        <div>
          {/* Simple Tabs */}
          <div style={{ 
            borderBottom: `2px solid ${tokens.colors.neutral[200]}`, 
            marginBottom: tokens.spacing[24],
          }}>
            <div style={{ display: 'flex', gap: tokens.spacing[0] }}>
              {(['details', 'remediation', 'activity'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: `${tokens.spacing[12]} ${tokens.spacing[16]}`,
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: `2px solid ${activeTab === tab ? tokens.colors.primary[600] : 'transparent'}`,
                    color: activeTab === tab ? tokens.colors.primary[600] : tokens.colors.neutral[600],
                    cursor: 'pointer',
                    fontWeight: activeTab === tab ? tokens.typography.fontWeight.semibold : tokens.typography.fontWeight.medium,
                    fontSize: tokens.typography.fontSize.sm.size,
                    textTransform: 'capitalize',
                    marginBottom: '-2px',
                    transition: 'color 0.2s',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'details' && (
            <div style={{ backgroundColor: tokens.colors.neutral[50], borderRadius: tokens.borderRadius.lg, border: `1px solid ${tokens.colors.neutral[200]}`, padding: tokens.spacing[24] }}>
              <h3 style={{ fontSize: tokens.typography.fontSize.base.size, fontWeight: tokens.typography.fontWeight.semibold, marginBottom: tokens.spacing[16], color: tokens.colors.neutral[900] }}>
                Description
              </h3>
              <p style={{ fontSize: tokens.typography.fontSize.sm.size, color: tokens.colors.neutral[700], lineHeight: 1.6, marginBottom: tokens.spacing[24] }}>
                {finding.description}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: tokens.spacing[20], marginBottom: tokens.spacing[24] }}>
                <div>
                  <div style={{ fontSize: tokens.typography.fontSize.xs.size, fontWeight: tokens.typography.fontWeight.semibold, color: tokens.colors.neutral[500], marginBottom: tokens.spacing[6], textTransform: 'uppercase' }}>
                    Repository
                  </div>
                  <div style={{ fontSize: tokens.typography.fontSize.sm.size, color: tokens.colors.neutral[900], fontFamily: tokens.typography.fontFamily.mono }}>
                    {finding.repository}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: tokens.typography.fontSize.xs.size, fontWeight: tokens.typography.fontWeight.semibold, color: tokens.colors.neutral[500], marginBottom: tokens.spacing[6], textTransform: 'uppercase' }}>
                    Branch
                  </div>
                  <div style={{ fontSize: tokens.typography.fontSize.sm.size, color: tokens.colors.neutral[900], fontFamily: tokens.typography.fontFamily.mono }}>
                    {finding.branch}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: tokens.typography.fontSize.xs.size, fontWeight: tokens.typography.fontWeight.semibold, color: tokens.colors.neutral[500], marginBottom: tokens.spacing[6], textTransform: 'uppercase' }}>
                    Commit Hash
                  </div>
                  <div style={{ fontSize: tokens.typography.fontSize.sm.size, color: tokens.colors.neutral[900], fontFamily: tokens.typography.fontFamily.mono }}>
                    {finding.commitHash}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: tokens.typography.fontSize.xs.size, fontWeight: tokens.typography.fontWeight.semibold, color: tokens.colors.neutral[500], marginBottom: tokens.spacing[6], textTransform: 'uppercase' }}>
                    Line Number
                  </div>
                  <div style={{ fontSize: tokens.typography.fontSize.sm.size, color: tokens.colors.neutral[900] }}>
                    {finding.lineNumber}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: tokens.spacing[20] }}>
                <div style={{ fontSize: tokens.typography.fontSize.xs.size, fontWeight: tokens.typography.fontWeight.semibold, color: tokens.colors.neutral[500], marginBottom: tokens.spacing[6], textTransform: 'uppercase' }}>
                  File Path
                </div>
                <div style={{ 
                  padding: tokens.spacing[12], 
                  backgroundColor: tokens.colors.neutral[900], 
                  borderRadius: tokens.borderRadius.md,
                  fontSize: tokens.typography.fontSize.sm.size, 
                  color: tokens.colors.neutral[50], 
                  fontFamily: tokens.typography.fontFamily.mono, 
                  wordBreak: 'break-all' 
                }}>
                  {finding.filePath}
                </div>
              </div>

              {(finding.commitUrl || finding.prUrl) && (
                <div style={{ display: 'flex', gap: tokens.spacing[16] }}>
                  {finding.commitUrl && (
                    <a href={finding.commitUrl} target="_blank" rel="noopener noreferrer" style={{ color: tokens.colors.primary[600], fontSize: tokens.typography.fontSize.sm.size, textDecoration: 'none', fontWeight: tokens.typography.fontWeight.medium }}>
                      View Commit →
                    </a>
                  )}
                  {finding.prUrl && (
                    <a href={finding.prUrl} target="_blank" rel="noopener noreferrer" style={{ color: tokens.colors.primary[600], fontSize: tokens.typography.fontSize.sm.size, textDecoration: 'none', fontWeight: tokens.typography.fontWeight.medium }}>
                      View Pull Request →
                    </a>
                  )}
                </div>
              )}
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

        {/* Sidebar - Metadata Panel (Jira Style) */}
        <div>
          <div style={{ backgroundColor: tokens.colors.neutral[50], borderRadius: tokens.borderRadius.lg, border: `1px solid ${tokens.colors.neutral[200]}`, padding: tokens.spacing[20] }}>
            <h3 style={{ fontSize: tokens.typography.fontSize.sm.size, fontWeight: tokens.typography.fontWeight.semibold, marginBottom: tokens.spacing[16], color: tokens.colors.neutral[900] }}>
              Details
            </h3>

            {/* Status */}
            <div style={{ marginBottom: tokens.spacing[16] }}>
              <div style={{ fontSize: tokens.typography.fontSize.xs.size, fontWeight: tokens.typography.fontWeight.medium, color: tokens.colors.neutral[500], marginBottom: tokens.spacing[6] }}>
                Status
              </div>
              <span style={{
                display: 'inline-block',
                padding: `${tokens.spacing[4]} ${tokens.spacing[10]}`,
                backgroundColor: (() => {
                  switch (finding.status) {
                    case 'open': return tokens.colors.status.open;
                    case 'in-progress': return tokens.colors.status.inProgress;
                    case 'resolved': return tokens.colors.status.resolved;
                    case 'false-positive': return tokens.colors.status.falsePositive;
                    default: return tokens.colors.neutral[500];
                  }
                })(),
                color: tokens.colors.neutral[50],
                borderRadius: tokens.borderRadius.md,
                fontSize: tokens.typography.fontSize.xs.size,
                fontWeight: tokens.typography.fontWeight.semibold,
                textTransform: 'capitalize',
              }}>
                {finding.status.replace('-', ' ')}
              </span>
            </div>

            {/* Severity */}
            <div style={{ marginBottom: tokens.spacing[16] }}>
              <div style={{ fontSize: tokens.typography.fontSize.xs.size, fontWeight: tokens.typography.fontWeight.medium, color: tokens.colors.neutral[500], marginBottom: tokens.spacing[6] }}>
                Severity
              </div>
              <span style={{
                display: 'inline-block',
                padding: `${tokens.spacing[4]} ${tokens.spacing[10]}`,
                backgroundColor: getSeverityColor(finding.severity),
                color: tokens.colors.neutral[50],
                borderRadius: tokens.borderRadius.md,
                fontSize: tokens.typography.fontSize.xs.size,
                fontWeight: tokens.typography.fontWeight.semibold,
                textTransform: 'uppercase',
              }}>
                {finding.severity}
              </span>
            </div>

            {/* Assignee */}
            {finding.assignee && (
              <div style={{ marginBottom: tokens.spacing[16] }}>
                <div style={{ fontSize: tokens.typography.fontSize.xs.size, fontWeight: tokens.typography.fontWeight.medium, color: tokens.colors.neutral[500], marginBottom: tokens.spacing[6] }}>
                  Assignee
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[8] }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: tokens.borderRadius.full,
                    backgroundColor: tokens.colors.primary[100],
                    color: tokens.colors.primary[700],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: tokens.typography.fontWeight.semibold,
                    fontSize: tokens.typography.fontSize.xs.size,
                  }}>
                    {finding.assignee.substring(0, 2).toUpperCase()}
                  </div>
                  <span style={{ fontSize: tokens.typography.fontSize.sm.size, color: tokens.colors.neutral[900] }}>
                    {finding.assignee}
                  </span>
                </div>
              </div>
            )}

            {/* Detected At */}
            <div style={{ marginBottom: tokens.spacing[16] }}>
              <div style={{ fontSize: tokens.typography.fontSize.xs.size, fontWeight: tokens.typography.fontWeight.medium, color: tokens.colors.neutral[500], marginBottom: tokens.spacing[6] }}>
                Detected
              </div>
              <div style={{ fontSize: tokens.typography.fontSize.sm.size, color: tokens.colors.neutral[700] }}>
                {formatDate(finding.detectedAt)}
              </div>
            </div>

            {/* Last Updated */}
            <div style={{ marginBottom: tokens.spacing[16] }}>
              <div style={{ fontSize: tokens.typography.fontSize.xs.size, fontWeight: tokens.typography.fontWeight.medium, color: tokens.colors.neutral[500], marginBottom: tokens.spacing[6] }}>
                Last Updated
              </div>
              <div style={{ fontSize: tokens.typography.fontSize.sm.size, color: tokens.colors.neutral[700] }}>
                {formatDate(finding.lastUpdated)}
              </div>
            </div>

            {/* Labels */}
            {finding.labels && finding.labels.length > 0 && (
              <div style={{ marginBottom: tokens.spacing[16] }}>
                <div style={{ fontSize: tokens.typography.fontSize.xs.size, fontWeight: tokens.typography.fontWeight.medium, color: tokens.colors.neutral[500], marginBottom: tokens.spacing[8] }}>
                  Labels
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: tokens.spacing[6] }}>
                  {finding.labels.map((label, index) => (
                    <span key={index} style={{
                      padding: `${tokens.spacing[4]} ${tokens.spacing[8]}`,
                      backgroundColor: tokens.colors.neutral[200],
                      color: tokens.colors.neutral[700],
                      borderRadius: tokens.borderRadius.md,
                      fontSize: tokens.typography.fontSize.xs.size,
                    }}>
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Related Findings */}
          {relatedFindings.length > 0 && (
            <div style={{ 
              backgroundColor: tokens.colors.neutral[50], 
              borderRadius: tokens.borderRadius.lg, 
              border: `1px solid ${tokens.colors.neutral[200]}`, 
              padding: tokens.spacing[20],
              marginTop: tokens.spacing[16],
            }}>
              <h3 style={{ fontSize: tokens.typography.fontSize.sm.size, fontWeight: tokens.typography.fontWeight.semibold, marginBottom: tokens.spacing[12], color: tokens.colors.neutral[900] }}>
                Related Findings ({relatedFindings.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[8] }}>
                {relatedFindings.map((relatedFinding) => (
                  <Link
                    key={relatedFinding.id}
                    to={`/findings/${relatedFinding.id}`}
                    style={{
                      padding: tokens.spacing[12],
                      backgroundColor: tokens.colors.neutral[100],
                      borderRadius: tokens.borderRadius.md,
                      textDecoration: 'none',
                      display: 'block',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = tokens.colors.neutral[200]; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = tokens.colors.neutral[100]; }}
                  >
                    <div style={{ fontSize: tokens.typography.fontSize.sm.size, fontWeight: tokens.typography.fontWeight.medium, color: tokens.colors.neutral[900], marginBottom: tokens.spacing[4] }}>
                      {relatedFinding.secretType}
                    </div>
                    <div style={{ fontSize: tokens.typography.fontSize.xs.size, color: tokens.colors.neutral[600], marginBottom: tokens.spacing[6] }}>
                      {relatedFinding.repository}
                    </div>
                    <span style={{
                      display: 'inline-block',
                      padding: `${tokens.spacing[2]} ${tokens.spacing[8]}`,
                      backgroundColor: getSeverityColor(relatedFinding.severity),
                      color: tokens.colors.neutral[50],
                      borderRadius: tokens.borderRadius.md,
                      fontSize: tokens.typography.fontSize.xs.size,
                      fontWeight: tokens.typography.fontWeight.medium,
                      textTransform: 'uppercase',
                    }}>
                      {relatedFinding.severity}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FindingDetailPage;
