# 🧪 TESTING GUIDE - BOSTON TRACKER

## 📊 Estado de Testing

### ✅ FASE 2: Testing Configurado

## 🗂️ Estructura de Tests

```
backend/
├── src/__tests__/
│   ├── setup.ts              # Configuración global Jest
│   ├── controllers/
│   │   └── auth.test.ts      # Tests Auth Controller ✅
│   └── middleware/
│       └── auth.test.ts      # Tests Auth Middleware ✅
└── jest.config.js            # Configuración Jest ✅
```

## 📋 Tests Creados

### Auth Controller Tests (`auth.test.ts`)

**Login Tests:**
- ✅ Login exitoso con credenciales de admin válidas
- ✅ Login exitoso con credenciales de delivery válidas
- ✅ Error 400 cuando faltan credenciales
- ✅ Error 401 para credenciales inválidas
- ✅ Error 401 para usuario inactivo
- ✅ Manejo de errores del servidor

**Create User Tests:**
- ✅ Crear usuario admin exitosamente
- ✅ Crear usuario delivery exitosamente
- ✅ Error 400 cuando faltan campos requeridos
- ✅ Error 400 cuando email ya existe
- ✅ Error 400 cuando employeeId ya existe

**Get Current User Tests:**
- ✅ Retornar datos del usuario actual
- ✅ Error 401 cuando no está autenticado

**Logout Tests:**
- ✅ Logout exitoso

### Auth Middleware Tests (`auth.test.ts`)

**Authenticate Tests:**
- ✅ Autenticar token válido
- ✅ Error 401 cuando no hay token
- ✅ Error 401 para formato de token inválido
- ✅ Error 401 para token expirado/inválido
- ✅ Error 401 cuando usuario no existe
- ✅ Error 401 para usuario inactivo

**Authorize Tests:**
- ✅ Permitir acceso para rol autorizado
- ✅ Denegar acceso para rol no autorizado
- ✅ Error 401 cuando no está autenticado
- ✅ Permitir múltiples roles

**Authorize Ownership Tests:**
- ✅ Permitir acceso para admin
- ✅ Permitir acceso para propietario del recurso
- ✅ Denegar acceso para delivery no propietario
- ✅ Error 401 cuando no está autenticado

## 🚀 Comandos de Testing

### Backend

```bash
cd backend

# Instalar dependencias
npm install

# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch
npm run test:watch

# Ejecutar tests con coverage
npm run test:coverage

# Verificar types sin emitir
npm run typecheck
```

## 📈 Cobertura

| Componente | Tests | Cobertura |
|------------|-------|-----------|
| Auth Controller | 14+ tests | ⏳ Pendiente ejecutar |
| Auth Middleware | 14+ tests | ⏳ Pendiente ejecutar |
| Delivery Controller | ⏭️ Pendiente | - |
| Integration Tests | ⏭️ Pendiente | - |

## 🔧 Configuración Jest

### `jest.config.js`

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@models/(.*)$': '<rootDir>/src/models/$1',
    '^@controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '^@middleware/(.*)$': '<rootDir>/src/middleware/$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts',
  ],
  coverageDirectory: 'coverage',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
};
```

## 📝 Patrones de Testing

### Mock de Request/Response

```typescript
const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};
```

### Mock de Modelos

```typescript
jest.mock('@models/index');
(User.findOne as jest.Mock).mockResolvedValue(mockUser);
```

### Mock de JWT

```typescript
jest.mock('jsonwebtoken');
(jwt.sign as jest.Mock).mockReturnValue('mock-token');
(jwt.verify as jest.Mock).mockReturnValue({ id: 'user-id' });
```

## 🐛 Troubleshooting

### Error: "Cannot find module"

```bash
npm install
```

### Error: "Cannot find name 'jest'"

Los tipos de Jest se instalan automáticamente con `@types/jest` (ya incluido en `package.json`).

### Error: "Cannot find module '@models/index'"

Asegúrate de que los path aliases estén configurados correctamente en `tsconfig.json` y `jest.config.js`.

## ⏭️ Próximos Tests

1. **Delivery Controller Tests**
   - getActiveDeliveries
   - startDeliveryTrip
   - stopDeliveryTrip
   - updateLocation

2. **Integration Tests**
   - API endpoints
   - Database operations
   - Socket.io events

3. **Frontend Tests**
   - React Testing Library
   - Component tests
   - Hook tests

---

**Estado**: ✅ **FASE 2: Testing - BASE CONFIGURADA** 🧪
