const fs = require('fs');

let content = fs.readFileSync('server-postgres.js', 'utf8');

// Parche para Socket.io CORS
content = content.replace(
  /"http:\/\/192\.168\.1\.36:3000",\s*"exp:\/\/192\.168\.1\.36:8081"/,
  '"http://192.168.1.36:3000",\n      "http://185.144.157.163",\n      "http://185.144.157.163:3000",\n      "http://185.144.157.163:5000",\n      "exp://192.168.1.36:8081"'
);

// Parche para Express CORS
content = content.replace(
  /"http:\/\/192\.168\.1\.36:3000",\s*"exp:\/\/192\.168\.1\.36:8081"/g,
  '"http://192.168.1.36:3000",\n    "http://185.144.157.163",\n    "http://185.144.157.163:3000",\n    "http://185.144.157.163:5000",\n    "exp://192.168.1.36:8081"'
);

fs.writeFileSync('server-postgres.js', content);
console.log('✅ CORS actualizado correctamente');
