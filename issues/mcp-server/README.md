# Issue Tracker MCP Server

A Model Context Protocol (MCP) server that exposes Issue Tracker API functionality to AI agents like Claude Code and Goose.

## Features

### Complete API Coverage
- **Issues**: Create, read, update, delete, list with filtering, comments
- **Projects**: Full CRUD operations for project management
- **Users**: Read and update user information
- **Wiki**: Create and manage documentation pages
- **Comments**: Issue commenting system

### AI Agent Optimized
- **Rich filtering**: Filter issues by status, priority, assignee, tags, search
- **Workflow support**: Full issue status workflow (backlog → in_progress → blocked → fixed)
- **Resource access**: Direct access to issues, projects, and wiki pages as resources
- **Error handling**: Clear error messages for AI agent troubleshooting

### Claude Code & Goose Compatible
- Stdio transport for seamless integration
- Environment variable configuration
- Comprehensive tool descriptions
- Type-safe operations with Zod validation

## Installation

### Prerequisites
- Node.js 18+
- Issue Tracker API access with API key

### Setup

1. **Clone or navigate to the MCP server directory:**
   ```bash
   cd mcp-server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the server:**
   ```bash
   npm run build
   ```

## Configuration

Set the following environment variables:

```bash
# Required
export ISSUE_TRACKER_API_KEY="your_api_key_here"

# Optional
export ISSUE_TRACKER_BASE_URL="http://localhost:3000/api/v1"
export ISSUE_TRACKER_TIMEOUT="30000"
```

### Getting an API Key

1. Log in to your Issue Tracker instance
2. Go to Profile page
3. Generate or view your API key
4. Copy the key (starts with `iak_`)

## Usage

### With Claude Code

Add to your Claude Code configuration:

```json
{
  "mcpServers": {
    "issue-tracker": {
      "command": "node",
      "args": ["path/to/mcp-server/build/index.js"],
      "env": {
        "ISSUE_TRACKER_API_KEY": "your_api_key_here",
        "ISSUE_TRACKER_BASE_URL": "http://localhost:3000/api/v1"
      }
    }
  }
}
```

### With Goose

Add to your Goose configuration:

```json
{
  "extensions": [
    {
      "name": "issue-tracker-mcp",
      "type": "mcp",
      "config": {
        "command": "node",
        "args": ["path/to/mcp-server/build/index.js"],
        "env": {
          "ISSUE_TRACKER_API_KEY": "your_api_key_here",
          "ISSUE_TRACKER_BASE_URL": "http://localhost:3000/api/v1"
        }
      }
    }
  ]
}
```

## Available Tools

### Issue Management
- `list_issues` - List issues with filtering
- `get_issue` - Get detailed issue information
- `create_issue` - Create new issue
- `update_issue` - Update existing issue
- `delete_issue` - Delete issue
- `get_issue_comments` - Get issue comments
- `add_issue_comment` - Add comment to issue

Useful parameters: `list_issues` takes `featureId` (ID or number like `CUS-F001`); `create_issue` and `update_issue` take `featureId` to link an issue to a feature (`null` on update unlinks); `update_issue` takes `assigneeId: null` to unassign. Issue ids can be the ObjectId or the number (`ISS-014`).

### Work Claiming (for multiple agents)
- `get_next_work` - Get (and by default claim) the highest-priority unclaimed issue
- `claim_issue` - Claim a specific issue; fails if someone else holds it
- `release_issue` - Release your claim without closing the issue
- `get_my_work` - List your open assigned or claimed issues (resume after a restart)

Claims expire after `CLAIM_TTL_HOURS` (default 4) so abandoned work is re-offered.

### Asset Management
- `list_assets` - List assets with filtering
- `get_asset` - Get asset details
- `create_asset` - Create asset
- `update_asset` - Update asset
- `delete_asset` - Delete asset (prefer status `decommissioned`)
- `get_tailscale_sync_status` - Is Tailscale discovery configured, and how did the last sync go
- `sync_tailscale_assets` - Run the Tailscale discovery now

Store account names only in `accounts`, never passwords or keys. `customFields` (key/value pairs) holds anything else worth recording; same rule. `type` is free-form, but the Assets page groups by `physical server`, `virtual server`, `desktop`, `laptop`, `device` (in that order). Assets found by the Tailscale sync have a read-only `tailscale` section and may carry a `needsReview` flag, which any `update_asset` call clears. `update_asset` takes `cost: null` to clear the cost.

### Feature Management
- `list_features` - List features with filtering
- `get_feature` - Get feature details and progress (accepts ID or number like `CUS-F001`)
- `create_feature` - Create new feature
- `update_feature` - Update feature (status, owner, criteria, ...)
- `delete_feature` - Delete feature (linked issues are unlinked)
- `get_feature_issues` - List issues linked to a feature
- `link_issue_to_feature` / `unlink_issue_from_feature` - Manage links

### Project Management
- `list_projects` - List all projects
- `get_project` - Get project details
- `create_project` - Create new project
- `update_project` - Update project
- `delete_project` - Delete project

### User Management
- `list_users` - List all users
- `get_user` - Get user details

### Wiki Management
- `list_wiki_pages` - List wiki pages with filtering
- `get_wiki_page` - Get wiki page content
- `create_wiki_page` - Create new wiki page
- `update_wiki_page` - Update wiki page
- `delete_wiki_page` - Delete wiki page

## Setup notes for agents

- **Base URL:** the default is `http://localhost:3000/api/v1`. The provided compose file maps the app to port **3002**, so set `ISSUE_TRACKER_BASE_URL=http://localhost:3002/api/v1` (or whatever port you run on) in each client's MCP config.
- **One API key per agent.** Claims and assignment are per user, so agents sharing a key cannot lock each other out. Create a user and key per agent on the Users page.
- **Rebuild after updates.** `build/` is not in git. After pulling, run `npm run build` in `mcp-server/`, then fully restart each client (for Claude Desktop, quit it from the system tray, not just the window) so it loads the new tool list.
- **Check which build is live:** `GET /api/v1/version` returns the app's build number.

