#!/bin/bash
# Test script for Gitzen API endpoints

echo "=== Testing Gitzen API Endpoints ==="
echo ""

echo "1. Testing Health Check Endpoint:"
curl -s http://localhost:8000/health | python3 -m json.tool
echo ""

echo "2. Testing Root Endpoint:"
curl -s http://localhost:8000/ | python3 -m json.tool
echo ""

echo "3. Testing API Findings Endpoint (placeholder):"
curl -s http://localhost:8000/api/v1/findings | python3 -m json.tool
echo ""

echo "4. Testing API Repositories Endpoint (placeholder):"
curl -s http://localhost:8000/api/v1/repositories | python3 -m json.tool
echo ""

echo "5. Testing OpenAPI Docs (should return HTML):"
curl -s -I http://localhost:8000/docs | head -n 1
echo ""

echo "=== All tests complete ==="
