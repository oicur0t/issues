#!/bin/bash
# Local Development Server Script (Bash)
# This runs the app locally using the same Atlas database as dev-wrangl

echo -e "\033[0;32mStarting local development server with Atlas database...\033[0m"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "\033[0;33mInstalling dependencies...\033[0m"
    npm install
    echo ""
fi

# Set environment variables for Atlas connection
export NODE_ENV="development"
export MONGODB_URI="mongodb+srv://cluster0.rrp7vpi.mongodb.net/issues?authSource=%24external&authMechanism=MONGODB-X509&retryWrites=true&w=majority&appName=Cluster0"
export MONGODB_CERT_PATH="./Certs/X509-cert-5964230336800025568.pem"

# Check if certificate exists
if [ ! -f "$MONGODB_CERT_PATH" ]; then
    echo -e "\033[0;31mWARNING: MongoDB certificate not found at $MONGODB_CERT_PATH\033[0m"
    echo -e "\033[0;31mMake sure your certificate is in the Certs directory.\033[0m"
    echo ""
fi

echo -e "\033[0;36mConfiguration:\033[0m"
echo -e "  - Database: MongoDB Atlas (same as dev-wrangl)"
echo -e "  - Auth: X.509 Certificate"
echo -e "  - URL: http://localhost:3000"
echo ""
echo -e "\033[0;33mPress Ctrl+C to stop the server\033[0m"
echo ""

# Start the Next.js dev server
npm run dev