## Resources

Access data directly as MCP resources:

- `issue:///{issueId}` - Get issue as JSON
- `project:///{projectId}` - Get project as JSON  
- `wiki:///{slug}` - Get wiki page as JSON

## Example Workflows

### AI Agent Issue Management

```bash
# Find high-priority backend issues
list_issues(priority=["high", "critical"], tags=["backend"])

# Start working on an issue
update_issue(issueId="123", status="in_progress")

# Mark issue as fixed
update_issue(issueId="123", status="fixed")

# Add a comment about the fix
add_issue_comment(issueId="123", content="Fixed the database connection issue")
```

### Project Documentation

```bash
# Create project documentation
create_project(name="Mobile App", key="MOB", description="Customer mobile application")

# Create getting started guide
create_wiki_page(
  title="Getting Started",
  slug="getting-started", 
  content="# Getting Started\n\nWelcome to the project...",
  tags=["documentation", "onboarding"]
)
```

### Issue Triage

```bash
# List all backlog issues
list_issues(status=["backlog"])

# Review specific issue
get_issue(issueId="456")

# Assign to developer
update_issue(issueId="456", assigneeId="user123", priority="high")
```

## Development

### Project Structure
```
mcp-server/
├── src/
│   ├── index.ts      # Main MCP server
│   ├── client.ts     # API client
│   └── types.ts      # Type definitions
├── build/            # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

### Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Start the MCP server
- `npm run dev` - Build and start in development
- `npm run watch` - Watch for changes and rebuild

### Adding New Tools

1. Add API methods to `src/client.ts`
2. Create tool in `src/index.ts` using `server.tool()`
3. Define schema with Zod for validation
4. Handle errors gracefully
5. Update documentation

## API Compatibility

This MCP server leverages the complete Issue Tracker API:

- ✅ All CRUD operations for issues, projects, users, wiki
- ✅ Filtering and search capabilities  
- ✅ Comment system
- ✅ Status workflow management
- ✅ Tag-based organization
- ✅ Project-based issue organization

## Error Handling

The server provides clear error messages for:
- Authentication failures
- Invalid parameters
- Network issues
- API rate limits
- Missing permissions

## License

MIT License - see LICENSE file for details.
