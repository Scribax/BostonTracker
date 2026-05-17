#!/bin/bash

# ================================
# BOSTON TRACKER - SETUP AUTOMÁTICO
# ================================

set -e  # Detener en cualquier error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Banner
echo -e "${PURPLE}"
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                                                                  ║"
echo "║                     🍔 BOSTON TRACKER 🍔                       ║"
echo "║                                                                  ║"
echo "║          Sistema de Tracking para Deliverys                     ║"
echo "║              Configuración Automática v1.0                      ║"
echo "║                                                                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${CYAN}🚀 Iniciando configuración automática...${NC}\n"

# Función para mostrar progreso
show_progress() {
    echo -e "${BLUE}▶ $1...${NC}"
}

# Función para mostrar éxito
show_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Función para mostrar advertencia
show_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Función para mostrar error
show_error() {
    echo -e "${RED}❌ Error: $1${NC}"
    exit 1
}

# Verificar que estamos en el directorio correcto
if [[ ! -f "package.json" ]] || [[ ! -d "backend" ]] || [[ ! -d "frontend" ]]; then
    show_error "Este script debe ejecutarse desde el directorio raíz del proyecto Boston Tracker"
fi

# 1. Detectar IP del servidor
show_progress "Detectando IP del servidor"

# Intentar detectar la IP principal
SERVER_IP=$(hostname -I | awk '{print $1}')

if [[ -z "$SERVER_IP" ]]; then
    # Fallback: intentar con ip route
    SERVER_IP=$(ip route get 8.8.8.8 | awk 'NR==1{print $7}')
fi

if [[ -z "$SERVER_IP" ]]; then
    show_warning "No se pudo detectar automáticamente la IP"
    echo -e "${YELLOW}Por favor ingresa la IP del servidor:${NC}"
    read -p "IP del servidor: " SERVER_IP
fi

echo -e "${GREEN}🌐 IP detectada: $SERVER_IP${NC}"

# 2. Crear archivo .env principal
show_progress "Creando configuración principal"

if [[ -f ".env" ]]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    show_warning "Se creó backup del .env existente"
fi

# Crear .env desde template
cp .env.template .env

# Reemplazar AUTO_DETECT con la IP real
sed -i "s/AUTO_DETECT/$SERVER_IP/g" .env

show_success "Configuración principal creada"

# 3. Configurar Backend
show_progress "Configurando Backend"

cd backend

# Crear .env para backend si no existe
if [[ ! -f ".env" ]]; then
    cat > .env << EOF
# BOSTON TRACKER - BACKEND CONFIG
NODE_ENV=production
PORT=5000

# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=boston_tracker
DB_USER=boston_user
DB_PASSWORD=boston123

# JWT
JWT_SECRET=boston_tracker_super_secret_key_2024
JWT_EXPIRE=7d

# CORS Origins
FRONTEND_URL=http://$SERVER_IP:3000
MOBILE_URL=exp://$SERVER_IP:8081
EOF
fi

show_success "Backend configurado"
cd ..

# 4. Configurar Frontend
show_progress "Configurando Frontend"

cd frontend

# Crear archivo de configuración para el frontend
cat > src/config/environment.js << 'EOF'
// Configuración automática del entorno
const config = {
  development: {
    API_URL: `http://${window.location.hostname}:5000/api`,
    SOCKET_URL: `http://${window.location.hostname}:5000`
  },
  production: {
    API_URL: `http://${window.location.hostname}:5000/api`,
    SOCKET_URL: `http://${window.location.hostname}:5000`
  }
};

const environment = process.env.NODE_ENV || 'production';
export default config[environment];
EOF

show_success "Frontend configurado"
cd ..

# 5. Configurar Mobile App
show_progress "Configurando Aplicación Móvil"

cd mobile-app

# Crear archivo de configuración para la app móvil
cat > src/config/environment.js << EOF
// Configuración automática del entorno
const config = {
  development: {
    API_URL: 'http://$SERVER_IP:5000/api',
    SOCKET_URL: 'http://$SERVER_IP:5000'
  },
  production: {
    API_URL: 'http://$SERVER_IP:5000/api',
    SOCKET_URL: 'http://$SERVER_IP:5000'
  }
};

const environment = __DEV__ ? 'development' : 'production';
export default config[environment];
EOF

show_success "Aplicación móvil configurada"
cd ..

# 6. Actualizar archivos de configuración existentes
show_progress "Actualizando configuraciones de red"

# Actualizar backend server
sed -i "s/\"http:\/\/localhost:3000\"/\"http:\/\/$SERVER_IP:3000\"/g" backend/server-postgres.js
sed -i "s/\"http:\/\/192.168.1.36:3000\"/\"http:\/\/$SERVER_IP:3000\"/g" backend/server-postgres.js
sed -i "s/\"exp:\/\/192.168.1.36:8081\"/\"exp:\/\/$SERVER_IP:8081\"/g" backend/server-postgres.js

