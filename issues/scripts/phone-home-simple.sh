#!/usr/bin/env bash
set -e

# Phone-Home Script for Asset Tracking
# Simpler version with better compatibility

CONFIG_FILE="/etc/phone-home.conf"
DEFAULT_URL="http://wopr:3000/api/v1/assets/phone-home"

# Load config
if [ -f "$CONFIG_FILE" ]; then
    . "$CONFIG_FILE"
fi

URL="${PHONE_HOME_URL:-${URL:-$DEFAULT_URL}}"
API_KEY="${PHONE_HOME_API_KEY:-${API_KEY}}"

if [ -z "$API_KEY" ]; then
    echo "Error: API key not set. Please configure $CONFIG_FILE"
    exit 1
fi

# Collect system info
HOSTNAME=$(hostname -f 2>/dev/null || hostname)
OS=$(grep ^NAME= /etc/os-release 2>/dev/null | cut -d= -f2 | tr -d '"' || echo "Linux")
OS_VERSION=$(grep ^VERSION= /etc/os-release 2>/dev/null | cut -d= -f2 | tr -d '"' || echo "Unknown")
KERNEL=$(uname -r)
ARCH=$(uname -m)
CPU_MODEL=$(grep -m1 "model name" /proc/cpuinfo | cut -d: -f2 | sed 's/^[ \t]*//' || echo "Unknown")
CPU_CORES=$(nproc 2>/dev/null || echo "1")
TOTAL_MEM=$(free -h 2>/dev/null | awk '/^Mem:/ {print $2}' || echo "Unknown")
DISK=$(df -h / 2>/dev/null | awk 'NR==2 {print $2 " total, " $3 " used, " $4 " available"}' || echo "Unknown")
UPTIME=$(uptime -p 2>/dev/null || echo "Unknown")

# Get IP addresses (simple version)
IPS=$(ip -4 addr show 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v '^127\.' | head -5)
IP_JSON="["
FIRST=1
for ip in $IPS; do
    if [ $FIRST -eq 1 ]; then
        IP_JSON="${IP_JSON}\"$ip\""
        FIRST=0
    else
        IP_JSON="${IP_JSON}, \"$ip\""
    fi
done
IP_JSON="${IP_JSON}]"

# Build JSON using printf (more compatible)
JSON=$(printf '{
  "hostname": "%s",
  "ipAddresses": %s,
  "os": "%s",
  "osVersion": "%s",
  "kernel": "%s",
  "architecture": "%s",
  "cpuModel": "%s",
  "cpuCores": %s,
  "totalMemory": "%s",
  "diskSpace": "%s",
  "uptime": "%s",
  "provider": "%s",
  "location": "%s"
}' "$HOSTNAME" "$IP_JSON" "$OS" "$OS_VERSION" "$KERNEL" "$ARCH" "$CPU_MODEL" "$CPU_CORES" "$TOTAL_MEM" "$DISK" "$UPTIME" "${PROVIDER:-Unknown}" "${LOCATION:-}")

echo "Sending phone-home to $URL..."

# Send to server
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "$JSON" 2>&1)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo "✓ Success (HTTP $HTTP_CODE)"
    echo "$BODY"
    exit 0
else
    echo "✗ Failed (HTTP $HTTP_CODE)"
    echo "$BODY"
    exit 1
fi
