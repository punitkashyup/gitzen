# Web Dashboard Mockup & Wireframe

## Overview
This document outlines the visual structure and user flows for the Secret Scan Dashboard.

---

## Page Structure

### 1. Dashboard Home

```
┌─────────────────────────────────────────────────────────────────┐
│  🔐 Secret Scan Dashboard                    [User Menu ▼]      │
├─────────────────────────────────────────────────────────────────┤
│  [Dashboard] [Findings] [Repositories] [Cleanup] [Settings]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📊 Overview                                                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │  Total Scans │ │   Findings   │ │   Resolved   │            │
│  │     1,247    │ │      89      │ │      234     │            │
│  │  ↑ 12% ▲    │ │  ⚠️ 5 High   │ │  ✅ 95%      │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
│                                                                  │
│  📈 Findings Trend (Last 30 Days)                               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │     ▁▂▃▄▅▆▇█                                            │    │
│  │                                                          │    │
│  │  Critical: ███                                           │    │
│  │  High:     ████████                                      │    │
│  │  Medium:   ███████████████                               │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  🏢 Repository Health                                           │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Repo Name           Last Scan      Status    Findings  │    │
│  │  ──────────────────────────────────────────────────────  │    │
│  │  🟢 frontend-app     2 hours ago    ✅ Clean   0        │    │
│  │  🟡 backend-api      1 day ago      ⚠️ Issues  3        │    │
│  │  🔴 legacy-system    1 week ago     ❌ Critical 12      │    │
│  │  🟢 mobile-app       3 hours ago    ✅ Clean   0        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  📋 Recent Activity                                             │
│  • John Doe marked finding #1234 as resolved                    │
│  • New scan completed for backend-api (3 findings)              │
│  • Cleanup job #567 completed successfully                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### 2. Findings List Page

```
┌─────────────────────────────────────────────────────────────────┐
│  🔐 Secret Scan Dashboard                    [User Menu ▼]      │
├─────────────────────────────────────────────────────────────────┤
│  [Dashboard] [Findings] [Repositories] [Cleanup] [Settings]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🔍 Findings                                                     │
│                                                                  │
│  Filters:                                                        │
│  [Repository ▼] [Severity ▼] [Status ▼] [Date Range ▼]         │
│  [Search by file, commit, type...]                              │
│                                                                  │
│  Bulk Actions: [Mark as False Positive] [Resolve] [Export]      │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ☑️ Finding #1234                            🔴 Critical │    │
│  │ ───────────────────────────────────────────────────────  │    │
│  │ Secret Type: AWS Access Key                             │    │
│  │ File: src/config/aws.ts:42                              │    │
│  │ Commit: abc123de (2 days ago)                           │    │
│  │ Author: john.doe@example.com (hashed)                   │    │
│  │                                                          │    │
│  │ [View Details] [Mark False Positive] [Start Cleanup]    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ ☑️ Finding #1235                            🟡 High     │    │
│  │ ───────────────────────────────────────────────────────  │    │
│  │ Secret Type: GitHub Token                               │    │
│  │ File: scripts/deploy.sh:15                              │    │
│  │ Commit: def456gh (5 days ago)                           │    │
│  │ Author: jane.smith@example.com (hashed)                 │    │
│  │                                                          │    │
│  │ [View Details] [Mark False Positive] [Start Cleanup]    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  [Previous] Page 1 of 5 [Next]                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### 3. Finding Detail Page

