const fs = require('fs');
let content = fs.readFileSync('server-postgres.js.backup', 'utf8');

// Reemplazar la configuración de CORS para Socket.io
content = content.replace(
  /cors: \{\s*origin: \[\s*"http:\/\/localhost:3000",\s*"http:\/\/192\.168\.1\.36:3000",\s*"exp:\/\/192\.168\.1\.36:8081"\s*\]/,
  'cors: {\n    origin: "*"'
);

// Reemplazar la configuración de CORS para Express
content = content.replace(
  /app\.use\(cors\(\{\s*origin: \[\s*"http:\/\/localhost:3000",\s*"http:\/\/192\.168\.1\.36:3000",\s*"exp:\/\/192\.168\.1\.36:8081"\s*\]/,
  'app.use(cors({\n  origin: "*"'
);

fs.writeFileSync('server-postgres.js', content);
console.log('✅ CORS configurado para permitir todos los orígenes');
