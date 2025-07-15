#!/bin/bash

# WinXP Forum Deployment Script
set -e

echo "🚀 Starting WinXP Forum deployment..."

# Configuration
SERVICE_USER="zach"
DEPLOY_PATH="/home/zach/desktop/winxp-forum"
REPO_URL="https://github.com/zachryanludwick/winxp-forum.git"  # Update this
BRANCH="main"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root (use sudo)"
   exit 1
fi

# Stop service if it exists
print_status "Stopping service..."
systemctl stop winxp-forum || true

# Create deployment directory if it doesn't exist
if [ ! -d "$DEPLOY_PATH" ]; then
    print_status "Creating deployment directory..."
    mkdir -p "$DEPLOY_PATH"
    chown -R $SERVICE_USER:$SERVICE_USER "$DEPLOY_PATH"
fi

# Navigate to deployment directory
cd "$DEPLOY_PATH"

# Pull latest changes or clone if first time
if [ -d ".git" ]; then
    print_status "Pulling latest changes..."
    sudo -u $SERVICE_USER git fetch origin
    sudo -u $SERVICE_USER git reset --hard origin/$BRANCH
else
    print_status "Cloning repository..."
    sudo -u $SERVICE_USER git clone "$REPO_URL" .
    sudo -u $SERVICE_USER git checkout "$BRANCH"
fi

# Install/update server dependencies
print_status "Installing server dependencies..."
cd "$DEPLOY_PATH/server"
sudo -u $SERVICE_USER npm install --production

# Build client if needed
if [ -d "$DEPLOY_PATH/client" ]; then
    print_status "Building client..."
    cd "$DEPLOY_PATH/client"
    sudo -u $SERVICE_USER npm install
    sudo -u $SERVICE_USER npm run build
fi

# Copy service file
print_status "Installing service file..."
cp "$DEPLOY_PATH/winxp-forum.service" /etc/systemd/system/

# Reload systemd and enable service
print_status "Configuring service..."
systemctl daemon-reload
systemctl enable winxp-forum

# Start service
print_status "Starting service..."
systemctl start winxp-forum

# Check service status
print_status "Checking service status..."
if systemctl is-active --quiet winxp-forum; then
    print_status "✅ WinXP Forum service is running"
else
    print_error "❌ WinXP Forum service failed to start"
    systemctl status winxp-forum --no-pager
fi

print_status "🎉 Deployment complete!"
print_status "Forum: http://localhost:5001"
print_status "Logs: journalctl -u winxp-forum -f"