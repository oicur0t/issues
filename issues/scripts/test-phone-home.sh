#!/bin/bash

#############################################################################
# Test Script for Phone-Home Endpoint
#
# This script tests the phone-home endpoint with sample data
#############################################################################

# Configuration
URL="${PHONE_HOME_URL:-http://localhost:3000/api/v1/assets/phone-home}"
API_KEY="${PHONE_HOME_API_KEY}"

if [ -z "$API_KEY" ]; then
    echo "Error: PHONE_HOME_API_KEY environment variable is not set"
    echo "Usage: PHONE_HOME_API_KEY=your-key ./test-phone-home.sh"
    exit 1
fi

# Sample test data
JSON_PAYLOAD='{
  "hostname": "test-server-01.local",
  "ipAddresses": ["192.168.1.100", "10.0.0.50"],
  "os": "Ubuntu",
  "osVersion": "22.04.3 LTS (Jammy Jellyfish)",
  "kernel": "5.15.0-91-generic",
  "architecture": "x86_64",
  "cpuModel": "Intel(R) Core(TM) i7-9750H CPU @ 2.60GHz",
  "cpuCores": 4,
  "totalMemory": "16Gi",
  "diskSpace": "256G total, 128G used, 128G available",
  "uptime": "up 1 week, 3 days",
  "provider": "Test",
  "location": "Local"
}'

echo "Testing phone-home endpoint..."
echo "URL: $URL"
echo ""
echo "Sending test data..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "$JSON_PAYLOAD")

# Extract HTTP status code (last line)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
# Extract response body (all but last line)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')

echo "HTTP Status: $HTTP_CODE"
echo "Response:"
echo "$RESPONSE_BODY" | jq . 2>/dev/null || echo "$RESPONSE_BODY"

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo ""
    echo "✓ Test successful!"
    exit 0
else
    echo ""
    echo "✗ Test failed!"
    exit 1
fi
