#!/bin/bash
# ==========================================
# VPS SETUP SCRIPT - BOSTON TRACKER
# ==========================================

set -e

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_step() {
    echo -e "${CYAN}[SETUP] $1${NC}"
}

print_success() {
    echo -e "${GREEN}[OK] $1${NC}"
}

print_error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

# ==========================================
# UPDATE SYSTEM
# ==========================================

print_step "Updating system packages..."
apt-get update
apt-get upgrade -y
print_success "System updated"

# ==========================================
# INSTALL NODE.JS
# ==========================================

print_step "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
print_success "Node.js installed: $(node --version)"

# ==========================================
# INSTALL POSTGRESQL
# ==========================================

print_step "Installing PostgreSQL..."
apt-get install -y postgresql postgresql-contrib
systemctl enable postgresql
systemctl start postgresql
print_success "PostgreSQL installed and started"

# ==========================================
# INSTALL NGINX
# ==========================================

print_step "Installing Nginx..."
apt-get install -y nginx
systemctl enable nginx
systemctl start nginx
print_success "Nginx installed and started"

# ==========================================
# INSTALL PM2
# ==========================================

print_step "Installing PM2..."
npm install -g pm2
print_success "PM2 installed"

# ==========================================
# SETUP POSTGRESQL DATABASE
# ==========================================

print_step "Setting up PostgreSQL database..."
su - postgres -c "psql -c \"CREATE DATABASE boston_tracker;\""
su - postgres -c "psql -c \"CREATE USER boston_user WITH PASSWORD 'boston_secure_pass_2024';\""
su - postgres -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE boston_tracker TO boston_user;\""
print_success "Database created"

# ==========================================
# CREATE APP DIRECTORY
# ==========================================

print_step "Creating app directory..."
mkdir -p /var/www/boston-tracker
cd /var/www/boston-tracker
print_success "App directory created"

# ==========================================
# FIREWALL
# ==========================================

print_step "Configuring firewall..."
apt-get install -y ufw
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 5000/tcp  # Backend API
ufw --force enable
print_success "Firewall configured"

# ==========================================
# DONE
# ==========================================

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}VPS SETUP COMPLETE!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Database credentials:"
echo "  Database: boston_tracker"
echo "  User: boston_user"
echo "  Password: boston_secure_pass_2024"
echo ""
echo "Next steps:"
echo "  1. Upload project files to /var/www/boston-tracker/"
echo "  2. Run: cd /var/www/boston-tracker && ./deploy.sh"
echo ""
