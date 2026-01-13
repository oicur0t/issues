# Issue Tracker

A production-ready internal issue tracking system built with Next.js 15, TypeScript, and MongoDB Atlas. Designed for rapid iteration with a clean architecture that can easily be extended with AI agent integrations.

## 🚀 Features

### Issue Tracking
- ✅ Full CRUD operations for issues
- ✅ Issue listing with filtering and search
- ✅ Individual issue view with edit capability
- ✅ Status workflow (Open, In Progress, Blocked, Closed)
- ✅ Priority levels (Low, Medium, High, Critical)
- ✅ Issue assignment to team members
- ✅ Tag-based categorization

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

3. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Application: http://localhost:3000
   - MongoDB Express: http://localhost:8081

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
│   └── types/                   # TypeScript type definitions
│       ├── index.ts
│       ├── issue.ts
│       ├── user.ts
│       └── wiki.ts
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

## 🤖 AI Integration Ready

The architecture is prepared for AI agent integrations:

- **Vercel AI SDK**: Easily add AI chatbots and assistants
- **Server Actions**: Perfect for AI-powered data operations
- **Type Safety**: Ensures reliable AI integrations
- **Modular Structure**: Add AI features without disrupting existing code

Example AI integration points:
- Issue summarization and prioritization
- Automated issue assignment
- Wiki content generation
- Smart search and recommendations

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
npm run test:mongodb # Test MongoDB connection

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler

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

---

Built with ❤️ using Next.js 15, TypeScript, and MongoDB