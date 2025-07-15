#!/bin/bash

# Quick update script for remote SSH usage
set -e

echo "🔄 Updating WinXP Forum..."

# Pull latest changes
git pull origin main

# Restart service
sudo systemctl restart winxp-forum

# Check status
echo "📊 Service Status:"
sudo systemctl status winxp-forum --no-pager -l

echo "✅ Update complete!"