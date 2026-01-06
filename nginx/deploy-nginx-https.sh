#!/bin/bash
# =============================================================================
# Nginx + HTTPS Deployment Script for aiwxcreator.cloud
# =============================================================================
# This script automates the setup of Nginx reverse proxy with Let's Encrypt SSL
# for the WeChat AI Publisher backend.
#
# Prerequisites:
# - Ubuntu 20.04/22.04 LTS server
# - Domain aiwxcreator.cloud pointing to server IP (A record configured)
# - Node.js backend running on port 3001
# - Root or sudo access
#
# Usage (from project root):
#   chmod +x nginx/deploy-nginx-https.sh
#   sudo ./nginx/deploy-nginx-https.sh
#
# Environment Variables (optional):
#   CERTBOT_EMAIL - Email address for Let's Encrypt notifications
# =============================================================================

set -e

# Configuration
DOMAIN="aiwxcreator.cloud"
WWW_DOMAIN="www.aiwxcreator.cloud"
BACKEND_PORT=3001
NGINX_CONF="/etc/nginx/sites-available/${DOMAIN}"
NGINX_ENABLED="/etc/nginx/sites-enabled/${DOMAIN}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   log_error "This script must be run as root (use sudo)"
   exit 1
fi

# Step 1: Update system packages
log_info "Step 1: Updating system packages..."
apt update

# Step 2: Install Nginx and Certbot
log_info "Step 2: Installing Nginx and Certbot..."
apt install -y nginx certbot python3-certbot-nginx

# Verify Nginx installation
if ! command -v nginx &> /dev/null; then
    log_error "Nginx installation failed. Please check the error messages above."
    exit 1
fi
log_info "✓ Nginx installed successfully"

# Step 3: Check if backend is running on port 3001
log_info "Step 3: Checking if backend is running on port ${BACKEND_PORT}..."
if curl -s "http://127.0.0.1:${BACKEND_PORT}/api/v1/health" > /dev/null 2>&1; then
    log_info "✓ Backend is running on port ${BACKEND_PORT}"
else
    log_warn "Backend may not be running on port ${BACKEND_PORT}"
    log_warn "Make sure your Node.js app is started with PORT=${BACKEND_PORT}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Step 4: Create Nginx configuration
log_info "Step 4: Creating Nginx configuration..."
cat > "${NGINX_CONF}" << 'EOF'
# Map for conditional WebSocket Connection header
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 80;
    listen [::]:80;
    server_name aiwxcreator.cloud www.aiwxcreator.cloud;

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # SSE (Server-Sent Events) endpoint with long timeout
    location /api/v1/ai/chat/stream {
        proxy_pass http://127.0.0.1:3001;

        # Pass real IP and headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # SSE support - disable buffering and set long timeout
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    # API proxy - all API requests
    location /api/ {
        proxy_pass http://127.0.0.1:3001;

        # Pass real IP and headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support with conditional Connection header
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_cache_bypass $http_upgrade;

        # Reasonable timeout for API requests
        proxy_read_timeout 300;
        proxy_send_timeout 300;
        proxy_buffering off;
    }

    # Frontend and other requests
    location / {
        proxy_pass http://127.0.0.1:3001;

        # Pass real IP and headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support with conditional Connection header
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_cache_bypass $http_upgrade;

        # Standard timeout for regular requests
        proxy_read_timeout 60;
        proxy_buffering off;
    }
}
EOF

log_info "✓ Nginx configuration created at ${NGINX_CONF}"

# Step 5: Enable the site
log_info "Step 5: Enabling Nginx site..."
if [ -L "${NGINX_ENABLED}" ]; then
    rm "${NGINX_ENABLED}"
fi
ln -s "${NGINX_CONF}" "${NGINX_ENABLED}"

# Remove default site if exists
if [ -L "/etc/nginx/sites-enabled/default" ]; then
    rm /etc/nginx/sites-enabled/default
    log_info "✓ Removed default Nginx site"
fi

# Step 6: Test Nginx configuration
log_info "Step 6: Testing Nginx configuration..."
nginx -t

# Step 7: Restart Nginx
log_info "Step 7: Restarting Nginx..."
systemctl restart nginx
log_info "✓ Nginx restarted successfully"

# Step 8: Install SSL certificate with Certbot
log_info "Step 8: Installing SSL certificate with Certbot..."
log_info "This will request a certificate from Let's Encrypt for:"
log_info "  - ${DOMAIN}"
log_info "  - ${WWW_DOMAIN}"
echo

# Prompt for email if not set via environment variable
if [ -z "${CERTBOT_EMAIL}" ]; then
    read -p "Enter your email for Let's Encrypt notifications: " CERTBOT_EMAIL
fi

if [ -z "${CERTBOT_EMAIL}" ]; then
    log_warn "No email provided. Using register-unsafely-without-email flag."
    CERTBOT_EMAIL_FLAG="--register-unsafely-without-email"
else
    CERTBOT_EMAIL_FLAG="--email ${CERTBOT_EMAIL}"
fi

read -p "Proceed with SSL certificate installation? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "Note: Certbot will modify the Nginx configuration to add HTTPS settings."
    # Temporarily disable 'exit on error' to handle certbot failures gracefully
    set +e
    certbot --nginx -d "${DOMAIN}" -d "${WWW_DOMAIN}" --non-interactive --agree-tos --redirect ${CERTBOT_EMAIL_FLAG}
    CERTBOT_STATUS=$?
    # Restore 'exit on error' behavior
    set -e
    if [ "${CERTBOT_STATUS}" -ne 0 ]; then
        log_warn "Certbot automated installation failed."
        log_info "You can run it manually with:"
        log_info "  sudo certbot --nginx -d ${DOMAIN} -d ${WWW_DOMAIN}"
    fi
else
    log_warn "Skipping SSL certificate installation."
    log_info "You can install it later with:"
    log_info "  sudo certbot --nginx -d ${DOMAIN} -d ${WWW_DOMAIN}"
fi

# Step 9: Final verification
log_info "Step 9: Final verification..."
echo
log_info "=========================================="
log_info "Deployment Summary"
log_info "=========================================="
log_info "Domain: ${DOMAIN}, ${WWW_DOMAIN}"
log_info "Backend Port: ${BACKEND_PORT}"
log_info "Nginx Config: ${NGINX_CONF}"
echo
log_info "Next Steps:"
log_info "1. Ensure your DNS A records point to this server"
log_info "2. Verify HTTPS access at https://${DOMAIN} or https://${WWW_DOMAIN}"
log_info "3. Check browser console for any SSL/Mixed Content errors"
log_info "4. API endpoint: https://${DOMAIN}/api/v1/health"
echo
log_info "Useful Commands:"
log_info "  - View Nginx status: systemctl status nginx"
log_info "  - View Nginx logs: tail -f /var/log/nginx/access.log"
log_info "  - Renew SSL cert: sudo certbot renew"
log_info "  - Test site: curl https://${DOMAIN}/api/v1/health"
echo
log_info "✓ Deployment script completed!"
