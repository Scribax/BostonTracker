#!/bin/bash
# ==========================================
# DEPLOY SCRIPT - BOSTON TRACKER
# ==========================================

set -e

APP_DIR="/var/www/boston-tracker"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_step() {
    echo -e "${CYAN}[DEPLOY] $1${NC}"
}

print_success() {
    echo -e "${GREEN}[OK] $1${NC}"
}

cd $APP_DIR

# ==========================================
# BACKEND DEPLOY
# ==========================================

print_step "Deploying backend..."
cd $BACKEND_DIR

# Create .env file for production
if [ ! -f .env ]; then
    print_step "Creating .env file..."
    cat > .env << EOF
NODE_ENV=production
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=boston_tracker
DB_USER=boston_user
DB_PASSWORD=boston_secure_pass_2024
DB_DIALECT=postgres

# JWT
JWT_SECRET=super_secure_jwt_secret_key_change_this_in_production

# CORS
CORS_ORIGIN=http://186.64.123.15
EOF
    print_success ".env file created"
fi

# Install dependencies
print_step "Installing backend dependencies..."
npm install --production
print_success "Dependencies installed"

# Build TypeScript
print_step "Building TypeScript..."
npm run build
print_success "Build complete"

# Start with PM2
print_step "Starting backend with PM2..."
pm2 delete boston-backend 2>/dev/null || true
pm2 start dist/server.js --name boston-backend --env production
pm2 save
print_success "Backend started"

# ==========================================
# FRONTEND DEPLOY
# ==========================================

print_step "Deploying frontend..."
cd $FRONTEND_DIR

# Install dependencies
print_step "Installing frontend dependencies..."
npm install
print_success "Dependencies installed"

# Build for production
print_step "Building frontend..."
npm run build
print_success "Build complete"

# Copy to nginx directory
print_step "Copying to nginx..."
cp -r dist/* /var/www/html/
print_success "Frontend deployed to nginx"

# ==========================================
# NGINX CONFIG
# ==========================================

print_step "Configuring nginx..."
cat > /etc/nginx/sites-available/boston-tracker << 'EOF'
server {
    listen 80;
    server_name 186.64.123.15;

    # Frontend
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
        index index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.io
    location /socket.io/ {
        proxy_pass http://localhost:5000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/boston-tracker /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload nginx
nginx -t
systemctl reload nginx
print_success "Nginx configured"

# ==========================================
# DONE
# ==========================================

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Your app is now running at:"
echo "  http://186.64.123.15"
echo ""
echo "Backend API:"
echo "  http://186.64.123.15/api/"
echo ""
echo "Services:"
echo "  - Frontend: Nginx on port 80"
echo "  - Backend: PM2 on port 5000"
echo "  - Database: PostgreSQL"
echo ""
echo "PM2 commands:"
echo "  pm2 status         - Check status"
echo "  pm2 logs boston-backend - View logs"
echo "  pm2 restart all    - Restart all services"
echo ""
