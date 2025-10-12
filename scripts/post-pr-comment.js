#!/usr/bin/env node

/**
 * Enhanced PR Comment Script for GitZen Secret Scanner
 * 
 * Features:
 * - Updates existing comments instead of creating duplicates
 * - Shows detailed findings with file:line references
 * - Includes severity indicators (🔴 Critical, 🟡 High, 🟢 Medium)
 * - Marks resolved findings
 * - Provides remediation guidance
 * - Collapsible sections for long result lists
 */

const fs = require('fs');
const path = require('path');

// Read environment variables
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY;
const PR_NUMBER = process.env.PR_NUMBER;
const FINDINGS_FILE = process.env.FINDINGS_FILE || 'gitleaks-reports/results.json';
const PREVIOUS_FINDINGS_FILE = process.env.PREVIOUS_FINDINGS_FILE || 'previous-findings.json';

// GitHub API configuration
const [owner, repo] = GITHUB_REPOSITORY.split('/');
const apiBase = 'https://api.github.com';

// Severity mapping
const SEVERITY_ICONS = {
  critical: '🔴',
  high: '🟡',
  medium: '🟢',
  low: '🔵'
};

/**
 * Make GitHub API request
 */
async function githubApi(endpoint, options = {}) {
  const url = `${apiBase}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...options.headers
    }
  });
  
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Load findings from JSON file
 */
function loadFindings(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading findings from ${filePath}:`, error.message);
    return [];
  }
}

/**
 * Save findings to JSON file
 */
function saveFindings(filePath, findings) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(findings, null, 2));
  } catch (error) {
    console.error(`Error saving findings to ${filePath}:`, error.message);
  }
}

/**
 * Get severity level from tags
 */
function getSeverity(finding) {
  if (!finding.Tags) return 'medium';
  
  const tags = finding.Tags.map(t => t.toLowerCase());
  
  if (tags.includes('critical')) return 'critical';
  if (tags.includes('high')) return 'high';
  if (tags.includes('medium')) return 'medium';
  if (tags.includes('low')) return 'low';
  
  return 'medium';
}

/**
 * Create finding fingerprint for comparison
 */
function getFindingFingerprint(finding) {
  return `${finding.File}:${finding.StartLine}:${finding.RuleID}`;
}

/**
 * Compare findings to detect new and resolved
 */
function compareFindings(current, previous) {
  const currentMap = new Map(current.map(f => [getFindingFingerprint(f), f]));
  const previousMap = new Map(previous.map(f => [getFindingFingerprint(f), f]));
  
  const newFindings = current.filter(f => !previousMap.has(getFindingFingerprint(f)));
  const resolvedFindings = previous.filter(f => !currentMap.has(getFindingFingerprint(f)));
  const persistentFindings = current.filter(f => previousMap.has(getFindingFingerprint(f)));
  
  return { newFindings, resolvedFindings, persistentFindings };
}

/**
 * Format a single finding as markdown
 */
function formatFinding(finding, index, isNew = false, isResolved = false) {
  const severity = getSeverity(finding);
  const icon = SEVERITY_ICONS[severity];
  const badge = isNew ? ' 🆕' : isResolved ? ' ✅' : '';
  
  let markdown = `### ${index}. ${icon} **${finding.RuleID}**${badge}\n\n`;
  markdown += `- **File:** \`${finding.File}\`\n`;
  markdown += `- **Line:** ${finding.StartLine}${finding.EndLine && finding.EndLine !== finding.StartLine ? `-${finding.EndLine}` : ''}\n`;
  markdown += `- **Severity:** ${severity.charAt(0).toUpperCase() + severity.slice(1)}\n`;
  
  if (finding.Description) {
    markdown += `- **Description:** ${finding.Description}\n`;
  }
  
  if (finding.Commit) {
    markdown += `- **Commit:** \`${finding.Commit.substring(0, 7)}\`\n`;
  }
  
  if (finding.Author && finding.Author !== '') {
    markdown += `- **Author:** ${finding.Author}\n`;
  }
  
  return markdown;
}

/**
 * Generate comment body
 */
