#!/bin/bash
set -euo pipefail

##############################################################################
# GitZen Privacy-Safe Metadata Extractor
#
# Extracts ONLY privacy-safe metadata from Gitleaks scan results.
# NEVER includes source code, secret values, or sensitive context.
##############################################################################

# Color codes
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

# Default values
GITLEAKS_RESULTS="${GITLEAKS_RESULTS:-results.json}"
METADATA_OUTPUT="${METADATA_OUTPUT:-metadata.json}"

# Check requirements
if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ Error: jq is required but not installed${NC}" >&2
    exit 1
fi

# Hash function using SHA-256
hash_sha256() {
    echo -n "$1" | sha256sum | awk '{print $1}'
}

echo -e "${BLUE}🔍 Extracting privacy-safe metadata...${NC}"

# Check if results file exists
if [ ! -f "$GITLEAKS_RESULTS" ]; then
    echo -e "${YELLOW}⚠️  No Gitleaks results found. Creating empty metadata.${NC}"
    
    jq -n \
        --arg version "1.0.0" \
        --arg repo_name "${REPO_NAME:-unknown/unknown}" \
        --arg repo_owner "${REPO_OWNER:-unknown}" \
        --arg branch "${BRANCH:-main}" \
        --arg commit_hash "${COMMIT_HASH:-unknown}" \
        --arg trigger_type "${TRIGGER_TYPE:-unknown}" \
        --argjson pr_number "${PR_NUMBER:-null}" \
        --arg scan_timestamp "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
        --arg gitleaks_version "${GITLEAKS_VERSION:-unknown}" \
        --arg action_version "${ACTION_VERSION:-1.0.0}" \
        '{
            version: $version,
            scan_context: {
                repo_name: $repo_name,
                repo_owner: $repo_owner,
                branch: $branch,
                commit_hash: $commit_hash,
                trigger_type: $trigger_type,
                pr_number: $pr_number,
                scan_timestamp: $scan_timestamp,
                gitleaks_version: $gitleaks_version,
                action_version: $action_version
            },
            findings: [],
            summary: {
                total_findings: 0,
                by_severity: {critical: 0, high: 0, medium: 0, low: 0, info: 0},
                by_type: {},
                unique_files: 0
            }
        }' > "$METADATA_OUTPUT"
    
    echo -e "${GREEN}✅ Clean scan metadata created${NC}"
    exit 0
fi

# Check if results are empty
findings_count=$(jq 'length' "$GITLEAKS_RESULTS" 2>/dev/null || echo "0")

if [ "$findings_count" -eq 0 ]; then
    echo -e "${GREEN}✅ No secrets detected.${NC}"
    
    jq -n \
        --arg version "1.0.0" \
        --arg repo_name "${REPO_NAME:-unknown/unknown}" \
        --arg repo_owner "${REPO_OWNER:-unknown}" \
        --arg branch "${BRANCH:-main}" \
        --arg commit_hash "${COMMIT_HASH:-unknown}" \
        --arg trigger_type "${TRIGGER_TYPE:-unknown}" \
        --argjson pr_number "${PR_NUMBER:-null}" \
        --arg scan_timestamp "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
        --arg gitleaks_version "${GITLEAKS_VERSION:-unknown}" \
        --arg action_version "${ACTION_VERSION:-1.0.0}" \
        '{
            version: $version,
            scan_context: {
                repo_name: $repo_name,
                repo_owner: $repo_owner,
                branch: $branch,
                commit_hash: $commit_hash,
                trigger_type: $trigger_type,
                pr_number: $pr_number,
                scan_timestamp: $scan_timestamp,
                gitleaks_version: $gitleaks_version,
                action_version: $action_version
            },
            findings: [],
            summary: {
                total_findings: 0,
                by_severity: {critical: 0, high: 0, medium: 0, low: 0, info: 0},
                by_type: {},
                unique_files: 0
            }
        }' > "$METADATA_OUTPUT"
    
    echo -e "${GREEN}✅ Clean scan metadata created${NC}"
    exit 0
fi

echo -e "${YELLOW}📊 Processing $findings_count findings...${NC}"

# Create temporary file for processed findings
TEMP_FINDINGS=$(mktemp)
trap 'rm -f "$TEMP_FINDINGS"' EXIT

# Start JSON array
echo "[" > "$TEMP_FINDINGS"

