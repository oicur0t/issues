#!/bin/bash

#############################################################################
# Asset Phone-Home Script
#
# This script collects system information and reports it to the central
# asset tracking system.
#
# Usage:
#   ./phone-home.sh
#
# Configuration:
#   Set the following environment variables or edit the defaults below:
#   - PHONE_HOME_URL: The URL of the phone-home endpoint
#   - PHONE_HOME_API_KEY: The API key for authentication
#   - PHONE_HOME_PROVIDER: Cloud provider (AWS, DigitalOcean, etc.)
#   - PHONE_HOME_LOCATION: Location/region of this server
#
# Installation:
#   1. Copy this script to /usr/local/bin/phone-home.sh
#   2. chmod +x /usr/local/bin/phone-home.sh
#   3. Create /etc/phone-home.conf with API_KEY and URL
#   4. Add to cron: 0 * * * * /usr/local/bin/phone-home.sh
#
#############################################################################

# Default configuration
DEFAULT_URL="http://wopr:3000/api/v1/assets/phone-home"
CONFIG_FILE="/etc/phone-home.conf"

# Load configuration from file if it exists
if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
fi

# Environment variables override config file
PHONE_HOME_URL="${PHONE_HOME_URL:-${URL:-$DEFAULT_URL}}"
PHONE_HOME_API_KEY="${PHONE_HOME_API_KEY:-${API_KEY}}"
PHONE_HOME_PROVIDER="${PHONE_HOME_PROVIDER:-${PROVIDER:-Unknown}}"
PHONE_HOME_LOCATION="${PHONE_HOME_LOCATION:-${LOCATION}}"

# Check if API key is set
if [ -z "$PHONE_HOME_API_KEY" ]; then
    echo "Error: PHONE_HOME_API_KEY is not set"
    echo "Please set it in $CONFIG_FILE or as an environment variable"
    exit 1
fi

# Function to get primary IP address
get_primary_ip() {
    # Try to get the primary IP (the one used for internet access)
    ip -4 route get 8.8.8.8 2>/dev/null | grep -oP 'src \K\S+' || echo "unknown"
}

# Function to get all IP addresses
get_all_ips() {
    # Get all non-loopback IPv4 addresses
    ip -4 addr show | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v '^127\.' | jq -R . | jq -s .
}

# Function to get hostname
get_hostname() {
    hostname -f 2>/dev/null || hostname
}

# Function to get OS information
get_os_info() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        echo "$NAME"
    else
        uname -s
    fi
}

# Function to get OS version
get_os_version() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        echo "$VERSION"
    else
        uname -r
    fi
}

# Function to get kernel version
get_kernel() {
    uname -r
}

# Function to get architecture
get_architecture() {
    uname -m
}

# Function to get CPU model
get_cpu_model() {
    grep -m1 "model name" /proc/cpuinfo | cut -d':' -f2 | xargs
}

# Function to get CPU cores
get_cpu_cores() {
    nproc
}

# Function to get total memory
get_total_memory() {
    free -h | awk '/^Mem:/ {print $2}'
}

# Function to get disk space
get_disk_space() {
    df -h / | awk 'NR==2 {print $2 " total, " $3 " used, " $4 " available"}'
}

# Function to get uptime
get_uptime() {
    uptime -p 2>/dev/null || uptime | awk '{print $3 " " $4}'
}

# Collect system information
echo "Collecting system information..."

HOSTNAME=$(get_hostname)
IP_ADDRESSES=$(get_all_ips)
OS=$(get_os_info)
OS_VERSION=$(get_os_version)
KERNEL=$(get_kernel)
ARCHITECTURE=$(get_architecture)
CPU_MODEL=$(get_cpu_model)
CPU_CORES=$(get_cpu_cores)
TOTAL_MEMORY=$(get_total_memory)
DISK_SPACE=$(get_disk_space)
UPTIME=$(get_uptime)

# Build JSON payload
JSON_PAYLOAD=$(cat <<EOF
{
  "hostname": "$HOSTNAME",
  "ipAddresses": $IP_ADDRESSES,
  "os": "$OS",
  "osVersion": "$OS_VERSION",
  "kernel": "$KERNEL",
  "architecture": "$ARCHITECTURE",
  "cpuModel": "$CPU_MODEL",
  "cpuCores": $CPU_CORES,
  "totalMemory": "$TOTAL_MEMORY",
  "diskSpace": "$DISK_SPACE",
  "uptime": "$UPTIME",
  "provider": "$PHONE_HOME_PROVIDER",
  "location": "$PHONE_HOME_LOCATION"
}
EOF
)

# Send data to phone-home endpoint
echo "Sending data to $PHONE_HOME_URL..."

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$PHONE_HOME_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PHONE_HOME_API_KEY" \
  -d "$JSON_PAYLOAD")

# Extract HTTP status code (last line)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
# Extract response body (all but last line)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')

# Check response
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo "✓ Phone-home successful (HTTP $HTTP_CODE)"
    echo "Response: $RESPONSE_BODY"
    exit 0
else
    echo "✗ Phone-home failed (HTTP $HTTP_CODE)"
    echo "Response: $RESPONSE_BODY"
    exit 1
fi
