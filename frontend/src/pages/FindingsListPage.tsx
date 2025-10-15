import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import tokens from '../design/tokens';
import Modal from '../components/Modal';
import FindingDetailPage from './FindingDetailPage';

// Types for our findings data
export interface Finding {
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
  assignee?: string;
  branch: string;
  commitHash: string;
}

// Filter state interface
interface FindingsFilters {
  search: string;
  repository: string;
  secretType: string;
  severity: string;
  status: string;
  assignee: string;
}

// Mock data for demonstration
const mockFindings: Finding[] = [
  {
    id: '1',
    repository: 'frontend-app',
    secretType: 'API Key',
    filePath: 'src/config/api.js',
    lineNumber: 12,
    description: 'Hardcoded API key found in configuration file',
    severity: 'critical',
    status: 'open',
    detectedAt: '2024-01-15T10:30:00Z',
    lastUpdated: '2024-01-15T10:30:00Z',
    assignee: 'john.doe@company.com',
    branch: 'main',
    commitHash: 'abc123def456'
  },
  {
    id: '2',
    repository: 'backend-services',
    secretType: 'Database Password',
    filePath: 'config/database.yaml',
    lineNumber: 8,
    description: 'Database password exposed in YAML configuration',
    severity: 'high',
    status: 'in-progress',
    detectedAt: '2024-01-14T15:45:00Z',
    lastUpdated: '2024-01-16T09:20:00Z',
    assignee: 'jane.smith@company.com',
    branch: 'development',
    commitHash: 'def456ghi789'
  },
  {
    id: '3',
    repository: 'mobile-app',
    secretType: 'OAuth Token',
    filePath: 'src/services/auth.ts',
    lineNumber: 25,
    description: 'OAuth client secret found in authentication service',
    severity: 'medium',
    status: 'resolved',
    detectedAt: '2024-01-13T08:15:00Z',
    lastUpdated: '2024-01-15T14:30:00Z',
    assignee: 'mike.wilson@company.com',
    branch: 'feature/oauth-fix',
    commitHash: 'ghi789jkl012'
  },
  {
    id: '4',
    repository: 'infrastructure',
    secretType: 'Private Key',
    filePath: 'terraform/aws/main.tf',
    lineNumber: 45,
    description: 'SSH private key embedded in Terraform configuration',
    severity: 'critical',
    status: 'false-positive',
    detectedAt: '2024-01-12T12:00:00Z',
    lastUpdated: '2024-01-14T16:45:00Z',
    assignee: 'sarah.jones@company.com',
    branch: 'main',
    commitHash: 'jkl012mno345'
  },
  {
    id: '5',
    repository: 'data-pipeline',
    secretType: 'Connection String',
    filePath: '.env.example',
    lineNumber: 3,
    description: 'Database connection string with credentials in example file',
    severity: 'low',
    status: 'open',
    detectedAt: '2024-01-11T17:30:00Z',
    lastUpdated: '2024-01-11T17:30:00Z',
    branch: 'main',
    commitHash: 'mno345pqr678'
  }
];