```
┌─────────────────────────────────────────────────────────────────┐
│  🔐 Secret Scan Dashboard                    [User Menu ▼]      │
├─────────────────────────────────────────────────────────────────┤
│  [Dashboard] [Findings] [Repositories] [Cleanup] [Settings]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ← Back to Findings                                             │
│                                                                  │
│  🔴 Finding #1234 - Critical                                    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Details                                                  │    │
│  │                                                          │    │
│  │ Secret Type:        AWS Access Key                       │    │
│  │ Severity:           🔴 Critical                          │    │
│  │ Rule ID:            aws-access-key-id                    │    │
│  │ Status:             🟡 Open                              │    │
│  │                                                          │    │
│  │ Location:                                                │    │
│  │ • Repository:       backend-api                          │    │
│  │ • File Path:        src/config/aws.ts                    │    │
│  │ • Line Number:      42                                   │    │
│  │ • Commit Hash:      abc123de4567890                      │    │
│  │ • Branch:           main                                 │    │
│  │                                                          │    │
│  │ Discovery:                                               │    │
│  │ • Discovered:       Oct 10, 2025 14:23 UTC              │    │
│  │ • Scan ID:          scan-xyz789                          │    │
│  │ • Trigger:          Pull Request #456                    │    │
│  │                                                          │    │
│  │ Privacy Note: Code snippets and secret values are NOT    │    │
│  │ stored for your security.                                │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Recommended Actions                                      │    │
│  │                                                          │    │
│  │ ⚠️ IMMEDIATE:                                            │    │
│  │ 1. Rotate the compromised AWS credentials                │    │
│  │    [AWS Credential Rotation Guide →]                     │    │
│  │                                                          │    │
│  │ 2. Remove secret from current code                       │    │
│  │    • Replace with environment variable                   │    │
│  │    • Use AWS Secrets Manager or similar                  │    │
│  │                                                          │    │
│  │ 3. Clean from Git history                                │    │
│  │    [Start Cleanup Workflow →]                            │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Actions:                                                        │
│  [🧹 Start Cleanup] [❌ Mark False Positive] [✅ Mark Resolved] │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Activity Log                                             │    │
│  │                                                          │    │
│  │ Oct 10, 14:23 - Finding created (Scan #scan-xyz789)      │    │
│  │ Oct 10, 14:45 - Viewed by john.doe@example.com          │    │
│  │ Oct 10, 15:12 - Cleanup job created (#job-123)          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### 4. Cleanup Workflow Page

```
┌─────────────────────────────────────────────────────────────────┐
│  🔐 Secret Scan Dashboard                    [User Menu ▼]      │
├─────────────────────────────────────────────────────────────────┤
│  [Dashboard] [Findings] [Repositories] [Cleanup] [Settings]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🧹 Secret Cleanup Workflow                                     │
│                                                                  │
│  ┌────┬────┬────┬────┬────┐                                     │
│  │ 1  │ 2  │ 3  │ 4  │ 5  │                                     │
│  │ ✅ │ ▶  │ ○  │ ○  │ ○  │                                     │
│  └────┴────┴────┴────┴────┘                                     │
│  Select Configure Generate Verify Review                        │
│                                                                  │
│  Step 2: Configure Cleanup                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                          │    │
│  │ Selected Findings: 3                                     │    │
│  │ • src/config/aws.ts:42 (AWS Key)                         │    │
│  │ • scripts/deploy.sh:15 (GitHub Token)                    │    │
│  │ • .env.example:8 (Database Password)                     │    │
│  │                                                          │    │
│  │ Cleanup Method:                                          │    │
│  │ ( ) BFG Repo-Cleaner (Fast, simple)                      │    │
│  │ (•) git-filter-repo (Recommended, more control)          │    │
│  │                                                          │    │
│  │ Options:                                                 │    │
│  │ [✓] Create backup before cleanup                         │    │
│  │ [✓] Protect branches (prevent force push errors)         │    │
│  │ [✓] Verify cleanup success                               │    │
│  │ [ ] Dry run first (preview changes)                      │    │
│  │                                                          │    │
│  │ Repository Mirror Location:                              │    │
│  │ [/Users/you/cleanup-repos/backend-api-cleanup]           │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ⚠️ Important Safety Information                                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ • This will rewrite Git history                          │    │
│  │ • All team members will need to re-clone                 │    │
│  │ • Backup will be created automatically                   │    │
│  │ • Rollback instructions will be provided                 │    │
│  │                                                          │    │
│  │ [Read Full Safety Guide →]                               │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  [← Previous] [Continue to Script Generation →]                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### 5. Script Generation Page