function generateCommentBody(currentFindings, previousFindings) {
  const { newFindings, resolvedFindings, persistentFindings } = compareFindings(currentFindings, previousFindings);
  
  let body = '## 🔐 GitZen Secret Scan Results\n\n';
  
  // Summary section
  if (currentFindings.length === 0) {
    body += '### ✅ No secrets detected!\n\n';
    body += 'Your pull request passed the security scan. Great job! 🎉\n\n';
    
    if (resolvedFindings.length > 0) {
      body += `**${resolvedFindings.length} finding(s) resolved since last scan.** 👏\n\n`;
    }
  } else {
    body += `### ⚠️ Found ${currentFindings.length} potential secret(s)\n\n`;
    
    const criticalCount = currentFindings.filter(f => getSeverity(f) === 'critical').length;
    const highCount = currentFindings.filter(f => getSeverity(f) === 'high').length;
    const mediumCount = currentFindings.filter(f => getSeverity(f) === 'medium').length;
    
    body += '**Severity Breakdown:**\n';
    if (criticalCount > 0) body += `- 🔴 Critical: ${criticalCount}\n`;
    if (highCount > 0) body += `- 🟡 High: ${highCount}\n`;
    if (mediumCount > 0) body += `- 🟢 Medium: ${mediumCount}\n`;
    body += '\n';
    
    if (newFindings.length > 0) {
      body += `**🆕 ${newFindings.length} new finding(s) in this update**\n\n`;
    }
    
    if (resolvedFindings.length > 0) {
      body += `**✅ ${resolvedFindings.length} finding(s) resolved since last scan** 👏\n\n`;
    }
  }
  
  // Detailed findings section
  if (currentFindings.length > 0) {
    body += '<details>\n';
    body += '<summary><b>🔍 Detailed Findings</b> (click to expand)</summary>\n\n';
    
    // Show new findings first
    if (newFindings.length > 0) {
      body += '#### New Findings 🆕\n\n';
      newFindings.slice(0, 5).forEach((finding, index) => {
        body += formatFinding(finding, index + 1, true, false);
        body += '\n';
      });
      
      if (newFindings.length > 5) {
        body += `\n*...and ${newFindings.length - 5} more new finding(s)*\n\n`;
      }
    }
    
    // Show persistent findings
    if (persistentFindings.length > 0) {
      body += '#### Existing Findings\n\n';
      persistentFindings.slice(0, 5).forEach((finding, index) => {
        body += formatFinding(finding, newFindings.length + index + 1, false, false);
        body += '\n';
      });
      
      if (persistentFindings.length > 5) {
        body += `\n*...and ${persistentFindings.length - 5} more existing finding(s)*\n\n`;
      }
    }
    
    body += '</details>\n\n';
  }
  
  // Show resolved findings
  if (resolvedFindings.length > 0) {
    body += '<details>\n';
    body += '<summary><b>✅ Resolved Findings</b> (click to expand)</summary>\n\n';
    
    resolvedFindings.slice(0, 5).forEach((finding, index) => {
      body += formatFinding(finding, index + 1, false, true);
      body += '\n';
    });
    
    if (resolvedFindings.length > 5) {
      body += `\n*...and ${resolvedFindings.length - 5} more resolved finding(s)*\n\n`;
    }
    
    body += '</details>\n\n';
  }
  
  // Remediation section
  if (currentFindings.length > 0) {
    body += '### 🛠️ Remediation Steps\n\n';
    body += '1. **Remove secrets from code** - Never commit credentials\n';
    body += '2. **Rotate all exposed credentials** - Assume they are compromised\n';
    body += '3. **Use environment variables** - Store secrets securely outside code\n';
    body += '4. **Clean git history** - Use tools like `git-filter-repo` if secrets are in history\n';
    body += '5. **Add to .gitignore** - Prevent future accidental commits\n\n';
  }
  
  // Resources section
  body += '### 📚 Resources\n\n';
  body += '- [How to Remove Secrets](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)\n';
  body += '- [Secret Management Best Practices](https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_password)\n';
  body += '- [GitZen Documentation](https://github.com/yourorg/gitzen/docs)\n\n';
  
  // Footer
  body += '---\n';
  body += '*🤖 Automated by [GitZen](https://github.com/yourorg/gitzen) | ';
  body += 'This scan is privacy-preserving and does not store your code or secret values.*';
  
  return body;
}

/**
 * Find existing bot comment
 */
async function findExistingComment() {
  try {
    const comments = await githubApi(`/repos/${owner}/${repo}/issues/${PR_NUMBER}/comments`);
    
    return comments.find(comment => 
      comment.user.type === 'Bot' && 
      comment.body.includes('GitZen Secret Scan Results')
    );
  } catch (error) {
    console.error('Error finding existing comment:', error.message);
    return null;
  }
}

/**
 * Post or update PR comment
 */
async function postComment(body) {
  try {
    const existingComment = await findExistingComment();
    
    if (existingComment) {
      console.log('Updating existing comment...');
      await githubApi(`/repos/${owner}/${repo}/issues/comments/${existingComment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body })
      });
      console.log('✅ Comment updated successfully');
    } else {
      console.log('Creating new comment...');
      await githubApi(`/repos/${owner}/${repo}/issues/${PR_NUMBER}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body })
      });
      console.log('✅ Comment created successfully');
    }
  } catch (error) {
    console.error('Error posting comment:', error.message);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🔐 GitZen PR Comment Script');
  console.log('============================');
  console.log(`Repository: ${GITHUB_REPOSITORY}`);
  console.log(`PR Number: ${PR_NUMBER}`);
  console.log('');
  
  // Load findings
  const currentFindings = loadFindings(FINDINGS_FILE);
  const previousFindings = loadFindings(PREVIOUS_FINDINGS_FILE);
  
  console.log(`Current findings: ${currentFindings.length}`);
  console.log(`Previous findings: ${previousFindings.length}`);
  console.log('');
  
  // Generate comment body
  const commentBody = generateCommentBody(currentFindings, previousFindings);
  
  // Post comment
  await postComment(commentBody);
  
  // Save current findings for next run
  saveFindings(PREVIOUS_FINDINGS_FILE, currentFindings);
  
  console.log('');
  console.log('✅ PR comment posted successfully');
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = { generateCommentBody, formatFinding, compareFindings };