export const FindingsListPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [findings] = useState<Finding[]>(mockFindings);
  const [isLoading] = useState(false);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(
    searchParams.get('id')
  );
  const [filters, setFilters] = useState<FindingsFilters>({
    search: '',
    repository: '',
    secretType: '',
    severity: '',
    status: '',
    assignee: ''
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Sort state
  const [sortField, setSortField] = useState<keyof Finding>('detectedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Get unique values for filter dropdowns
  const uniqueRepositories = useMemo(() => 
    [...new Set(findings.map(f => f.repository))].sort(),
    [findings]
  );
  
  const uniqueSecretTypes = useMemo(() => 
    [...new Set(findings.map(f => f.secretType))].sort(),
    [findings]
  );

  const uniqueAssignees = useMemo(() => 
    [...new Set(findings.map(f => f.assignee).filter(Boolean))].sort(),
    [findings]
  );

  // Filter and sort findings
  const filteredFindings = useMemo(() => {
    let filtered = findings.filter(finding => {
      const matchesSearch = filters.search === '' || 
        Object.values(finding).some(value => 
          String(value).toLowerCase().includes(filters.search.toLowerCase())
        );
      
      const matchesRepository = filters.repository === '' || finding.repository === filters.repository;
      const matchesSecretType = filters.secretType === '' || finding.secretType === filters.secretType;
      const matchesSeverity = filters.severity === '' || finding.severity === filters.severity;
      const matchesStatus = filters.status === '' || finding.status === filters.status;
      const matchesAssignee = filters.assignee === '' || finding.assignee === filters.assignee;

      return matchesSearch && matchesRepository && matchesSecretType && 
             matchesSeverity && matchesStatus && matchesAssignee;
    });

    // Sort findings
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === bValue) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;
      
      const comparison = aValue < bValue ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [findings, filters, sortField, sortDirection]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredFindings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedFindings = filteredFindings.slice(startIndex, startIndex + itemsPerPage);

  // Handle filter changes
  const handleFilterChange = (field: keyof FindingsFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Handle sort changes
  const handleSort = (field: keyof Finding) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: '',
      repository: '',
      secretType: '',
      severity: '',
      status: '',
      assignee: ''
    });
    setCurrentPage(1);
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return filters.search !== '' || 
           filters.repository !== '' || 
           filters.secretType !== '' || 
           filters.severity !== '' || 
           filters.status !== '' || 
           filters.assignee !== '';
  };

  // Handle opening finding in modal
  const handleViewFinding = (findingId: string) => {
    setSelectedFindingId(findingId);
    // Update URL without navigation
    window.history.pushState({}, '', `/findings?id=${findingId}`);
  };

  // Handle closing modal
  const handleCloseModal = () => {
    setSelectedFindingId(null);
    // Remove id from URL
    window.history.pushState({}, '', '/findings');
  };

  // Handle export
  const handleExport = () => {
    // Placeholder for export functionality
    alert('Export functionality will be implemented');
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    const severityColors = {
      critical: tokens.colors.severity.critical,
      high: tokens.colors.severity.high,
      medium: tokens.colors.severity.medium,
      low: tokens.colors.severity.low,
      info: tokens.colors.severity.info
    };
    return severityColors[severity as keyof typeof severityColors] || tokens.colors.neutral[500];
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const statusColors = {
      open: tokens.colors.status.open,
      'in-progress': tokens.colors.status.inProgress,
      resolved: tokens.colors.status.resolved,
      'false-positive': tokens.colors.status.falsePositive
    };
    return statusColors[status as keyof typeof statusColors] || tokens.colors.neutral[500];
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const containerStyle: React.CSSProperties = {
    padding: tokens.spacing[8],
    backgroundColor: tokens.colors.neutral[50],
    minHeight: '100vh',
    fontFamily: tokens.typography.fontFamily.sans
  };

  const headerStyle: React.CSSProperties = {
    marginBottom: tokens.spacing[8]
  };

  const titleStyle: React.CSSProperties = {
    fontSize: tokens.typography.fontSize['3xl'].size,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.neutral[900],
    margin: 0,
    marginBottom: tokens.spacing[2]
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: tokens.typography.fontSize.lg.size,
    color: tokens.colors.neutral[600],
    margin: 0
  };

  const filtersCardStyle: React.CSSProperties = {
    backgroundColor: tokens.colors.neutral[0],
    borderRadius: tokens.borderRadius.lg,
    padding: tokens.spacing[6],
    marginBottom: tokens.spacing[6],
    boxShadow: tokens.shadows.base,
    border: `1px solid ${tokens.colors.neutral[200]}`
  };

  const filtersGridStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacing[3],
    alignItems: 'center'
  };

  const inputStyle: React.CSSProperties = {
    flex: '1 1 250px',
    minWidth: '200px',
    padding: `${tokens.spacing[2]} ${tokens.spacing[3]}`,
    border: `1px solid ${tokens.colors.neutral[300]}`,
    borderRadius: tokens.borderRadius.lg,
    fontSize: tokens.typography.fontSize.sm.size,
    fontFamily: 'inherit',
    backgroundColor: tokens.colors.neutral[0],
    transition: tokens.transitions.colors
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    flex: '0 1 180px',
    minWidth: '150px',
    cursor: 'pointer',
    // Remove native appearance
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    // Add custom dropdown arrow
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23475569' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    backgroundSize: '12px',
    paddingRight: tokens.spacing[8], // Make room for custom arrow
  };

  const buttonStyle: React.CSSProperties = {
    padding: `${tokens.spacing[2]} ${tokens.spacing[4]}`,
    backgroundColor: tokens.colors.neutral[100],
    border: `1px solid ${tokens.colors.neutral[300]}`,
    borderRadius: tokens.borderRadius.lg,
    fontSize: tokens.typography.fontSize.sm.size,
    fontWeight: tokens.typography.fontWeight.medium,
    cursor: 'pointer',
    transition: tokens.transitions.all,
    color: tokens.colors.neutral[700]
  };

  const primaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: tokens.colors.primary[500],
    color: tokens.colors.neutral[0],
    border: `1px solid ${tokens.colors.primary[500]}`
  };

  const tableCardStyle: React.CSSProperties = {
    backgroundColor: tokens.colors.neutral[0],
    borderRadius: tokens.borderRadius.lg,
    overflow: 'hidden',
    boxShadow: tokens.shadows.base,
    border: `1px solid ${tokens.colors.neutral[200]}`
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse'
  };

  const thStyle: React.CSSProperties = {
    padding: tokens.spacing[4],
    textAlign: 'left',
    backgroundColor: tokens.colors.neutral[50],
    borderBottom: `1px solid ${tokens.colors.neutral[200]}`,
    fontSize: tokens.typography.fontSize.sm.size,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.neutral[900],
    cursor: 'pointer',
    userSelect: 'none'
  };

  const tdStyle: React.CSSProperties = {
    padding: tokens.spacing[4],
    borderBottom: `1px solid ${tokens.colors.neutral[200]}`,
    fontSize: tokens.typography.fontSize.sm.size,
    color: tokens.colors.neutral[700]
  };

  const badgeStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`,
    borderRadius: tokens.borderRadius.full,
    fontSize: tokens.typography.fontSize.xs.size,
    fontWeight: tokens.typography.fontWeight.semibold,
    textTransform: 'capitalize'
  };

  const paginationStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: tokens.spacing[6],
    padding: tokens.spacing[4],
    backgroundColor: tokens.colors.neutral[0],
    borderRadius: tokens.borderRadius.lg,
    border: `1px solid ${tokens.colors.neutral[200]}`
  };

  const statsStyle: React.CSSProperties = {
    display: 'flex',
    gap: tokens.spacing[6],
    marginBottom: tokens.spacing[6]
  };

  const statCardStyle: React.CSSProperties = {
    backgroundColor: tokens.colors.neutral[0],
    padding: tokens.spacing[4],
    borderRadius: tokens.borderRadius.lg,
    border: `1px solid ${tokens.colors.neutral[200]}`,
    flex: 1,
    textAlign: 'center'
  };

  const statValueStyle: React.CSSProperties = {
    fontSize: tokens.typography.fontSize['2xl'].size,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.neutral[900],
    margin: 0
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: tokens.typography.fontSize.sm.size,
    color: tokens.colors.neutral[600],
    margin: 0,
    marginTop: tokens.spacing[1]
  };

  // Calculate stats
  const stats = {
    total: filteredFindings.length,
    open: filteredFindings.filter(f => f.status === 'open').length,
    critical: filteredFindings.filter(f => f.severity === 'critical').length,
    resolved: filteredFindings.filter(f => f.status === 'resolved').length
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>Security Findings</h1>
        <p style={subtitleStyle}>
          Monitor and manage security secrets detected across your repositories
        </p>
      </div>

      {/* Stats Cards */}
      <div style={statsStyle}>
        <div style={statCardStyle}>
          <p style={statValueStyle}>{stats.total}</p>
          <p style={statLabelStyle}>Total Findings</p>
        </div>
        <div style={statCardStyle}>
          <p style={{...statValueStyle, color: tokens.colors.status.open}}>{stats.open}</p>
          <p style={statLabelStyle}>Open Issues</p>
        </div>
        <div style={statCardStyle}>
          <p style={{...statValueStyle, color: tokens.colors.severity.critical}}>{stats.critical}</p>
          <p style={statLabelStyle}>Critical</p>
        </div>
        <div style={statCardStyle}>
          <p style={{...statValueStyle, color: tokens.colors.status.resolved}}>{stats.resolved}</p>
          <p style={statLabelStyle}>Resolved</p>
        </div>
      </div>

      {/* Filters */}
      <div style={filtersCardStyle}>
        <div style={filtersGridStyle}>
          <input
            type="text"
            placeholder="Search findings..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            style={inputStyle}
          />
          
          <select
            value={filters.repository}
            onChange={(e) => handleFilterChange('repository', e.target.value)}
            style={selectStyle}
          >
            <option value="">All Repositories</option>
            {uniqueRepositories.map(repo => (
              <option key={repo} value={repo}>{repo}</option>
            ))}
          </select>

          <select
            value={filters.secretType}
            onChange={(e) => handleFilterChange('secretType', e.target.value)}
            style={selectStyle}
          >
            <option value="">All Secret Types</option>
            {uniqueSecretTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select
            value={filters.severity}
            onChange={(e) => handleFilterChange('severity', e.target.value)}
            style={selectStyle}
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="info">Info</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            style={selectStyle}
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="false-positive">False Positive</option>
          </select>

          <select
            value={filters.assignee}
            onChange={(e) => handleFilterChange('assignee', e.target.value)}
            style={selectStyle}
          >
            <option value="">All Assignees</option>
            {uniqueAssignees.map(assignee => (
              <option key={assignee} value={assignee}>{assignee}</option>
            ))}
          </select>

          {/* Action Buttons */}
          {hasActiveFilters() && (
            <button onClick={clearFilters} style={{...buttonStyle, flex: '0 0 auto'}}>
              Clear Filters
            </button>
          )}
          <button onClick={handleExport} style={{...primaryButtonStyle, flex: '0 0 auto'}}>
            Export Results
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={tableCardStyle}>
        {isLoading ? (
          <div style={{ padding: tokens.spacing[8], textAlign: 'center' }}>
            <div style={{
              display: 'inline-block',
              width: '32px',
              height: '32px',
              border: `4px solid ${tokens.colors.neutral[200]}`,
              borderTop: `4px solid ${tokens.colors.primary[500]}`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <p style={{ marginTop: tokens.spacing[4], color: tokens.colors.neutral[600] }}>
              Loading findings...
            </p>
          </div>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle} onClick={() => handleSort('repository')}>
                  Repository {sortField === 'repository' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th style={thStyle} onClick={() => handleSort('secretType')}>
                  Secret Type {sortField === 'secretType' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th style={thStyle} onClick={() => handleSort('filePath')}>
                  File Path {sortField === 'filePath' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th style={thStyle} onClick={() => handleSort('severity')}>
                  Severity {sortField === 'severity' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th style={thStyle} onClick={() => handleSort('status')}>
                  Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th style={thStyle} onClick={() => handleSort('detectedAt')}>
                  Detected {sortField === 'detectedAt' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedFindings.map(finding => (
                <tr 
                  key={finding.id}
                  onClick={() => handleViewFinding(finding.id)}
                  style={{ 
                    cursor: 'pointer',
                    transition: `background-color ${tokens.transitions.duration[200]}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = tokens.colors.neutral[50];
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <td style={tdStyle}>
                    <div style={{ fontWeight: tokens.typography.fontWeight.medium }}>
                      {finding.repository}
                    </div>
                    <div style={{ fontSize: tokens.typography.fontSize.xs.size, color: tokens.colors.neutral[500] }}>
                      {finding.branch}
                    </div>
                  </td>
                  <td style={tdStyle}>{finding.secretType}</td>
                  <td style={tdStyle}>
                    <div style={{ fontFamily: tokens.typography.fontFamily.mono, fontSize: tokens.typography.fontSize.xs.size }}>
                      {finding.filePath}:{finding.lineNumber}
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      ...badgeStyle,
                      backgroundColor: `${getSeverityColor(finding.severity)}20`,
                      color: getSeverityColor(finding.severity)
                    }}>
                      {finding.severity}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      ...badgeStyle,
                      backgroundColor: `${getStatusColor(finding.status)}20`,
                      color: getStatusColor(finding.status)
                    }}>
                      {finding.status.replace('-', ' ')}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {formatDate(finding.detectedAt)}
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: tokens.spacing[2] }}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewFinding(finding.id);
                        }}
                        style={{
                          ...buttonStyle,
                          padding: `${tokens.spacing[1.5]} ${tokens.spacing[3]}`,
                          fontSize: tokens.typography.fontSize.xs.size,
                          backgroundColor: tokens.colors.primary[50],
                          borderColor: tokens.colors.primary[200],
                          color: tokens.colors.primary[700]
                        }}
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div style={paginationStyle}>
        <div style={{ fontSize: tokens.typography.fontSize.sm.size, color: tokens.colors.neutral[600] }}>
          Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredFindings.length)} of {filteredFindings.length} findings
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[2] }}>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            style={{
              ...selectStyle,
              width: 'auto',
              padding: `${tokens.spacing[1]} ${tokens.spacing[2]}`
            }}
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
          
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            style={{
              ...buttonStyle,
              opacity: currentPage === 1 ? 0.5 : 1,
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            Previous
          </button>
          
          <span style={{ 
            padding: `0 ${tokens.spacing[2]}`,
            fontSize: tokens.typography.fontSize.sm.size,
            color: tokens.colors.neutral[600],
            display: 'flex',
            alignItems: 'center',
            minWidth: '100px',
            justifyContent: 'center',
          }}>
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            style={{
              ...buttonStyle,
              opacity: currentPage === totalPages ? 0.5 : 1,
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Next
          </button>
        </div>
      </div>

      {/* Modal for Finding Detail */}
      <Modal 
        isOpen={selectedFindingId !== null} 
        onClose={handleCloseModal}
        maxWidth="1400px"
      >
        {selectedFindingId && (
          <div style={{ padding: tokens.spacing[24] }}>
            <FindingDetailPage findingId={selectedFindingId} inModal={true} />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FindingsListPage;