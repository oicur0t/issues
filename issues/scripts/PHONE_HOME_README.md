# Asset Phone-Home System

This system allows servers to automatically report their status and system information to the central Issue Tracker asset database.

## Overview

The phone-home system consists of:
1. **API Endpoint**: `/api/v1/assets/phone-home` - Receives asset check-ins
2. **Bash Script**: `phone-home.sh` - Collects and sends system information
3. **Cron Job**: Optional automated check-ins

## Setup Instructions

### 1. Generate an API Key

1. Log in to your Issue Tracker as an admin
2. Navigate to Admin > API Keys
3. Click "Create API Key"
4. Name: `Phone-Home Script`
5. Permissions: Select `assets:write`
6. Click "Create"
7. Copy the generated API key (you won't see it again!)

### 2. Install the Script on Ubuntu Server

```bash
# Download the script
sudo curl -o /usr/local/bin/phone-home.sh \
  https://your-domain.com/scripts/phone-home.sh

# Make it executable
sudo chmod +x /usr/local/bin/phone-home.sh

# Create configuration file
sudo nano /etc/phone-home.conf
```

Add the following to `/etc/phone-home.conf`:

```bash
URL="https://your-domain.com/api/v1/assets/phone-home"
API_KEY="your-api-key-here"
PROVIDER="DigitalOcean"  # or AWS, Azure, etc.
LOCATION="nyc3"          # or your server location
```

Save and exit (Ctrl+X, then Y, then Enter).

### 3. Test the Script

```bash
sudo /usr/local/bin/phone-home.sh
```

You should see:
```
Collecting system information...
Sending data to https://your-domain.com/api/v1/assets/phone-home...
✓ Phone-home successful (HTTP 200)
Response: {"message":"Asset created successfully",...}
```

### 4. Set Up Automatic Check-ins (Optional)

To have the server check in every hour:

```bash
# Edit root's crontab
sudo crontab -e
```

Add this line:
```
0 * * * * /usr/local/bin/phone-home.sh >> /var/log/phone-home.log 2>&1
```

This will:
- Run every hour (at minute 0)
- Log output to `/var/log/phone-home.log`

Alternative schedules:
- Every 6 hours: `0 */6 * * *`
- Every day at 2 AM: `0 2 * * *`
- Every 15 minutes: `*/15 * * * *`

## What Information is Collected

The script collects:

- **Hostname**: Fully qualified domain name
- **IP Addresses**: All non-loopback IPv4 addresses
- **Operating System**: Distribution name (e.g., "Ubuntu")
- **OS Version**: Version number
- **Kernel**: Kernel version
- **Architecture**: CPU architecture (e.g., "x86_64")
- **CPU Model**: Processor model name
- **CPU Cores**: Number of CPU cores
- **Total Memory**: Total RAM
- **Disk Space**: Root partition space (total/used/available)
- **Uptime**: How long the system has been running
- **Provider**: Cloud provider (from config)
- **Location**: Server location/region (from config)

## How it Works

1. **First Check-in**:
   - Script collects system information
   - Sends POST request to `/api/v1/assets/phone-home`
   - API creates a new asset with tag `auto-discovered`

2. **Subsequent Check-ins**:
   - API finds existing asset by hostname or IP
   - Updates asset information
   - Records `lastCheckIn` timestamp

3. **Asset Management**:
   - View assets in Issue Tracker under Assets
   - Auto-discovered assets are tagged: `auto-discovered`, `phone-home`
   - Edit asset details (name, project assignments, etc.)
   - Monitor last check-in time to detect offline servers

## Security Considerations

- **API Key Storage**: Store in `/etc/phone-home.conf` with permissions `600`
  ```bash
  sudo chmod 600 /etc/phone-home.conf
  ```

- **HTTPS**: Always use HTTPS for the phone-home URL in production

- **API Key Rotation**: Periodically rotate API keys and update all servers

- **Minimal Permissions**: API key only needs `assets:write` permission

## Troubleshooting

### "Error: PHONE_HOME_API_KEY is not set"

Make sure `/etc/phone-home.conf` exists and contains `API_KEY="..."`

### "Phone-home failed (HTTP 401)"

- Check that your API key is correct
- Verify the API key has `assets:write` permission
- Ensure the API key hasn't expired

### "Phone-home failed (HTTP 500)"

- Check the Issue Tracker server logs
- Verify MongoDB is running and accessible

### Script doesn't run from cron

- Check `/var/log/syslog` for cron errors
- Ensure script is executable: `ls -l /usr/local/bin/phone-home.sh`
- Verify cron syntax with `crontab -l`

### Missing jq error

The script requires `jq` for JSON handling:

```bash
sudo apt-get update
sudo apt-get install -y jq
```

## Deployment at Scale

For deploying to multiple servers:

### Using Ansible

```yaml
- name: Deploy phone-home script
  hosts: all
  become: yes
  tasks:
    - name: Install jq
      apt:
        name: jq
        state: present

    - name: Copy phone-home script
      copy:
        src: phone-home.sh
        dest: /usr/local/bin/phone-home.sh
        mode: '0755'

    - name: Create phone-home config
      template:
        src: phone-home.conf.j2
        dest: /etc/phone-home.conf
        mode: '0600'

    - name: Add cron job
      cron:
        name: "Asset phone-home"
        minute: "0"
        job: "/usr/local/bin/phone-home.sh >> /var/log/phone-home.log 2>&1"
```

### Using Chef/Puppet

Create a cookbook/module to:
1. Install dependencies (jq, curl)
2. Deploy the script
3. Create configuration file from template
4. Set up cron job

### Manual Deployment

Use a simple bash loop:

```bash
# servers.txt contains list of servers
while read server; do
  scp phone-home.sh root@$server:/usr/local/bin/
  scp phone-home.conf root@$server:/etc/
  ssh root@$server "chmod +x /usr/local/bin/phone-home.sh"
  ssh root@$server "chmod 600 /etc/phone-home.conf"
  ssh root@$server "echo '0 * * * * /usr/local/bin/phone-home.sh' | crontab -"
done < servers.txt
```

## API Reference

### Endpoint

```
POST /api/v1/assets/phone-home
```

### Headers

```
Content-Type: application/json
Authorization: Bearer <api-key>
```

### Request Body

```json
{
  "hostname": "web-server-01.example.com",
  "ipAddresses": ["10.0.1.15", "192.168.1.100"],
  "os": "Ubuntu",
  "osVersion": "22.04.3 LTS (Jammy Jellyfish)",
  "kernel": "5.15.0-91-generic",
  "architecture": "x86_64",
  "cpuModel": "Intel(R) Xeon(R) CPU E5-2680 v4 @ 2.40GHz",
  "cpuCores": 4,
  "totalMemory": "8.0Gi",
  "diskSpace": "50G total, 12G used, 36G available",
  "uptime": "up 3 weeks, 2 days",
  "provider": "DigitalOcean",
  "location": "nyc3"
}
```

### Response

**Success (200 OK or 201 Created):**

```json
{
  "message": "Asset created successfully",
  "asset": {
    "id": "507f1f77bcf86cd799439011",
    "hostname": "web-server-01.example.com",
    "name": "web-server-01.example.com",
    "lastCheckIn": "2025-01-01T00:00:00.000Z"
  }
}
```

**Error (401 Unauthorized):**

```json
{
  "error": "Unauthorized - Valid API key with assets:write permission required"
}
```

**Error (400 Bad Request):**

```json
{
  "error": "Bad request - Missing required field: hostname"
}
```

## License

This phone-home system is part of the Issue Tracker project and is licensed under the same MIT License.
