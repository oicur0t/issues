# Linear to Issues Migration State

**Date:** 2025-10-19
**Status:** PAUSED - Awaiting restart with Linear MCP

## What Happened

A power outage corrupted multiple configuration files, breaking:
1. MongoDB connection (docker-compose.yml lost environment variables)
2. Linear MCP configuration (.mcp.json lost Linear server config)
3. Migration was interrupted mid-process

## What Was Fixed

### 1. docker-compose.yml ✅
- **File:** `D:\docker\issues\issues\docker-compose.yml`
- **Added back MongoDB environment variables:**
  ```yaml
  - MONGODB_URI=mongodb+srv://cluster0.rrp7vpi.mongodb.net/issues?authSource=%24external&authMechanism=MONGODB-X509&retryWrites=true&w=majority&appName=Cluster0
  - MONGODB_CERT_PATH=/app/Certs/X509-cert-5964230336800025568.pem
  ```
- **Status:** Container restarted, MongoDB connection working ✅

### 2. .mcp.json ✅
- **File:** `C:\Users\james\Nextcloud\dev\.mcp.json`
- **Restored Linear MCP server configuration**
- **Action needed:** User must add `LINEAR_API_KEY` to the config
- **Status:** Configuration restored, awaiting API key ⏳

## Migration Progress

- **Total migrated:** 33 issues from Linear
- **Last issue:** APP-030 (Linear ID: WRA-60 - "Chart creation")
- **Migrated at:** 2025-10-19 21:43:56 UTC
- **Projects in DB:** 4
- **Team:** Wrangl
- **Next to migrate:** WRA-61 and onwards

## Issue Migration Format

Each migrated issue includes:
- Linear metadata in description (Original ID, Linear URL, Created by, Team, Git Branch, Created date)
- Tags: Original Linear ID (e.g., "WRA-60"), team name (e.g., "Wrangl"), "linear-migration"
- Project mapped based on Linear team/project structure

## Next Steps

1. ✅ Add LINEAR_API_KEY to `.mcp.json`
2. ✅ Restart Claude Code to load Linear MCP
3. ⏳ Resume migration from WRA-61 onwards using Linear MCP tools
4. ⏳ Query remaining Linear issues and continue importing

## Database State

- **Issues collection:** 33 documents
- **Projects collection:** 4 documents
- **MongoDB connection:** Working ✅
- **Issue Tracker API:** Working ✅

## Command to Resume Migration

After restart with Linear MCP loaded:
```
Continue the Linear migration from WRA-61 onwards.
Last migrated: APP-030 (WRA-60)
Status: 33 issues migrated, ready to continue
```