```
┌─────────────────────────────────────────────────────────────────┐
│  🔐 Secret Scan Dashboard                    [User Menu ▼]      │
├─────────────────────────────────────────────────────────────────┤
│  [Dashboard] [Findings] [Repositories] [Cleanup] [Settings]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🧹 Secret Cleanup Workflow                                     │
│                                                                  │
│  ┌────┬────┬────┬────┬────┐                                     │
│  │ 1  │ 2  │ 3  │ 4  │ 5  │                                     │
│  │ ✅ │ ✅ │ ▶  │ ○  │ ○  │                                     │
│  └────┴────┴────┴────┴────┘                                     │
│  Select Configure Generate Verify Review                        │
│                                                                  │
│  Step 3: Generated Cleanup Script                               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ #!/bin/bash                                              │    │
│  │ # Secret Cleanup Script - Job #job-123                   │    │
│  │ # Generated: Oct 12, 2025 10:30 UTC                      │    │
│  │ # Method: git-filter-repo                                │    │
│  │                                                          │    │
│  │ set -e  # Exit on error                                  │    │
│  │                                                          │    │
│  │ echo "🔒 Starting secret cleanup process..."             │    │
│  │                                                          │    │
│  │ # Step 1: Create backup                                  │    │
│  │ echo "📦 Creating backup..."                             │    │
│  │ git clone --mirror git@github.com:org/repo.git \         │    │
│  │   backup-$(date +%Y%m%d-%H%M%S)                          │    │
│  │                                                          │    │
│  │ # Step 2: Clone repository for cleanup                   │    │
│  │ echo "📥 Cloning repository..."                          │    │
│  │ git clone git@github.com:org/repo.git cleanup-repo       │    │
│  │ cd cleanup-repo                                          │    │
│  │                                                          │    │
│  │ # Step 3: Install git-filter-repo                        │    │
│  │ if ! command -v git-filter-repo &> /dev/null; then       │    │
│  │   echo "Installing git-filter-repo..."                   │    │
│  │   pip3 install git-filter-repo                           │    │
│  │ fi                                                       │    │
│  │                                                          │    │
│  │ # Step 4: Remove secrets from history                    │    │
│  │ echo "🧹 Removing secrets from history..."               │    │
│  │ git-filter-repo --path src/config/aws.ts \               │    │
│  │   --invert-paths --force                                 │    │
│  │                                                          │    │
│  │ # Step 5: Verify cleanup                                 │    │
│  │ echo "✅ Verifying cleanup..."                           │    │
│  │ git log --all --full-history -- src/config/aws.ts        │    │
│  │                                                          │    │
│  │ echo "✨ Cleanup complete!"                              │    │
│  │ echo "Next: Review changes and force push if satisfied"  │    │
│  │                                                          │    │
│  │ [Copy Script] [Download] [Save for Later]               │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ✅ Pre-Execution Checklist                                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ [ ] Notify team about upcoming history rewrite           │    │
│  │ [ ] Rotated compromised credentials                      │    │
│  │ [ ] Have rollback plan ready                             │    │
│  │ [ ] Tested script in dry-run mode                        │    │
│  │ [ ] Reviewed all files to be removed                     │    │
│  │ [ ] Scheduled maintenance window (if needed)             │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  [← Previous] [Execute Script →]                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### 6. Repository Management Page

```
┌─────────────────────────────────────────────────────────────────┐
│  🔐 Secret Scan Dashboard                    [User Menu ▼]      │
├─────────────────────────────────────────────────────────────────┤
│  [Dashboard] [Findings] [Repositories] [Cleanup] [Settings]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🏢 Repositories                                                │
│                                                                  │
│  [+ Add Repository]  [🔄 Sync with GitHub]  [Import...]         │
│                                                                  │
│  Search: [Search repositories...]                    View: [Grid│Cards│List]│
│                                                                  │
│  ┌──────────────────────────────────┐                           │
│  │ 📁 frontend-app          🟢      │                           │
│  │ ────────────────────────────────  │                           │
│  │ Last Scan: 2 hours ago            │                           │
│  │ Findings: 0 🎉                   │                           │
│  │ Status: Healthy                   │                           │
│  │                                   │                           │
│  │ [View Details] [Scan Now]         │                           │
│  └──────────────────────────────────┘                           │
│                                                                  │
│  ┌──────────────────────────────────┐                           │
│  │ 📁 backend-api           🟡      │                           │
│  │ ────────────────────────────────  │                           │
│  │ Last Scan: 1 day ago              │                           │
│  │ Findings: 3 ⚠️                    │                           │
│  │ • 1 High • 2 Medium               │                           │
│  │                                   │                           │
│  │ [View Details] [Scan Now]         │                           │
│  └──────────────────────────────────┘                           │
│                                                                  │
│  ┌──────────────────────────────────┐                           │
│  │ 📁 legacy-system         🔴      │                           │
│  │ ────────────────────────────────  │                           │
│  │ Last Scan: 1 week ago             │                           │
│  │ Findings: 12 🚨                   │                           │
│  │ • 2 Critical • 5 High • 5 Medium  │                           │
│  │                                   │                           │
│  │ [View Details] [Scan Now]         │                           │
│  └──────────────────────────────────┘                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### 7. Settings Page

