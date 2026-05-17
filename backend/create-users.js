const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Configurar Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME || 'boston_tracker',
  process.env.DB_USER || 'boston_user', 
  process.env.DB_PASSWORD || 'boston123',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log
  }
);

// Definir modelo User
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  },
  employeeId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('admin', 'delivery'),
    defaultValue: 'delivery'
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

async function createUsers() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL establecida');
    
    await sequelize.sync({ force: false });
    console.log('✅ Modelo sincronizado');

    // Crear admin
    const adminExists = await User.findOne({ where: { email: 'admin@bostonburgers.com' } });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      await User.create({
        name: 'Administrador Boston',
        email: 'admin@bostonburgers.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true
      });
      console.log('✅ Usuario admin creado');
    } else {
      console.log('ℹ️ Usuario admin ya existe');
    }

    // Crear delivery DEL001
    const delivery1Exists = await User.findOne({ where: { employeeId: 'DEL001' } });
    if (!delivery1Exists) {
      const hashedPassword = await bcrypt.hash('delivery123', 10);
      await User.create({
        name: 'Juan Pérez',
        employeeId: 'DEL001',
        password: hashedPassword,
        role: 'delivery',
        isActive: true
      });
      console.log('✅ Usuario delivery DEL001 creado');
    } else {
      console.log('ℹ️ Usuario delivery DEL001 ya existe');
    }

    // Listar usuarios existentes
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'employeeId', 'role', 'isActive']
    });
    
    console.log('\n📋 Usuarios en la base de datos:');
    users.forEach(user => {
      console.log(`  ${user.role}: ${user.name} (${user.email || user.employeeId})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

createUsers();
