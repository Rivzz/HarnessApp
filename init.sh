#!/bin/bash

# Pomodoro Web Application - Development Environment Setup
# This script checks and sets up required tools for development

echo "==================================="
echo "Pomodoro App - Environment Setup"
echo "==================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
check_command() {
    if command -v "$1" &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 is installed"
        return 0
    else
        echo -e "${RED}✗${NC} $1 is not installed"
        return 1
    fi
}

# Function to check version
check_version() {
    local cmd=$1
    local version=$($cmd --version 2>&1 | head -n 1)
    echo "  Version: $version"
}

echo "Checking required tools..."
echo ""

# Check Node.js (for development server, build tools)
echo "--- Runtime ---"
if check_command "node"; then
    check_version "node"
fi

# Check npm (package manager)
if check_command "npm"; then
    check_version "npm"
fi

echo ""
echo "--- Version Control ---"
# Check Git
if check_command "git"; then
    check_version "git"
fi

echo ""
echo "--- Optional Tools ---"

# Check for code editor (VS Code)
if check_command "code"; then
    echo -e "${GREEN}✓${NC} VS Code CLI is available"
fi

# Check for live-server (optional for quick dev)
if npm list -g live-server &> /dev/null; then
    echo -e "${GREEN}✓${NC} live-server is installed globally"
else
    echo -e "${YELLOW}!${NC} live-server not found (optional: npm install -g live-server)"
fi

echo ""
echo "==================================="
echo "Setup Actions"
echo "==================================="
echo ""

# Create necessary directories if they don't exist
echo "Creating project directories..."
mkdir -p src/css
mkdir -p src/js
mkdir -p src/assets/sounds
mkdir -p src/assets/images

echo -e "${GREEN}✓${NC} Directory structure created"

# Initialize package.json if it doesn't exist
if [ ! -f "package.json" ]; then
    echo ""
    echo "Initializing package.json..."
    cat > package.json << 'EOF'
{
  "name": "pomodoro-app",
  "version": "1.0.0",
  "description": "A focused pomodoro timer web application",
  "main": "src/index.html",
  "scripts": {
    "start": "npx live-server src --port=3000",
    "dev": "npx live-server src --port=3000 --open=/index.html"
  },
  "keywords": ["pomodoro", "timer", "productivity", "focus"],
  "author": "",
  "license": "MIT",
  "devDependencies": {}
}
EOF
    echo -e "${GREEN}✓${NC} package.json created"
else
    echo -e "${YELLOW}!${NC} package.json already exists, skipping"
fi

echo ""
echo "==================================="
echo "Setup Complete!"
echo "==================================="
echo ""
echo "Next steps:"
echo "  1. Run 'npm install' to install dependencies"
echo "  2. Run 'npm start' to launch development server"
echo "  3. Open http://localhost:3000 in your browser"
echo ""
