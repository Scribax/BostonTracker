# 📦 INSTALLATION GUIDE - BOSTON TRACKER

## 🚀 Instalación Automática (Recomendado)

### Windows (PowerShell)

```powershell
# Ejecutar el script de setup
.\setup.ps1

# O con opciones:
.\setup.ps1 -SkipMobile    # Saltar mobile
.\setup.ps1 -SkipBackend  # Saltar backend
```

### Linux/Mac (Bash)

```bash
# Dar permisos y ejecutar
chmod +x setup.sh
./setup.sh

# O con opciones:
./setup.sh --skip-mobile    # Saltar mobile
./setup.sh --skip-backend   # Saltar backend
```

---

## 🛠️ Instalación Manual

### Requisitos Previos

- **Node.js** >= 18.0.0 ([Descargar](https://nodejs.org/))
- **npm** >= 9.0.0 (incluido con Node.js)
- **Git** ([Descargar](https://git-scm.com/))
- **PostgreSQL** >= 14 ([Descargar](https://www.postgresql.org/download/))
- **Expo Go** (para mobile - [App Store](https://apps.apple.com/app/expo-go/id982107779) / [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent))

### Paso 1: Clonar Repositorio

```bash
git clone <tu-repo-url>
cd BostonTracker-main
```

### Paso 2: Configurar Backend

```bash
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
copy .env.example .env

# Editar .env con tus configuraciones:
# DB_NAME=boston_tracker
# DB_USER=postgres
# DB_PASSWORD=tu_password
# DB_HOST=localhost
# JWT_SECRET=tu_secreto_super_seguro
# PORT=5000

# Crear base de datos PostgreSQL
# (Asegúrate de que PostgreSQL esté corriendo)

# Verificar TypeScript
npm run typecheck

# Ejecutar tests
npm test

# Iniciar servidor de desarrollo
npm run dev
```

Backend correrá en: http://localhost:5000

### Paso 3: Configurar Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Verificar TypeScript
npm run typecheck

# Iniciar servidor de desarrollo
npm run dev
```

Frontend correrá en: http://localhost:5173 (o el puerto que muestre Vite)

### Paso 4: Configurar Mobile App

```bash
cd mobile-app

# Instalar dependencias
npm install

# Instalar Expo CLI (si no lo tienes)
npm install -g @expo/cli

# Configurar variables de entorno (opcional)
copy .env.example .env

# Iniciar Expo
npx expo start
```

Escanea el código QR con **Expo Go** en tu dispositivo móvil.

---

## ✅ Verificación de Instalación

### Backend Tests

```bash
cd backend

# Todos los tests
npm test

# Tests con cobertura
npm run test:coverage

# TypeScript check
npm run typecheck
```

### Frontend Tests

```bash
cd frontend

# TypeScript check
npm run typecheck

# Build de producción
npm run build
```

### Mobile App Tests

```bash
cd mobile-app

# TypeScript check
npm run typecheck
```

---

## 🐛 Troubleshooting

### Error: "Cannot find module"

```bash
# Limpiar cache y reinstalar
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Error: "Port already in use"

```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

### Error: "PostgreSQL connection failed"

```bash
# Verificar PostgreSQL está corriendo
# Windows (con pgAdmin o servicios)
services.msc  # Buscar postgresql-x64

# Linux
sudo systemctl status postgresql
sudo systemctl start postgresql

# Mac (con Homebrew)
brew services start postgresql
```

### Error: "Permission denied" en scripts

```bash
# Linux/Mac
chmod +x setup.sh
```

### Error: "Command not found: expo"

```bash
npm install -g @expo/cli
```

---

## 📁 Estructura del Proyecto

```
BostonTracker-main/
├── backend/              # Node.js + TypeScript + PostgreSQL
│   ├── src/
│   │   ├── __tests__/   # Tests Jest
│   │   ├── config/      # Database config
│   │   ├── controllers/ # Auth & Delivery controllers
│   │   ├── middleware/  # Auth middleware
│   │   ├── models/      # Sequelize models
│   │   ├── routes/      # API routes
│   │   ├── types/       # TypeScript types
│   │   ├── utils/       # Geo utilities
│   │   └── server.ts    # Main server
│   ├── .env.example     # Environment template
│   ├── jest.config.js   # Jest configuration
│   ├── tsconfig.json    # TypeScript config
│   └── package.json     # Dependencies
│
├── frontend/             # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/  # React components (TSX)
│   │   ├── context/     # AuthContext
│   │   ├── services/    # API & Socket services
│   │   ├── types/       # TypeScript types
│   │   ├── App.tsx      # Main app
│   │   └── main.tsx     # Entry point
│   ├── tsconfig.json    # TypeScript config
│   └── package.json     # Dependencies
│
├── mobile-app/           # React Native + Expo + TypeScript
│   ├── src/
│   │   ├── contexts/    # Auth & Location contexts
│   │   ├── screens/     # Login & Home screens
│   │   ├── services/    # Location services
│   │   └── types/       # TypeScript types
│   ├── App.tsx          # Main entry
│   ├── tsconfig.json    # TypeScript config
│   └── package.json     # Dependencies
│
├── MIGRATION_TYPESCRIPT.md   # TypeScript migration guide
├── TESTING.md                # Testing guide
├── MOBILE_OPTIMIZATION.md    # Mobile optimization guide
└── INSTALLATION.md           # This file
```

---

## 🔧 Scripts Disponibles

### Backend

```bash
npm run dev          # Desarrollo con hot reload
npm run build        # Compilar TypeScript
npm start            # Ejecutar compilado
npm test             # Ejecutar tests
npm run test:watch   # Tests en modo watch
npm run test:coverage # Tests con cobertura
npm run typecheck    # Verificar TypeScript
npm run lint         # Ejecutar ESLint
npm run lint:fix     # Fix ESLint errors
npm run format       # Formatear con Prettier
```

### Frontend

```bash
npm run dev          # Desarrollo con Vite
npm run build        # Build de producción
npm run preview      # Preview del build
npm run typecheck    # Verificar TypeScript
npm run lint         # Ejecutar ESLint
```

### Mobile

```bash
npx expo start       # Iniciar Expo development server
npx expo start --android  # Android
npx expo start --ios      # iOS (solo Mac)
npm run typecheck    # Verificar TypeScript
```

---

## 🎯 Post-Instalación Checklist

- [ ] Backend corriendo en http://localhost:5000
- [ ] Frontend corriendo en http://localhost:5173
- [ ] Tests pasando (`npm test` en backend)
- [ ] TypeScript sin errores (`npm run typecheck`)
- [ ] Mobile app cargando en Expo Go
- [ ] Login funciona (admin@bostonburgers.com / password123)
- [ ] Tracking de ubicaciones funciona

---

## 🆘 Soporte

Si tienes problemas:

1. Verifica los logs de error en cada terminal
2. Revisa `@MIGRATION_TYPESCRIPT.md` para troubleshooting
3. Asegúrate de que todas las dependencias estén instaladas
4. Verifica que PostgreSQL esté corriendo

---

**Estado**: 📦 **Listo para instalar y probar**