```
┌─────────────────────────────────────────────────────────────────┐
│  🔐 Secret Scan Dashboard                    [User Menu ▼]      │
├─────────────────────────────────────────────────────────────────┤
│  [Dashboard] [Findings] [Repositories] [Cleanup] [Settings]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ⚙️ Settings                                                    │
│                                                                  │
│  [General] [API Keys] [Integrations] [Team] [Notifications]     │
│                                                                  │
│  API Keys                                                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                          │    │
│  │ 🔑 GitHub Action API Keys                               │    │
│  │                                                          │    │
│  │ Name: Production Key                                     │    │
│  │ Key:  gsk_prod_************************7a3f              │    │
│  │ Created: Oct 1, 2025                                     │    │
│  │ Last Used: 2 hours ago                                   │    │
│  │ [Revoke] [Regenerate]                                    │    │
│  │                                                          │    │
│  │ ─────────────────────────────────────────────────────    │    │
│  │                                                          │    │
│  │ Name: Staging Key                                        │    │
│  │ Key:  gsk_stag_************************9b2e              │    │
│  │ Created: Sep 15, 2025                                    │    │
│  │ Last Used: 1 day ago                                     │    │
│  │ [Revoke] [Regenerate]                                    │    │
│  │                                                          │    │
│  │ [+ Create New API Key]                                   │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Integrations                                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                          │    │
│  │ [Slack Logo] Slack                            ✅ Connected│    │
│  │ Send notifications to #security-alerts                   │    │
│  │ [Configure] [Disconnect]                                 │    │
│  │                                                          │    │
│  │ ─────────────────────────────────────────────────────    │    │
│  │                                                          │    │
│  │ [GitHub Logo] GitHub                          ✅ Connected│    │
│  │ OAuth integration for repository access                  │    │
│  │ [Configure] [Disconnect]                                 │    │
│  │                                                          │    │
│  │ ─────────────────────────────────────────────────────    │    │
│  │                                                          │    │
│  │ [Jira Logo] Jira                              ⚪ Not Setup│    │
│  │ Create tickets for findings automatically                │    │
│  │ [Connect]                                                │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## User Flows

### Flow 1: First-Time Setup
1. User signs up with GitHub OAuth
2. Dashboard shows onboarding wizard
3. User connects GitHub repositories
4. Dashboard generates API key
5. User installs GitHub Action using provided workflow file
6. First scan runs automatically
7. User receives welcome email with resources

### Flow 2: Responding to Findings
1. GitHub Action detects secret in PR
2. PR comment is posted with summary
3. User clicks link to dashboard
4. Dashboard shows finding details
5. User rotates compromised credential
6. User starts cleanup workflow
7. Dashboard generates removal script
8. User executes script locally
9. User verifies cleanup
10. User marks finding as resolved

### Flow 3: Scheduled Monitoring
1. Scheduled scan runs automatically
2. New findings are detected
3. Slack notification sent to team
4. Team member reviews dashboard
5. Findings are triaged and assigned
6. Team member starts remediation
7. Audit log tracks all actions

---

## Design Principles

### Visual Design
- **Clean & Professional**: Modern, minimalist interface
- **Color Coding**: Red (critical), Yellow (high), Blue (medium), Green (low)
- **Consistent Icons**: Material Design or Feather icons
- **Responsive**: Works on desktop, tablet, mobile
- **Dark Mode**: Optional dark theme

### UX Principles
- **Progressive Disclosure**: Show most important info first
- **Guided Workflows**: Step-by-step for complex tasks
- **Clear Actions**: Obvious next steps at all times
- **Safety First**: Warnings before dangerous operations
- **Privacy Visible**: Regular reminders about data handling

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader friendly
- High contrast mode
- Focus indicators

---

## Technology Recommendations

### Frontend Framework
- **React** with TypeScript (preferred)
- **Vue 3** with TypeScript (alternative)

### UI Library
- **Material-UI** (comprehensive components)
- **Tailwind CSS** + **Headless UI** (more customizable)
- **Chakra UI** (balance of both)

### Charts & Visualization
- **Chart.js** (simple, performant)
- **Recharts** (React-specific)
- **D3.js** (custom, advanced visualizations)

### State Management
- **React Query** / **TanStack Query** (server state)
- **Zustand** or **Jotai** (client state)
- **Redux Toolkit** (if complex state needs)

---

## Next Steps for Design

1. Create high-fidelity mockups in Figma/Sketch
2. Build interactive prototype
3. User testing with beta users
4. Iterate based on feedback
5. Create design system documentation
6. Build component library

---

**Document Status**: Draft v1.0  
**Last Updated**: October 12, 2025
