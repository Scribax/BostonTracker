
const bcrypt = require('bcryptjs');
console.log('Testing password delivery123:', bcrypt.compareSync('delivery123', '$2a$10$example'));
console.log('Testing password 123456:', bcrypt.compareSync('123456', '$2a$10$example'));

