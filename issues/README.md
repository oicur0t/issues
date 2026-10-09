# Issue Tracker

A production-ready internal issue tracking system built with Next.js 15, TypeScript, and MongoDB Atlas. Designed for rapid iteration with a clean architecture that can easily be extended with AI agent integrations.

## 🚀 Features

### Issue Tracking
- ✅ Full CRUD operations for issues
- ✅ Issue listing with filtering and search
- ✅ Individual issue view with edit capability
- ✅ Status workflow (Backlog, In Progress, Blocked, Fixed, Won't Fix)
- ✅ Priority levels (Low, Medium, High, Critical)
- ✅ Issue assignment to team members (and unassigning)
- ✅ Tag-based categorization
- ✅ Project-scoped readable numbers (`ISS-014`); URLs work with the number or the id
- ✅ **Claim lock** for multiple agents: claim an issue so nobody else works on it (see [Working with AI agents](#-working-with-ai-agents))
- ✅ Optional link to a feature

### Feature Tracking
- ✅ Project-scoped features with readable IDs (e.g. `CUS-F001`)
- ✅ Status workflow (Proposed, Planned, In Progress, Shipped, Dropped)
- ✅ Link issues to a feature; progress is calculated from linked issues
- ✅ Acceptance criteria, owner, target date, optional wiki spec link
- ✅ REST API (`/api/v1/features`) and MCP tools (`list_features`, `create_feature`, ...)
- Run `node scripts/add-feature-indexes.js` once to create the recommended indexes

### Asset Tracking
- ✅ Infrastructure inventory: hosts, servers, desktops, laptops, devices, containers, integrations
- ✅ Assets page **grouped by type**: physical server, virtual server, desktop, laptop, device, then other types, then unclassified
- ✅ Editable in the UI (Edit button on the asset page): provider, location, cost, notes, tags, accounts (names only), project links with roles, and free-form **custom fields**
- ✅ **Tailscale discovery**: pulls tailnet devices into Assets, links existing assets instead of duplicating them, and warns about expired keys, offline hosts and updates. The Tailscale details are read-only. See [docs/TAILSCALE_SYNC.md](docs/TAILSCALE_SYNC.md)
- ✅ New hosts found by the sync show **Needs review** until you save them or press **Mark reviewed**
- ✅ Phone-home endpoint for hosts to check in (`POST /api/v1/assets/phone-home`)
- ✅ REST API (`/api/v1/assets`) and MCP tools (`list_assets`, `update_asset`, `sync_tailscale_assets`, ...)

### Wiki/Documentation Repository
- ✅ Store and display markdown files
- ✅ CRUD operations for wiki pages
- ✅ Slug-based URLs (/wiki/[slug])
- ✅ Markdown rendering with syntax highlighting
- ✅ Search across wiki pages
- ✅ Tag-based organization

### User Management
- ✅ Simple user model (name, email, role)
- ✅ Mock authentication system (easily replaceable)
- ✅ Role-based access control (Admin, Developer, Viewer)
- ✅ Assignment of issues to users

## 🛠 Tech Stack

- **Frontend**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB Atlas with native driver
- **Styling**: Tailwind CSS
- **Deployment**: Docker (Windows compatible)
- **Authentication**: Mock system (ready for real auth integration)

## 📋 Prerequisites

- Node.js 18+ 
- Docker & Docker Compose (for containerized deployment)
- MongoDB Atlas account (for cloud deployment) or local MongoDB

## 🚀 Quick Start

### Option 1: Docker Deployment (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd issue-tracker
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   
   **For local MongoDB:**
   ```env
   MONGODB_URI=mongodb://localhost:27017/issue-tracker
   NEXTAUTH_SECRET=your-secret-key-change-this-in-production
   NEXTAUTH_URL=http://localhost:3000
   ```
   
   **For MongoDB Atlas with X.509 Certificate:**
   ```env
   MONGODB_URI=mongodb+srv://cluster0.rrp7vpi.mongodb.net/?authSource=%24external&authMechanism=MONGODB-X509&retryWrites=true&w=majority&appName=Cluster0
   MONGODB_CERT_PATH=./Certs/X509-cert-5964230336800025568.pem
   NEXTAUTH_SECRET=your-secret-key-change-this-in-production
   NEXTAUTH_URL=http://localhost:3000
   ```

3. **Check for port conflicts before starting**

   The default host port is `3000`. If another service is already using it (e.g. Perplexica), update the port mapping in `docker-compose.yml` before starting:
   ```yaml
   ports:
     - "3002:3000"  # change 3002 to any free host port
   ```
   Check what's in use: `ss -tlnp | awk '{print $4}'`

   On wopr-wsl ports 3000 and 3001 are taken — use **3002**.

4. **Start with Docker Compose** (use `sudo` on wopr-wsl)
   ```bash
   sudo podman-compose up -d
   ```

5. **Access the application**
   - Application: http://localhost:3002 (or whichever port you mapped above)

5. **Test MongoDB Connection (Recommended)**
   ```bash
   npm run test:mongodb
   ```
   This will verify your MongoDB connection works before starting the application.

6. **Login with demo accounts**
   - Admin: `admin@example.com` / `admin123`
   - Developer: `dev@example.com` / `dev123`
   - Viewer: `viewer@example.com` / `viewer123`

### Option 2: Quick Local Testing (Same Atlas DB as Production)

**⚡ Fast iteration without Docker rebuilds!**

Use these scripts to run locally while connected to the same Atlas database as dev-wrangl. Perfect for rapid testing of changes before deploying to Docker.

**Prerequisites:**

- Node.js 18+
- MongoDB X.509 certificate in `./Certs/` directory
- Certificate file: `X509-cert-5964230336800025568.pem`

**Windows (PowerShell):**

```powershell
.\dev-local.ps1
```

**Linux/Mac (Bash):**

```bash
chmod +x dev-local.sh
./dev-local.sh
```

**What these scripts do:**

- Install dependencies if needed
- Set environment variables for Atlas connection
- Use X.509 certificate authentication
- Start Next.js dev server on <http://localhost:3000>
- Connect to the same database as dev-wrangl deployment

**Benefits:**

- ✅ Instant hot reload for fast development
- ✅ No Docker rebuild time (2-3 minute savings per test)
- ✅ Same database as production for realistic testing
- ✅ Full Next.js dev mode features (better error messages, fast refresh)

**Note:** Changes are immediately reflected on save. Perfect for UI tweaks, bug fixes, and feature testing.

### Option 3: Local Development (Custom Configuration)

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Configure your MongoDB connection in `.env`:
   
   **For regular MongoDB Atlas connection:**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/issue-tracker
   NEXTAUTH_SECRET=your-secret-key-change-this-in-production
   NEXTAUTH_URL=http://localhost:3000
   ```
   
   **For MongoDB Atlas with X.509 Certificate:**
   ```env
   MONGODB_URI=mongodb+srv://cluster0.rrp7vpi.mongodb.net/?authSource=%24external&authMechanism=MONGODB-X509&retryWrites=true&w=majority&appName=Cluster0
   MONGODB_CERT_PATH=./Certs/X509-cert-5964230336800025568.pem
   NEXTAUTH_SECRET=your-secret-key-change-this-in-production
   NEXTAUTH_URL=http://localhost:3000
   ```

3. **Test MongoDB Connection (Recommended)**
   ```bash
   npm run test:mongodb
   ```
   This will verify your MongoDB connection works before starting the application.

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   Open http://localhost:3000 in your browser

## 📁 Project Structure

```
issue-tracker/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   │   ├── login/               # Login page
│   │   └── logout/              # Logout action
│   ├── issues/                  # Issue management
│   │   ├── actions.ts           # Issue Server Actions
│   │   ├── components/          # Issue components
│   │   ├── page.tsx             # Issues listing
│   │   ├── new/                 # Create issue
│   │   └── [id]/                # Issue detail/edit
│   ├── features/                # Feature tracking (actions, components, pages)
│   ├── assets/                  # Asset tracking, Tailscale sync UI and actions
│   ├── api/v1/                  # REST API (issues, features, assets, projects, users, wiki, version)
│   ├── wiki/                    # Wiki system
│   │   ├── actions.ts           # Wiki Server Actions
│   │   ├── components/          # Wiki components
│   │   ├── page.tsx             # Wiki listing
│   │   ├── new/                 # Create wiki page
│   │   └── [slug]/              # Wiki page view/edit
│   ├── users/                   # User management
│   │   ├── actions.ts           # User Server Actions
│   │   └── page.tsx             # Users listing
│   ├── components/              # Shared components
│   │   ├── ui/                  # UI components
│   │   ├── Navigation.tsx       # Main navigation
│   │   └── UserProvider.tsx     # User context provider
│   ├── globals.css              # Global styles
│   └── layout.tsx               # Root layout
├── lib/                         # Library files
│   ├── auth.ts                  # Authentication logic
│   ├── mongodb.ts               # MongoDB connection
│   ├── utils.ts                 # Utility functions
│   ├── claims.ts                # Issue claim expiry
│   ├── asset-types.ts           # Assets page grouping
│   ├── tailscale-*.ts           # Tailscale API client, sync planner, runner, scheduler
│   └── types/                   # TypeScript type definitions
├── mcp-server/                  # MCP server for AI agents (separate build, see its README)
├── tests/                       # Unit tests (npm test) and fixtures
├── docs/                        # Specs and operations docs
├── scripts/                     # DB scripts, sync.sh and deploy.sh
├── instrumentation.ts           # Starts the Tailscale background sync
├── BUILD_NUMBER                 # Build number shown in the UI, bumped by scripts/sync.sh
├── public/                      # Static assets
├── Dockerfile                   # Docker configuration
├── docker-compose.yml           # Docker Compose setup
├── mongo-init.js               # MongoDB initialization
├── next.config.js              # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies and scripts
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Database
# For local MongoDB:
MONGODB_URI=mongodb://localhost:27017/issue-tracker

# For MongoDB Atlas with X.509 Certificate:
# MONGODB_URI=mongodb+srv://cluster0.rrp7vpi.mongodb.net/?authSource=%24external&authMechanism=MONGODB-X509&retryWrites=true&w=majority&appName=Cluster0
# MONGODB_CERT_PATH=./Certs/X509-cert-5964230336800025568.pem

# For regular MongoDB Atlas connection:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/issue-tracker

# Authentication
NEXTAUTH_SECRET=your-secret-key-change-this-in-production
NEXTAUTH_URL=http://localhost:3000
```

### Optional environment variables

```env
# Tailscale host discovery (see docs/TAILSCALE_SYNC.md). Needs an OAuth client with the
# read-only devices:core:read scope; the secret starts with tskey-client-
TAILSCALE_OAUTH_CLIENT_ID=
TAILSCALE_OAUTH_CLIENT_SECRET=
TAILSCALE_SYNC_INTERVAL_MINUTES=60     # 0 disables the schedule ("Sync now" still works)
TAILSCALE_KEY_EXPIRY_WARN_DAYS=14
TAILSCALE_OFFLINE_HOURS=24

# Issue claims expire so abandoned work is re-offered to other agents
CLAIM_TTL_HOURS=4
```

The container reads the mounted `.env` at startup, so after changing it restart the container (no rebuild needed).

### MongoDB Setup

#### Local MongoDB (Docker)
The included `docker-compose.yml` sets up MongoDB with:
- Database: `issue-tracker`
- Admin user: `admin` / `password123`
- Demo data automatically populated

#### MongoDB Atlas (Production)

**Option 1: Regular Connection**
1. Create a free MongoDB Atlas account
2. Create a new cluster
3. Add your IP to the whitelist
4. Create a database user
5. Get your connection string and update `MONGODB_URI`

**Option 2: X.509 Certificate Authentication**
1. Create a free MongoDB Atlas account
2. Create a new cluster
3. Set up X.509 certificate authentication in Atlas
4. Download your certificate file to the `Certs/` directory
5. Update your `.env` file with:
   ```env
   MONGODB_URI=mongodb+srv://cluster0.rrp7vpi.mongodb.net/?authSource=%24external&authMechanism=MONGODB-X509&retryWrites=true&w=majority&appName=Cluster0
   MONGODB_CERT_PATH=./Certs/X509-cert-5964230336800025568.pem
   ```
6. Ensure the certificate file is accessible and readable by the application

## 🏗 Architecture

### Server Actions
The application uses Next.js Server Actions for all data mutations instead of traditional API routes:

```typescript
// Example: Creating an issue
export async function createIssue(data: CreateIssueData) {
  // Server-side validation
  // Database operation
  // Cache invalidation
  revalidatePath('/issues')
}
```

### Database Connection
MongoDB connection uses a singleton pattern for proper connection pooling:

```typescript
// lib/mongodb.ts
let cached = global.mongo

if (!cached) {
  cached = global.mongo = { conn: null, promise: null }
}
```

### Type Safety
Comprehensive TypeScript interfaces for all data models:

```typescript
// lib/types/issue.ts
export interface Issue {
  _id: ObjectId
  title: string
  description: string
  status: IssueStatus
  priority: IssuePriority
  assignee?: ObjectId
  tags: string[]
  createdBy: ObjectId
  createdAt: Date
  updatedAt: Date
}
```

## 🚀 Deployment

### Releasing with the scripts (Podman in WSL)

The live app runs as `issues_app_1` (image `localhost/issues_app`) on port 3002. From the project folder in WSL:

```bash
bash scripts/deploy.sh
```

It does, in order:
1. `scripts/sync.sh`: adds 1 to `BUILD_NUMBER`, commits it and pushes to GitHub (so GitHub always has what is deployed). Commit your work first; uncommitted changes are listed but not included.
2. Tags the running image as `localhost/issues_app:build-<previous>` (your rollback point).
3. Rebuilds the image, then `down` + `up -d --no-build` (a plain `up --build` does not replace the running container).
4. Checks `GET /api/v1/version` and fails loudly if the new build is not live.

The build number is shown at the bottom of the sidebar and returned by `GET /api/v1/version` (no login needed).

**Roll back:**
```bash
sudo podman tag localhost/issues_app:build-<N> localhost/issues_app:latest
sudo podman-compose down && sudo podman-compose up -d --no-build
```
Nothing is migrated on startup, so a rollback needs no data cleanup; fields added by newer builds are ignored by older ones.

After pulling a release that changes the MCP server, rebuild it (`cd mcp-server && npm run build`; `build/` is not in git) and restart each client's MCP connection.

### Docker Deployment (Production)

1. **Build and deploy**
   ```bash
   docker-compose -f docker-compose.yml up -d --build
   ```

2. **Configure production environment**
   - Update `MONGODB_URI` to your production MongoDB
   - Set a strong `NEXTAUTH_SECRET`
   - Update `NEXTAUTH_URL` to your domain

3. **Scale with Docker Swarm or Kubernetes**
   The Docker setup is designed to be easily scalable

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

## 🔐 Authentication

The application includes a mock authentication system that can easily be replaced with a real authentication provider:

### Current Mock System
- Email/password authentication
- Session management
- Role-based access control
- Demo accounts for testing

### Upgrading to Real Authentication
1. Replace `lib/auth.ts` with your preferred auth provider
2. Update login form in `app/(auth)/login/page.tsx`
3. Configure session management
4. Update user model as needed

## 🎨 Customization

### Adding New Features
The architecture is designed for easy extension:

1. **New data models**: Add to `lib/types/`
2. **Server Actions**: Create in `app/[feature]/actions.ts`
3. **Components**: Add to `app/[feature]/components/`
4. **Pages**: Add to `app/[feature]/page.tsx`

### Styling
- Uses Tailwind CSS with custom design tokens
- CSS variables defined in `app/globals.css`
- Component styles in respective component files

### Database Schema
- MongoDB collections with validation schemas
- Indexes for performance
- Migration scripts in `mongo-init.js`

## 🤖 Working with AI agents

The tracker is built to be used by a small team of humans plus AI developers and an AI PM, through the REST API or the MCP server (`mcp-server/`, see its README for tools and setup).

**Give every agent its own user and API key.** Claims, assignment and attribution are per user; agents sharing one key would look like one person.

**Typical agent loop**
1. `get_next_work`: returns the highest-priority unclaimed backlog issue (oldest first), moves it to In Progress, assigns it to the agent if unassigned, and **claims** it. Optionally scoped to a project or feature.
2. Work on it; call `claim_issue` again on long tasks to refresh the claim.
3. `update_issue` to `fixed` / `wont_fix` when done (closing releases the claim), or `release_issue` to hand it back.
4. After a restart, `get_my_work` lists the agent's open assigned or claimed issues.

**Rules**
- A claim expires after `CLAIM_TTL_HOURS` (default 4), after which the issue is offered again, so a crashed agent cannot hold work forever.
- Claiming someone else's live claim fails with HTTP 409 naming the holder.
- `get_next_work` never hands an agent an issue assigned to someone else.

**REST equivalents:** `POST /api/v1/issues/{id}/claim`, `DELETE /api/v1/issues/{id}/claim`, `GET|POST /api/v1/issues/next`, `GET /api/v1/issues?mine=true`.

Features group issues: `list_features` / `get_feature` show progress (done / total linked issues), and `GET /api/v1/issues?featureId=CUS-F001` lists what is left on one.

## 🧪 Testing

### MongoDB Connection Test

Before running the application, you can test your MongoDB connection to ensure it's working correctly:

```bash
# Test MongoDB connection (including X.509 certificate authentication)
npm run test:mongodb
```

This test script will:
- ✅ Verify environment variables are set
- ✅ Load and validate X.509 certificates (if configured)
- ✅ Test database connection
- ✅ Verify read/write permissions
- ✅ Provide detailed troubleshooting information

### Application Testing

```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Build for production
npm run build
```

## 📝 Development Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Testing
npm test             # Unit tests (Tailscale sync planner and client, asset grouping)
npm run test:mongodb # Test MongoDB connection

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler

# Release (WSL, Podman)
bash scripts/deploy.sh        # Sync to GitHub (bumps build number), rebuild, swap, verify
bash scripts/sync.sh          # Only bump the build number and push

# One-off data scripts
node scripts/add-feature-indexes.js     # Indexes for features (run once)
node scripts/clear-needs-review.js      # Clear stale Needs-review flags (dry run; --apply to write)

# Docker
docker-compose up -d          # Start containers
docker-compose down           # Stop containers
docker-compose logs -f        # View logs
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

**MongoDB Connection Error**
- Check your `MONGODB_URI` in `.env`
- Ensure MongoDB is running (Docker: `docker-compose ps`)
- Verify network connectivity

**X.509 Certificate Authentication Issues**
- Verify certificate file path is correct: `./Certs/X509-cert-5964230336800025568.pem`
- Ensure certificate file is readable by the application
- Check that the connection string includes the correct auth mechanism: `authMechanism=MONGODB-X509`
- Verify the certificate is not expired
- For Docker deployment, ensure the Certs directory is properly mounted

**Build Errors**
- Clear node_modules: `rm -rf node_modules && npm install`
- Check TypeScript configuration
- Verify all dependencies are installed

**Docker Issues**
- Ensure Docker and Docker Compose are installed
- Check Docker logs: `docker-compose logs`
- Rebuild containers: `docker-compose build --no-cache`
- For X.509 auth, verify certificate mounting in docker-compose.yml

### Getting Help

- Check the wiki pages in the application for detailed documentation
- Review the code comments for implementation details
- Create an issue in the repository for bugs or feature requests

## 🗺 Roadmap

- [ ] Real authentication integration (Auth.js, Clerk, etc.)
- [ ] Email notifications for issue updates
- [ ] File attachments for issues
- [ ] Advanced reporting and analytics
- [ ] AI-powered issue suggestions
- [ ] Mobile app (React Native)
- [ ] Advanced permissions system
- [ ] Time tracking and reporting
- [ ] Integration with external tools (GitHub, Slack, etc.)
- [ ] Feature comments and PM status updates (on-track / at-risk / blocked)
- [ ] Activity log of who (human or AI) changed what
- [ ] Issue relations (blocks / blocked-by) that `get_next_work` respects
- [ ] "Stale host" flag in Assets for devices offline for weeks

---

Built with ❤️ using Next.js 15, TypeScript, and MongoDB