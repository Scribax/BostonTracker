const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

// Cargar variables de entorno
dotenv.config();

const createUsers = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Conectado a MongoDB');

    // Crear usuario administrador
    const admin = new User({
      name: 'Administrador Boston',
      email: 'admin@bostonburgers.com',
      password: 'password123',
      role: 'admin'
    });

    // Crear deliverys de ejemplo
    const deliveries = [
      {
        name: 'Juan Pérez',
        employeeId: 'DEL001',
        password: 'delivery123',
        role: 'delivery'
      },
      {
        name: 'María González',
        employeeId: 'DEL002',
        password: 'delivery123',
        role: 'delivery'
      },
      {
        name: 'Carlos Rodríguez',
        employeeId: 'DEL003',
        password: 'delivery123',
        role: 'delivery'
      }
    ];

    // Verificar si ya existen usuarios
    const existingAdmin = await User.findOne({ email: admin.email });
    if (!existingAdmin) {
      await admin.save();
      console.log('✅ Usuario administrador creado:', admin.email);
    } else {
      console.log('⚠️  Usuario administrador ya existe');
    }

    for (const deliveryData of deliveries) {
      const existingDelivery = await User.findOne({ employeeId: deliveryData.employeeId });
      if (!existingDelivery) {
        const delivery = new User(deliveryData);
        await delivery.save();
        console.log('✅ Delivery creado:', deliveryData.name, `(${deliveryData.employeeId})`);
      } else {
        console.log('⚠️  Delivery ya existe:', deliveryData.name);
      }
    }

    console.log('\n📋 Usuarios de prueba:');
    console.log('Admin: admin@bostonburgers.com / password123');
    console.log('Delivery 1: DEL001 / delivery123');
    console.log('Delivery 2: DEL002 / delivery123');
    console.log('Delivery 3: DEL003 / delivery123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creando usuarios:', error);
    process.exit(1);
  }
};

createUsers();
