# Local Development Server Script (PowerShell)
# This runs the app locally using the same Atlas database as dev-wrangl

Write-Host "Starting local development server with Atlas database..." -ForegroundColor Green
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Set environment variables for Atlas connection
$env:NODE_ENV = "development"
$env:MONGODB_URI = "mongodb+srv://cluster0.rrp7vpi.mongodb.net/issues?authSource=%24external&authMechanism=MONGODB-X509&retryWrites=true&w=majority&appName=Cluster0"
$env:MONGODB_CERT_PATH = "./Certs/X509-cert-5964230336800025568.pem"

# Check if certificate exists
if (-not (Test-Path $env:MONGODB_CERT_PATH)) {
    Write-Host "WARNING: MongoDB certificate not found at $env:MONGODB_CERT_PATH" -ForegroundColor Red
    Write-Host "Make sure your certificate is in the Certs directory." -ForegroundColor Red
    Write-Host ""
}

Write-Host "Configuration:" -ForegroundColor Cyan
Write-Host "  - Database: MongoDB Atlas (same as dev-wrangl)" -ForegroundColor Gray
Write-Host "  - Auth: X.509 Certificate" -ForegroundColor Gray
Write-Host "  - URL: http://localhost:3000" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the Next.js dev server
npm run dev
