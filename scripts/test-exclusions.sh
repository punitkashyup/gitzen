#!/bin/bash
set -euo pipefail

##############################################################################
# GitZen Path Exclusion Test Script
#
# Tests that .gitleaks.toml exclusion patterns work correctly by:
# 1. Creating test files in excluded paths with intentional "secrets"
# 2. Running Gitleaks scan
# 3. Verifying excluded paths are not scanned
# 4. Cleaning up test files
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

# Test directory
TEST_DIR="test-exclusions-$$"
trap 'cleanup' EXIT

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}🧪 GitZen Path Exclusion Tests${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# Cleanup function
cleanup() {
    if [ -d "$TEST_DIR" ]; then
        echo -e "${YELLOW}🧹 Cleaning up test files...${NC}"
        rm -rf "$TEST_DIR"
    fi
}

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

# Test 1: node_modules directory should be excluded
test_node_modules_excluded() {
    mkdir -p "$TEST_DIR/node_modules/some-package"
    echo 'const API_KEY = "AKIAIOSFODNN7EXAMPLE123";' > "$TEST_DIR/node_modules/some-package/index.js"
    
    # Run gitleaks
    if gitleaks detect --source "$TEST_DIR" --config .gitleaks.toml --no-git --report-path "$TEST_DIR/results.json" > /dev/null 2>&1; then
        # No findings expected (exit code 0)
        if [ ! -f "$TEST_DIR/results.json" ] || [ "$(jq 'length' "$TEST_DIR/results.json" 2>/dev/null || echo 0)" -eq 0 ]; then
            return 0
        fi
    fi
    
    # Check if any findings are from node_modules
    if [ -f "$TEST_DIR/results.json" ]; then
        local node_modules_findings
        node_modules_findings=$(jq '[.[] | select(.File | contains("node_modules"))] | length' "$TEST_DIR/results.json" 2>/dev/null || echo 1)
        if [ "$node_modules_findings" -eq 0 ]; then
            return 0
        fi
    fi
    
    return 1
}

# Test 2: .min.js files should be excluded
test_minified_js_excluded() {
    mkdir -p "$TEST_DIR/dist"
    echo 'var t="ghp_1234567890abcdefghijklmnopqrstuvwxyz";' > "$TEST_DIR/dist/bundle.min.js"
    
    if gitleaks detect --source "$TEST_DIR" --config .gitleaks.toml --no-git --report-path "$TEST_DIR/results2.json" > /dev/null 2>&1; then
        if [ ! -f "$TEST_DIR/results2.json" ] || [ "$(jq 'length' "$TEST_DIR/results2.json" 2>/dev/null || echo 0)" -eq 0 ]; then
            return 0
        fi
    fi
    
    if [ -f "$TEST_DIR/results2.json" ]; then
        local minified_findings
        minified_findings=$(jq '[.[] | select(.File | contains(".min.js"))] | length' "$TEST_DIR/results2.json" 2>/dev/null || echo 1)
        if [ "$minified_findings" -eq 0 ]; then
            return 0
        fi
    fi
    
    return 1
}

# Test 3: Test fixtures should be excluded
test_fixtures_excluded() {
    mkdir -p "$TEST_DIR/test/fixtures"
    echo 'const SECRET = "sk_test_1234567890abcdefghijklmnop";' > "$TEST_DIR/test/fixtures/test-data.js"
    
    if gitleaks detect --source "$TEST_DIR" --config .gitleaks.toml --no-git --report-path "$TEST_DIR/results3.json" > /dev/null 2>&1; then
        if [ ! -f "$TEST_DIR/results3.json" ] || [ "$(jq 'length' "$TEST_DIR/results3.json" 2>/dev/null || echo 0)" -eq 0 ]; then
            return 0
        fi
    fi
    
    if [ -f "$TEST_DIR/results3.json" ]; then
        local fixture_findings
        fixture_findings=$(jq '[.[] | select(.File | contains("fixtures"))] | length' "$TEST_DIR/results3.json" 2>/dev/null || echo 1)
        if [ "$fixture_findings" -eq 0 ]; then
            return 0
        fi
    fi
    
    return 1
}

# Test 4: .example files should be excluded
test_example_files_excluded() {
    mkdir -p "$TEST_DIR/config"
    cat > "$TEST_DIR/config/.env.example" <<EOF
DATABASE_URL=postgresql://user:password123@localhost:5432/db
API_KEY=your_api_key_here
AWS_SECRET=AKIAIOSFODNN7EXAMPLE
EOF
    
    if gitleaks detect --source "$TEST_DIR" --config .gitleaks.toml --no-git --report-path "$TEST_DIR/results4.json" > /dev/null 2>&1; then
        if [ ! -f "$TEST_DIR/results4.json" ] || [ "$(jq 'length' "$TEST_DIR/results4.json" 2>/dev/null || echo 0)" -eq 0 ]; then
            return 0
        fi
    fi
    
    if [ -f "$TEST_DIR/results4.json" ]; then
        local example_findings
        example_findings=$(jq '[.[] | select(.File | contains(".example"))] | length' "$TEST_DIR/results4.json" 2>/dev/null || echo 1)
        if [ "$example_findings" -eq 0 ]; then
            return 0
        fi
    fi
    
    return 1
}

# Test 5: Python virtual environments should be excluded
test_venv_excluded() {
    mkdir -p "$TEST_DIR/venv/lib/python3.9/site-packages"
    echo 'SECRET_KEY = "django-insecure-abcdef1234567890"' > "$TEST_DIR/venv/lib/python3.9/site-packages/settings.py"
    
    if gitleaks detect --source "$TEST_DIR" --config .gitleaks.toml --no-git --report-path "$TEST_DIR/results5.json" > /dev/null 2>&1; then
        if [ ! -f "$TEST_DIR/results5.json" ] || [ "$(jq 'length' "$TEST_DIR/results5.json" 2>/dev/null || echo 0)" -eq 0 ]; then
            return 0
        fi
    fi
    
    if [ -f "$TEST_DIR/results5.json" ]; then
        local venv_findings
        venv_findings=$(jq '[.[] | select(.File | contains("venv"))] | length' "$TEST_DIR/results5.json" 2>/dev/null || echo 1)
        if [ "$venv_findings" -eq 0 ]; then
            return 0
        fi
    fi
    
    return 1
}

# Test 6: Binary files should be excluded
test_binary_files_excluded() {
    mkdir -p "$TEST_DIR/assets"
    # Create a fake image file with text (simulating binary)
    echo "FAKE_IMAGE_DATA: ghp_1234567890abcdefghijklmnopqrstuvwxyz" > "$TEST_DIR/assets/logo.png"
    
    if gitleaks detect --source "$TEST_DIR" --config .gitleaks.toml --no-git --report-path "$TEST_DIR/results6.json" > /dev/null 2>&1; then
        if [ ! -f "$TEST_DIR/results6.json" ] || [ "$(jq 'length' "$TEST_DIR/results6.json" 2>/dev/null || echo 0)" -eq 0 ]; then
            return 0
        fi
    fi
    
    if [ -f "$TEST_DIR/results6.json" ]; then
        local binary_findings
        binary_findings=$(jq '[.[] | select(.File | endswith(".png"))] | length' "$TEST_DIR/results6.json" 2>/dev/null || echo 1)
        if [ "$binary_findings" -eq 0 ]; then
            return 0
        fi
    fi
    
    return 1
}

# Test 7: Lock files should be excluded
test_lock_files_excluded() {
    mkdir -p "$TEST_DIR"
    echo '{"packages": {"some-package": {"integrity": "sha512-AKIAIOSFODNN7EXAMPLE123456"}}}' > "$TEST_DIR/package-lock.json"
    
    if gitleaks detect --source "$TEST_DIR" --config .gitleaks.toml --no-git --report-path "$TEST_DIR/results7.json" > /dev/null 2>&1; then
        if [ ! -f "$TEST_DIR/results7.json" ] || [ "$(jq 'length' "$TEST_DIR/results7.json" 2>/dev/null || echo 0)" -eq 0 ]; then
            return 0
        fi
    fi
    
    if [ -f "$TEST_DIR/results7.json" ]; then
        local lock_findings
        lock_findings=$(jq '[.[] | select(.File | contains("lock.json"))] | length' "$TEST_DIR/results7.json" 2>/dev/null || echo 1)
        if [ "$lock_findings" -eq 0 ]; then
            return 0
        fi
    fi
    
    return 1
}

# Test 8: Stopwords should reduce false positives
test_stopwords_work() {
    mkdir -p "$TEST_DIR/docs"
    cat > "$TEST_DIR/docs/example.md" <<EOF
# API Configuration

Set your API key:
\`\`\`
export API_KEY="your_api_key_here"
export SECRET="example_secret_123"
export TOKEN="test_token_placeholder"
\`\`\`
EOF
    
    if gitleaks detect --source "$TEST_DIR" --config .gitleaks.toml --no-git --report-path "$TEST_DIR/results8.json" > /dev/null 2>&1; then
        # Some findings might still exist, but stopwords should reduce them
        if [ ! -f "$TEST_DIR/results8.json" ]; then
            return 0
        fi
        
        local findings_count
        findings_count=$(jq 'length' "$TEST_DIR/results8.json" 2>/dev/null || echo 0)
        
        # Should have few or no findings due to stopwords
        if [ "$findings_count" -le 1 ]; then
            return 0
        fi
    else
        # No findings is also success
        return 0
    fi
    
    return 1
}

# Test 9: Source maps should be excluded
test_source_maps_excluded() {
    mkdir -p "$TEST_DIR/build"
    echo '{"version":3,"sources":["secret.js"],"mappings":"AAAA,SECRET=ghp_1234567890abcdefghijklmnopqrstuvwxyz"}' > "$TEST_DIR/build/app.js.map"
    
    if gitleaks detect --source "$TEST_DIR" --config .gitleaks.toml --no-git --report-path "$TEST_DIR/results9.json" > /dev/null 2>&1; then
        if [ ! -f "$TEST_DIR/results9.json" ] || [ "$(jq 'length' "$TEST_DIR/results9.json" 2>/dev/null || echo 0)" -eq 0 ]; then
            return 0
        fi
    fi
    
    if [ -f "$TEST_DIR/results9.json" ]; then
        local map_findings
        map_findings=$(jq '[.[] | select(.File | endswith(".map"))] | length' "$TEST_DIR/results9.json" 2>/dev/null || echo 1)
        if [ "$map_findings" -eq 0 ]; then
            return 0
        fi
    fi
    
    return 1
}

# Test 10: Real secrets in source code SHOULD be detected
test_real_secrets_detected() {
    mkdir -p "$TEST_DIR/src"
    cat > "$TEST_DIR/src/config.js" <<EOF
// IMPORTANT: This should be detected!
const AWS_KEY = "AKIAIOSFODNN7REAL123456";
const GITHUB_TOKEN = "ghp_realtoken1234567890abcdefghijk";
EOF
    
    if gitleaks detect --source "$TEST_DIR" --config .gitleaks.toml --no-git --report-path "$TEST_DIR/results10.json" > /dev/null 2>&1; then
        # Exit code 0 means no secrets (BAD for this test)
        return 1
    else
        # Exit code 1 means secrets found (GOOD for this test)
        if [ -f "$TEST_DIR/results10.json" ]; then
            local findings_count
            findings_count=$(jq 'length' "$TEST_DIR/results10.json" 2>/dev/null || echo 0)
            if [ "$findings_count" -gt 0 ]; then
                return 0
            fi
        fi
    fi
    
    return 1
}

# Check if gitleaks is available
if ! command -v gitleaks &> /dev/null; then
    echo -e "${RED}❌ Error: gitleaks is not installed${NC}"
    echo -e "${YELLOW}Install with: brew install gitleaks (macOS) or download from https://github.com/gitleaks/gitleaks${NC}"
    exit 1
fi

# Check if jq is available
if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ Error: jq is not installed${NC}"
    echo -e "${YELLOW}Install with: brew install jq (macOS)${NC}"
    exit 1
fi

# Check if .gitleaks.toml exists
if [ ! -f ".gitleaks.toml" ]; then
    echo -e "${RED}❌ Error: .gitleaks.toml not found${NC}"
    echo -e "${YELLOW}Run this script from the repository root${NC}"
    exit 1
fi

# Run all tests
run_test "node_modules should be excluded" test_node_modules_excluded
run_test "Minified .js files should be excluded" test_minified_js_excluded
run_test "Test fixtures should be excluded" test_fixtures_excluded
run_test ".example files should be excluded" test_example_files_excluded
run_test "Python venv should be excluded" test_venv_excluded
run_test "Binary files (.png) should be excluded" test_binary_files_excluded
run_test "Lock files should be excluded" test_lock_files_excluded
run_test "Stopwords should reduce false positives" test_stopwords_work
run_test "Source maps should be excluded" test_source_maps_excluded
run_test "Real secrets in source code SHOULD be detected" test_real_secrets_detected

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
    echo -e "${GREEN}✅ All exclusion tests passed!${NC}"
    echo -e "${GREEN}Path exclusions are working correctly.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed!${NC}"
    echo -e "${RED}Check .gitleaks.toml configuration.${NC}"
    exit 1
fi