# Process each finding and compute hashes
first=true
jq -c '.[]' "$GITLEAKS_RESULTS" | while IFS= read -r finding; do
    # Extract values
    file_path=$(echo "$finding" | jq -r '.File // "unknown"')
    line_number=$(echo "$finding" | jq -r '.StartLine // 0')
    rule_id=$(echo "$finding" | jq -r '.RuleID // "unknown"')
    commit=$(echo "$finding" | jq -r '.Commit // env.COMMIT_HASH // "unknown"')
    secret=$(echo "$finding" | jq -r '.Secret // .Match // ""')
    email=$(echo "$finding" | jq -r '.Email // "unknown@unknown.com"')
    
    # Compute hashes
    finding_id=$(hash_sha256 "${file_path}:${line_number}:${rule_id}:${commit}")
    secret_hash="sha256:$(hash_sha256 "$secret")"
    author_hash=$(hash_sha256 "$email")
    match_fingerprint=$(hash_sha256 "${file_path}:${line_number}")
    
    # Determine severity
    tags=$(echo "$finding" | jq -r '.Tags // []')
    if echo "$tags" | jq -e 'contains(["critical"])' > /dev/null 2>&1; then
        severity="critical"
    elif echo "$tags" | jq -e 'contains(["high"])' > /dev/null 2>&1; then
        severity="high"
    elif echo "$tags" | jq -e 'contains(["medium"])' > /dev/null 2>&1; then
        severity="medium"
    elif echo "$tags" | jq -e 'contains(["low"])' > /dev/null 2>&1; then
        severity="low"
    else
        severity="medium"
    fi
    
    # Add comma if not first
    if [ "$first" = false ]; then
        echo "," >> "$TEMP_FINDINGS"
    fi
    first=false
    
    # Build privacy-safe finding object
    echo "$finding" | jq \
        --arg finding_id "$finding_id" \
        --arg file_path "$file_path" \
        --argjson line_number "$line_number" \
        --argjson end_line "$(echo "$finding" | jq -r '.EndLine // .StartLine // 0')" \
        --argjson column_start "$(echo "$finding" | jq -r '.StartColumn // 1')" \
        --argjson column_end "$(echo "$finding" | jq -r '.EndColumn // 1')" \
        --arg commit_hash "$commit" \
        --arg author_hash "$author_hash" \
        --arg secret_type "$rule_id" \
        --arg secret_hash "$secret_hash" \
        --argjson entropy "$(echo "$finding" | jq -r '.Entropy // 0')" \
        --arg severity "$severity" \
        --arg match_fingerprint "$match_fingerprint" \
        '{
            finding_id: $finding_id,
            file_path: $file_path,
            line_number: $line_number,
            end_line: $end_line,
            column_start: $column_start,
            column_end: $column_end,
            commit_hash: $commit_hash,
            author_hash: $author_hash,
            secret_type: $secret_type,
            secret_hash: $secret_hash,
            entropy: $entropy,
            severity: $severity,
            tags: (.Tags // []),
            match_fingerprint: $match_fingerprint
        }' >> "$TEMP_FINDINGS"
done

# Close JSON array
echo "]" >> "$TEMP_FINDINGS"

# Build final metadata JSON
timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

jq \
    --arg version "1.0.0" \
    --arg repo_name "${REPO_NAME:-unknown/unknown}" \
    --arg repo_owner "${REPO_OWNER:-unknown}" \
    --arg branch "${BRANCH:-main}" \
    --arg commit_hash "${COMMIT_HASH:-unknown}" \
    --arg trigger_type "${TRIGGER_TYPE:-unknown}" \
    --argjson pr_number "${PR_NUMBER:-null}" \
    --arg scan_timestamp "$timestamp" \
    --arg gitleaks_version "${GITLEAKS_VERSION:-unknown}" \
    --arg action_version "${ACTION_VERSION:-1.0.0}" \
    '. as $findings |
    {
        version: $version,
        scan_context: {
            repo_name: $repo_name,
            repo_owner: $repo_owner,
            branch: $branch,
            commit_hash: $commit_hash,
            trigger_type: $trigger_type,
            pr_number: $pr_number,
            scan_timestamp: $scan_timestamp,
            gitleaks_version: $gitleaks_version,
            action_version: $action_version
        },
        findings: $findings,
        summary: {
            total_findings: ($findings | length),
            by_severity: {
                critical: ([$findings[] | select(.severity == "critical")] | length),
                high: ([$findings[] | select(.severity == "high")] | length),
                medium: ([$findings[] | select(.severity == "medium")] | length),
                low: ([$findings[] | select(.severity == "low")] | length),
                info: 0
            },
            by_type: (
                [$findings[] | .secret_type] | 
                group_by(.) | 
                map({key: .[0], value: length}) | 
                from_entries
            ),
            unique_files: ([$findings[] | .file_path] | unique | length)
        }
    }' "$TEMP_FINDINGS" > "$METADATA_OUTPUT"

echo -e "${GREEN}✅ Metadata extracted successfully${NC}"

# Privacy validation
echo -e "${BLUE}🔒 Validating privacy compliance...${NC}"

prohibited_fields=("Secret" "Match" "Email" "code" "source_code" "line_content")
violations=0

for field in "${prohibited_fields[@]}"; do
    if jq -e ".. | objects | has(\"$field\")" "$METADATA_OUTPUT" > /dev/null 2>&1; then
        echo -e "${RED}❌ PRIVACY VIOLATION: Field '$field' found!${NC}" >&2
        violations=$((violations + 1))
    fi
done

if [ $violations -gt 0 ]; then
    echo -e "${RED}❌ Privacy validation FAILED${NC}" >&2
    exit 1
fi

echo -e "${GREEN}✅ Privacy validation passed${NC}"

# Print summary
total=$(jq -r '.summary.total_findings' "$METADATA_OUTPUT")
critical=$(jq -r '.summary.by_severity.critical' "$METADATA_OUTPUT")
high=$(jq -r '.summary.by_severity.high' "$METADATA_OUTPUT")
medium=$(jq -r '.summary.by_severity.medium' "$METADATA_OUTPUT")
low=$(jq -r '.summary.by_severity.low' "$METADATA_OUTPUT")

echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}📊 Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "Total Findings: ${YELLOW}$total${NC}"
echo -e "  🔴 Critical: $critical"
echo -e "  🟡 High: $high"
echo -e "  🟢 Medium: $medium"
echo -e "  🔵 Low: $low"
echo -e "${GREEN}✅ Privacy-safe metadata ready${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
