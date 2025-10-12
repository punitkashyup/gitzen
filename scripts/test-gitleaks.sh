#!/bin/bash

# Test script for Gitleaks configuration
# This creates test files with sample secrets to verify detection

set -e

echo "🧪 GitZen Secret Detection Test Suite"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create test directory
TEST_DIR="test-secrets"
rm -rf "$TEST_DIR"
mkdir -p "$TEST_DIR"

echo "📁 Creating test files with sample secrets..."

# Test 1: AWS Access Key
cat > "$TEST_DIR/aws-test.js" << 'EOF'
// Test file with AWS credentials
const AWS_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE";
const AWS_SECRET_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";
EOF

# Test 2: GitHub Token
cat > "$TEST_DIR/github-test.py" << 'EOF'
# Test file with GitHub token
GITHUB_TOKEN = "ghp_1234567890abcdefghijklmnopqrstuvwxyz"
EOF

# Test 3: API Key (using safe example patterns)
cat > "$TEST_DIR/api-test.ts" << 'EOF'
// Test file with API key patterns (not real keys)
const API_KEY = "sk_test_51234567890abcdefghijklmnop";  // Stripe test key pattern
const PUBLIC_KEY = "pk_test_51234567890abcdefghijklmnop";  // Safe public key
EOF

# Test 4: Private Key
cat > "$TEST_DIR/key-test.pem" << 'EOF'
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA1234567890abcdefghijklmnopqrstuvwxyz
-----END RSA PRIVATE KEY-----
EOF

# Test 5: Database Connection String
cat > "$TEST_DIR/db-test.env" << 'EOF'
DATABASE_URL=postgres://user:SuperSecret123@localhost:5432/mydb
REDIS_URL=redis://:MyRedisPassword@localhost:6379
EOF

# Test 6: Generic Password
cat > "$TEST_DIR/password-test.json" << 'EOF'
{
  "username": "admin",
  "password": "MySuper$ecretP@ssw0rd!",
  "api_token": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
}
EOF

# Test 7: False Positive (should be ignored)
cat > "$TEST_DIR/false-positive.js" << 'EOF'
// This should NOT be detected (example/dummy values)
const EXAMPLE_KEY = "your_api_key_here";
const TEST_SECRET = "dummy_secret_for_testing";
const PLACEHOLDER = "REPLACE_WITH_ACTUAL_KEY";
EOF

echo "✅ Test files created"
echo ""

# Check if Gitleaks is installed
if ! command -v gitleaks &> /dev/null; then
    echo "${RED}❌ Gitleaks not found${NC}"
    echo "Please install Gitleaks: https://github.com/gitleaks/gitleaks#installing"
    exit 1
fi

echo "🔍 Running Gitleaks scan..."
echo ""

# Run Gitleaks
SCAN_EXIT_CODE=0
gitleaks detect \
    --source="$TEST_DIR" \
    --config=".gitleaks.toml" \
    --report-format=json \
    --report-path="$TEST_DIR/results.json" \
    --verbose \
    --no-git || SCAN_EXIT_CODE=$?

echo ""
echo "📊 Scan Results"
echo "==============="

# Check if results file exists
if [ ! -f "$TEST_DIR/results.json" ]; then
    echo "${GREEN}✅ No secrets detected (all tests passed allowlist)${NC}"
    FINDINGS_COUNT=0
else
    # Count findings
    FINDINGS_COUNT=$(jq '. | length' "$TEST_DIR/results.json" 2>/dev/null || echo "0")
    
    if [ "$FINDINGS_COUNT" -eq 0 ]; then
        echo "${GREEN}✅ No secrets detected${NC}"
    else
        echo "${YELLOW}⚠️  Found $FINDINGS_COUNT potential secret(s)${NC}"
        echo ""
        echo "Detected Secrets:"
        echo "-----------------"
        
        # Display findings
        jq -r '.[] | "
File: \(.File)
Line: \(.StartLine)
Type: \(.RuleID)
Description: \(.Description)
---"' "$TEST_DIR/results.json"
    fi
fi

echo ""
echo "📋 Test Summary"
echo "==============="
echo "Test files created: 7"
echo "Expected detections: 6 (excluding false positives)"
echo "Actual detections: $FINDINGS_COUNT"

# Verify results
if [ "$FINDINGS_COUNT" -ge 5 ] && [ "$FINDINGS_COUNT" -le 7 ]; then
    echo ""
    echo "${GREEN}✅ Test PASSED${NC}"
    echo "Gitleaks configuration is working correctly!"
    EXIT_CODE=0
else
    echo ""
    echo "${RED}❌ Test FAILED${NC}"
    echo "Expected 5-7 findings, got $FINDINGS_COUNT"
    echo "Configuration may need adjustment"
    EXIT_CODE=1
fi

# Cleanup
echo ""
echo "🧹 Cleaning up test files..."
rm -rf "$TEST_DIR"
echo "✅ Cleanup complete"

echo ""
echo "======================================"
echo "Test completed with exit code: $EXIT_CODE"

exit $EXIT_CODE
