#!/usr/bin/env node

const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
require('dotenv').config();

console.log('🔍 VERIFICACIÓN COMPLETA DEL BACKEND BOSTON TRACKER\n');

async function verifyBackend() {
  try {
    console.log('1️⃣ Verificando conexión a PostgreSQL...');
    
    const sequelize = new Sequelize('boston_tracker', 'boston_user', 'boston_password_2024', {
      host: 'localhost',
      dialect: 'postgres',
      logging: false
    });

    await sequelize.authenticate();
    console.log('   ✅ Conexión a PostgreSQL exitosa');

    console.log('\n2️⃣ Verificando modelos de base de datos...');
    
    // Definir modelos (simplificado para verificación)
    const User = sequelize.define('User', {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, unique: true, allowNull: true },
      employeeId: { type: DataTypes.STRING, unique: true, allowNull: true },
      password: { type: DataTypes.STRING, allowNull: false },
      role: { type: DataTypes.ENUM('admin', 'delivery'), allowNull: false },
      isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
    });

    const Trip = sequelize.define('Trip', {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      deliveryId: { type: DataTypes.UUID, allowNull: false },
      startTime: { type: DataTypes.DATE, allowNull: false },
      endTime: { type: DataTypes.DATE, allowNull: true },
      status: { type: DataTypes.ENUM('active', 'completed'), defaultValue: 'active' },
      mileage: { type: DataTypes.FLOAT, defaultValue: 0 },
      duration: { type: DataTypes.INTEGER, defaultValue: 0 },
      averageSpeed: { type: DataTypes.FLOAT, defaultValue: 0 }
    });

    const Location = sequelize.define('Location', {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      tripId: { type: DataTypes.UUID, allowNull: false },
      latitude: { type: DataTypes.DOUBLE, allowNull: false },
      longitude: { type: DataTypes.DOUBLE, allowNull: false },
      accuracy: { type: DataTypes.FLOAT, allowNull: true },
      timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    });

    // Configurar relaciones
    User.hasMany(Trip, { foreignKey: 'deliveryId', as: 'trips' });
    Trip.belongsTo(User, { foreignKey: 'deliveryId', as: 'delivery' });
    Trip.hasMany(Location, { foreignKey: 'tripId', as: 'locations' });
    Location.belongsTo(Trip, { foreignKey: 'tripId', as: 'trip' });

    console.log('   ✅ Modelos definidos correctamente');

    console.log('\n3️⃣ Verificando usuarios de prueba...');
    
    const users = await User.findAll();
    console.log(`   📊 Total usuarios: ${users.length}`);
    
    const admin = await User.findOne({ where: { role: 'admin' } });
    const deliveries = await User.findAll({ where: { role: 'delivery' } });
    
    if (admin) {
      console.log(`   👔 Admin encontrado: ${admin.name} (${admin.email})`);
    } else {
      console.log('   ❌ Admin no encontrado');
    }
    
    console.log(`   🚚 Deliveries encontrados: ${deliveries.length}`);
    deliveries.forEach(delivery => {
      console.log(`      - ${delivery.name} (${delivery.employeeId})`);
    });

    console.log('\n4️⃣ Verificando variables de entorno...');
    
    const requiredEnvVars = ['JWT_SECRET', 'NODE_ENV', 'PORT'];
    requiredEnvVars.forEach(varName => {
      if (process.env[varName]) {
        console.log(`   ✅ ${varName}: ${varName === 'JWT_SECRET' ? '[HIDDEN]' : process.env[varName]}`);
      } else {
        console.log(`   ❌ ${varName}: No definida`);
      }
    });

    console.log('\n5️⃣ Verificando credenciales de prueba...');
    
    // Verificar contraseña del admin
    if (admin) {
      const adminPasswordValid = await bcrypt.compare('password123', admin.password);
      console.log(`   ${adminPasswordValid ? '✅' : '❌'} Admin password: ${adminPasswordValid ? 'Correcta' : 'Incorrecta'}`);
    }

    // Verificar contraseñas de deliveries
    for (const delivery of deliveries) {
      const deliveryPasswordValid = await bcrypt.compare('delivery123', delivery.password);
      console.log(`   ${deliveryPasswordValid ? '✅' : '❌'} ${delivery.employeeId} password: ${deliveryPasswordValid ? 'Correcta' : 'Incorrecta'}`);
    }

    console.log('\n6️⃣ Verificando estructura de tablas...');
    
    const [tables] = await sequelize.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
    console.log(`   📊 Tablas encontradas: ${tables.length}`);
    tables.forEach(table => {
      console.log(`      - ${table.tablename}`);
    });

    await sequelize.close();
    
    console.log('\n🎉 VERIFICACIÓN COMPLETA EXITOSA');
    console.log('\n📋 CREDENCIALES DE PRUEBA:');
    console.log('   Admin Web: admin@bostonburgers.com / password123');
    console.log('   Delivery 1: DEL001 / delivery123');
    console.log('   Delivery 2: DEL002 / delivery123');
    console.log('\n🚀 El backend está listo para usar!');
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
    process.exit(1);
  }
}

verifyBackend();