# Actualizar configuraciones del frontend
if [[ -f "frontend/src/services/api.js" ]]; then
    sed -i "s/http:\/\/192.168.1.36:5000/http:\/\/$SERVER_IP:5000/g" frontend/src/services/api.js
    sed -i "s/http:\/\/localhost:5000/http:\/\/$SERVER_IP:5000/g" frontend/src/services/api.js
fi

# Actualizar configuraciones de la mobile app
if [[ -f "mobile-app/src/services/api.js" ]]; then
    sed -i "s/192.168.1.36/$SERVER_IP/g" mobile-app/src/services/api.js
fi

show_success "Configuraciones de red actualizadas"

# 7. Crear Docker Compose
show_progress "Creando configuración Docker"

cat > docker-compose.yml << EOF
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: boston_postgres
    environment:
      POSTGRES_DB: boston_tracker
      POSTGRES_USER: boston_user
      POSTGRES_PASSWORD: boston123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
    restart: unless-stopped

  backend:
    build: ./backend
    container_name: boston_backend
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=boston_tracker
      - DB_USER=boston_user
      - DB_PASSWORD=boston123
      - JWT_SECRET=boston_tracker_super_secret_key_2024
    depends_on:
      - postgres
    restart: unless-stopped
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build: ./frontend
    container_name: boston_frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://$SERVER_IP:5000/api
      - REACT_APP_SOCKET_URL=http://$SERVER_IP:5000
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
EOF

show_success "Docker Compose creado"

# 8. Crear Dockerfiles
show_progress "Creando Dockerfiles"

# Dockerfile para backend
cat > backend/Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm install --production

# Copiar código fuente
COPY . .

# Exponer puerto
EXPOSE 5000

# Comando de inicio
CMD ["npm", "start"]
EOF

# Dockerfile para frontend
cat > frontend/Dockerfile << 'EOF'
FROM node:18-alpine as build

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Build de la aplicación
RUN npm run build

# Imagen de producción con nginx
FROM nginx:alpine

# Copiar build al directorio de nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuración de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["nginx", "-g", "daemon off;"]
EOF

# Nginx config para frontend
cat > frontend/nginx.conf << 'EOF'
server {
    listen 3000;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html index.htm;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:5000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Configuración para WebSockets
    location /socket.io/ {
        proxy_pass http://backend:5000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

show_success "Dockerfiles creados"

# 9. Crear script de instalación de base de datos
show_progress "Creando script de base de datos"

mkdir -p scripts

cat > scripts/init-db.sql << 'EOF'
-- Creación de base de datos Boston Tracker
CREATE DATABASE IF NOT EXISTS boston_tracker;
GRANT ALL PRIVILEGES ON DATABASE boston_tracker TO boston_user;
EOF

cat > scripts/setup-db.sh << 'EOF'
#!/bin/bash
echo "🗄️  Configurando PostgreSQL..."

# Crear usuario y base de datos
sudo -u postgres createuser -D -A -P boston_user
sudo -u postgres createdb -O boston_user boston_tracker

echo "✅ Base de datos PostgreSQL configurada"
EOF

chmod +x scripts/setup-db.sh

show_success "Scripts de base de datos creados"

echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════════════╗"
echo -e "║                                                                  ║"
echo -e "║                     ✅ CONFIGURACIÓN COMPLETA                   ║"
echo -e "║                                                                  ║"
echo -e "╚══════════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${CYAN}📋 RESUMEN DE CONFIGURACIÓN:${NC}"
echo -e "${YELLOW}🌐 IP del Servidor:${NC} $SERVER_IP"
echo -e "${YELLOW}🔧 Backend:${NC} http://$SERVER_IP:5000"
echo -e "${YELLOW}💻 Frontend:${NC} http://$SERVER_IP:3000"
echo -e "${YELLOW}📱 Mobile:${NC} exp://$SERVER_IP:8081"

echo -e "\n${BLUE}🚀 PRÓXIMOS PASOS:${NC}"
echo -e "${GREEN}1.${NC} Ejecutar: ${CYAN}./install.sh${NC} para instalar dependencias"
echo -e "${GREEN}2.${NC} O usar Docker: ${CYAN}docker-compose up -d${NC}"
echo -e "${GREEN}3.${NC} Acceder al sistema en: ${CYAN}http://$SERVER_IP:3000${NC}"

echo -e "\n${PURPLE}🔑 CREDENCIALES INICIALES:${NC}"
echo -e "${YELLOW}Admin Web:${NC} admin@bostonburgers.com / password123"
echo -e "${YELLOW}Delivery 1:${NC} DEL001 / delivery123"
echo -e "${YELLOW}Delivery 2:${NC} DEL002 / delivery123"

echo -e "\n${GREEN}✨ ¡Configuración automática completada con éxito!${NC}"
