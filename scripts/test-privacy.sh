#!/bin/bash
set -euo pipefail

##############################################################################
# GitZen Privacy Validation Test Script
#
# Tests that metadata extraction is truly privacy-safe and contains
# NO source code, secret values, or other sensitive information.
#
# This script creates test cases and validates the extraction process.
##############################################################################

# Color codes
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Test directories
TEST_DIR="$(mktemp -d)"
trap 'rm -rf "$TEST_DIR"' EXIT

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}🧪 GitZen Privacy Validation Tests${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# Helper function to run a test
run_test() {
    local test_name="$1"
    local test_func="$2"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    echo -e "${BLUE}▶ Test $TESTS_RUN: $test_name${NC}"
    
    if $test_func; then
        echo -e "${GREEN}  ✅ PASSED${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}  ❌ FAILED${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    echo ""
}

# Test 1: Verify no actual secrets in metadata
test_no_secrets_in_metadata() {
    # Create a fake Gitleaks result with a real-looking secret
    cat > "$TEST_DIR/results.json" <<EOF
[
  {
    "Description": "AWS Access Key",
    "StartLine": 15,
    "EndLine": 15,
    "StartColumn": 20,
    "EndColumn": 40,
    "Match": "AKIAIOSFODNN7EXAMPLE",
    "Secret": "AKIAIOSFODNN7EXAMPLE",
    "File": "src/config.js",
    "Commit": "a1b2c3d4e5f6",
    "Entropy": 3.5,
    "Author": "developer@example.com",
    "Email": "developer@example.com",
    "Date": "2023-10-13T10:00:00Z",
    "Message": "Add AWS config",
    "Tags": ["high", "aws"],
    "RuleID": "aws-access-token",
    "Fingerprint": "a1b2c3d4e5f6.src/config.js:aws-access-token:15"
  }
]
EOF
    
    # Run extraction
    export GITLEAKS_RESULTS="$TEST_DIR/results.json"
    export METADATA_OUTPUT="$TEST_DIR/metadata.json"
    export REPO_NAME="test/repo"
    export REPO_OWNER="test"
    export COMMIT_HASH="a1b2c3d4e5f6"
    
    bash scripts/extract-metadata.sh > /dev/null 2>&1 || return 1
    
    # Check that the actual secret value is NOT in the metadata
    if grep -q "AKIAIOSFODNN7EXAMPLE" "$METADATA_OUTPUT"; then
        echo -e "${RED}    ERROR: Actual secret found in metadata!${NC}" >&2
        return 1
    fi
    
    # Check that we have a hash instead
    if ! grep -q "sha256:" "$METADATA_OUTPUT"; then
        echo -e "${RED}    ERROR: No SHA-256 hash found in metadata!${NC}" >&2
        return 1
    fi
    
    return 0
}

# Test 2: Verify no email addresses in metadata
test_no_emails_in_metadata() {
    cat > "$TEST_DIR/results.json" <<EOF
[
  {
    "Description": "GitHub Token",
    "StartLine": 10,
    "EndLine": 10,
    "Match": "ghp_1234567890abcdefghijklmnopqrstuvwxyz",
    "Secret": "ghp_1234567890abcdefghijklmnopqrstuvwxyz",
    "File": "api/auth.py",
    "Commit": "b2c3d4e5f6a7",
    "Entropy": 4.2,
    "Author": "John Doe",
    "Email": "john.doe@company.com",
    "Date": "2023-10-13T11:00:00Z",
    "Message": "Add auth",
    "Tags": ["critical", "github"],
    "RuleID": "github-pat"
  }
]
EOF
    
    export GITLEAKS_RESULTS="$TEST_DIR/results.json"
    export METADATA_OUTPUT="$TEST_DIR/metadata.json"
    
    bash scripts/extract-metadata.sh > /dev/null 2>&1 || return 1
    
    # Check that email is NOT in metadata
    if grep -qi "john.doe@company.com" "$METADATA_OUTPUT"; then
        echo -e "${RED}    ERROR: Email address found in metadata!${NC}" >&2
        return 1
    fi
    
    # Check that we have an author_hash instead
    if ! jq -e '.findings[0].author_hash' "$METADATA_OUTPUT" > /dev/null 2>&1; then
        echo -e "${RED}    ERROR: No author_hash found in metadata!${NC}" >&2
        return 1
    fi
    
    # Verify it's a valid SHA-256 hash (64 hex chars)
    local author_hash
    author_hash=$(jq -r '.findings[0].author_hash' "$METADATA_OUTPUT")
    if ! [[ $author_hash =~ ^[0-9a-f]{64}$ ]]; then
        echo -e "${RED}    ERROR: author_hash is not a valid SHA-256 hash!${NC}" >&2
        return 1
    fi
    
    return 0
}

# Test 3: Verify prohibited fields are absent
test_no_prohibited_fields() {
    cat > "$TEST_DIR/results.json" <<EOF
[
  {
    "Description": "API Key",
    "StartLine": 42,
    "EndLine": 42,
    "Match": "api_key_12345678901234567890",
    "Secret": "api_key_12345678901234567890",
    "File": "config/api.yaml",
    "Commit": "c3d4e5f6a7b8",
    "Entropy": 3.8,
    "Author": "Jane Smith",
    "Email": "jane@example.com",
    "Date": "2023-10-13T12:00:00Z",
    "Message": "Update config",
    "Tags": ["medium", "api"],
    "RuleID": "generic-api-key"
  }
]
EOF
    
    export GITLEAKS_RESULTS="$TEST_DIR/results.json"
    export METADATA_OUTPUT="$TEST_DIR/metadata.json"
    
    bash scripts/extract-metadata.sh > /dev/null 2>&1 || return 1
    
    # List of prohibited fields
    local prohibited_fields=(
        "Secret"
        "Match"
        "Email"
        "Author"
        "code"
        "source_code"
        "line_content"
        "secret_value"
    )
    
    for field in "${prohibited_fields[@]}"; do
        # Check if field exists as a key in the JSON
        if jq -e ".. | objects | has(\"$field\")" "$METADATA_OUTPUT" > /dev/null 2>&1; then
            echo -e "${RED}    ERROR: Prohibited field '$field' found in metadata!${NC}" >&2
            return 1
        fi
    done
    
    return 0
}

# Test 4: Verify metadata structure matches schema
test_metadata_structure() {
    cat > "$TEST_DIR/results.json" <<EOF
[
  {
    "Description": "Private Key",
    "StartLine": 1,
    "EndLine": 5,
    "Match": "-----BEGIN RSA PRIVATE KEY-----",
    "Secret": "-----BEGIN RSA PRIVATE KEY-----",
    "File": "keys/id_rsa",
    "Commit": "d4e5f6a7b8c9",
    "Entropy": 5.0,
    "Email": "admin@example.com",
    "Date": "2023-10-13T13:00:00Z",
    "Tags": ["critical", "private-key"],
    "RuleID": "private-key"
  }
]
EOF
    
    export GITLEAKS_RESULTS="$TEST_DIR/results.json"
    export METADATA_OUTPUT="$TEST_DIR/metadata.json"
    export REPO_NAME="test/repo"
    export REPO_OWNER="test"
    
    bash scripts/extract-metadata.sh > /dev/null 2>&1 || return 1
    
    # Check required top-level fields
    if ! jq -e '.version' "$METADATA_OUTPUT" > /dev/null 2>&1; then
        echo -e "${RED}    ERROR: Missing 'version' field${NC}" >&2
        return 1
    fi
    
    if ! jq -e '.scan_context' "$METADATA_OUTPUT" > /dev/null 2>&1; then
        echo -e "${RED}    ERROR: Missing 'scan_context' field${NC}" >&2
        return 1
    fi
    
    if ! jq -e '.findings' "$METADATA_OUTPUT" > /dev/null 2>&1; then
        echo -e "${RED}    ERROR: Missing 'findings' field${NC}" >&2
        return 1
    fi
    
    if ! jq -e '.summary' "$METADATA_OUTPUT" > /dev/null 2>&1; then
        echo -e "${RED}    ERROR: Missing 'summary' field${NC}" >&2
        return 1
    fi
    
    # Check finding structure
    if ! jq -e '.findings[0].finding_id' "$METADATA_OUTPUT" > /dev/null 2>&1; then
        echo -e "${RED}    ERROR: Missing 'finding_id' in finding${NC}" >&2
        return 1
    fi
    
    if ! jq -e '.findings[0].secret_hash' "$METADATA_OUTPUT" > /dev/null 2>&1; then
        echo -e "${RED}    ERROR: Missing 'secret_hash' in finding${NC}" >&2
        return 1
    fi
    
    # Verify secret_hash format (should be "sha256:...")
    local secret_hash
    secret_hash=$(jq -r '.findings[0].secret_hash' "$METADATA_OUTPUT")
    if ! [[ $secret_hash =~ ^sha256:[0-9a-f]{64}$ ]]; then
        echo -e "${RED}    ERROR: secret_hash format is incorrect: $secret_hash${NC}" >&2
        return 1
    fi
    
    return 0
}

# Test 5: Verify empty results handling
test_empty_results() {
    echo '[]' > "$TEST_DIR/results.json"
    
    export GITLEAKS_RESULTS="$TEST_DIR/results.json"
    export METADATA_OUTPUT="$TEST_DIR/metadata.json"
    export REPO_NAME="test/repo"
    
    bash scripts/extract-metadata.sh > /dev/null 2>&1 || return 1
    
    # Check that metadata was created
    if [ ! -f "$METADATA_OUTPUT" ]; then
        echo -e "${RED}    ERROR: Metadata file was not created${NC}" >&2
        return 1
    fi
    
    # Check that total_findings is 0
    local total
    total=$(jq -r '.summary.total_findings' "$METADATA_OUTPUT")
    if [ "$total" != "0" ]; then
        echo -e "${RED}    ERROR: Expected 0 findings, got $total${NC}" >&2
        return 1
    fi
    
    return 0
}

# Test 6: Verify severity classification
test_severity_classification() {
    cat > "$TEST_DIR/results.json" <<EOF
[
  {
    "Description": "Critical Secret",
    "StartLine": 1,
    "Match": "secret1",
    "Secret": "secret1",
    "File": "file1.js",
    "Commit": "abc123",
    "Tags": ["critical"],
    "RuleID": "rule1"
  },
  {
    "Description": "High Secret",
    "StartLine": 2,
    "Match": "secret2",
    "Secret": "secret2",
    "File": "file2.js",
    "Commit": "abc124",
    "Tags": ["high"],
    "RuleID": "rule2"
  },
  {
    "Description": "Medium Secret",
    "StartLine": 3,
    "Match": "secret3",
    "Secret": "secret3",
    "File": "file3.js",
    "Commit": "abc125",
    "Tags": ["medium"],
    "RuleID": "rule3"
  }
]
EOF
    
    export GITLEAKS_RESULTS="$TEST_DIR/results.json"
    export METADATA_OUTPUT="$TEST_DIR/metadata.json"
    
    bash scripts/extract-metadata.sh > /dev/null 2>&1 || return 1
    
    # Verify severity counts
    local critical
    critical=$(jq -r '.summary.by_severity.critical' "$METADATA_OUTPUT")
    if [ "$critical" != "1" ]; then
        echo -e "${RED}    ERROR: Expected 1 critical, got $critical${NC}" >&2
        return 1
    fi
    
    local high
    high=$(jq -r '.summary.by_severity.high' "$METADATA_OUTPUT")
    if [ "$high" != "1" ]; then
        echo -e "${RED}    ERROR: Expected 1 high, got $high${NC}" >&2
        return 1
    fi
    
    local medium
    medium=$(jq -r '.summary.by_severity.medium' "$METADATA_OUTPUT")
    if [ "$medium" != "1" ]; then
        echo -e "${RED}    ERROR: Expected 1 medium, got $medium${NC}" >&2
        return 1
    fi
    
    return 0
}

# Test 7: Verify hash consistency
test_hash_consistency() {
    cat > "$TEST_DIR/results.json" <<EOF
[
  {
    "Description": "Test Secret",
    "StartLine": 10,
    "Match": "test_secret_value",
    "Secret": "test_secret_value",
    "File": "test.js",
    "Commit": "test123",
    "Email": "test@example.com",
    "Tags": ["medium"],
    "RuleID": "test-rule"
  }
]
EOF
    
    export GITLEAKS_RESULTS="$TEST_DIR/results.json"
    export METADATA_OUTPUT="$TEST_DIR/metadata.json"
    
    # Run extraction twice
    bash scripts/extract-metadata.sh > /dev/null 2>&1 || return 1
    local hash1
    hash1=$(jq -r '.findings[0].secret_hash' "$METADATA_OUTPUT")
    
    bash scripts/extract-metadata.sh > /dev/null 2>&1 || return 1
    local hash2
    hash2=$(jq -r '.findings[0].secret_hash' "$METADATA_OUTPUT")
    
    # Hashes should be identical for same input
    if [ "$hash1" != "$hash2" ]; then
        echo -e "${RED}    ERROR: Hashes are not consistent: $hash1 vs $hash2${NC}" >&2
        return 1
    fi
    
    return 0
}

# Run all tests
run_test "No actual secrets in metadata" test_no_secrets_in_metadata
run_test "No email addresses in metadata" test_no_emails_in_metadata
run_test "No prohibited fields in metadata" test_no_prohibited_fields
run_test "Metadata structure is correct" test_metadata_structure
run_test "Empty results are handled correctly" test_empty_results
run_test "Severity classification is accurate" test_severity_classification
run_test "Hashes are consistent" test_hash_consistency

# Print summary
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}📊 Test Results${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "Tests Run: $TESTS_RUN"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
if [ $TESTS_FAILED -gt 0 ]; then
    echo -e "${RED}Failed: $TESTS_FAILED${NC}"
else
    echo -e "Failed: $TESTS_FAILED"
fi
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All privacy validation tests passed!${NC}"
    echo -e "${GREEN}Metadata extraction is privacy-safe.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed!${NC}"
    echo -e "${RED}Privacy validation issues detected.${NC}"
    exit 1
fi
