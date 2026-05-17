const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'boston_tracker',
  process.env.DB_USER || 'boston_user', 
  process.env.DB_PASSWORD || 'boston123',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
);

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: true },
  employeeId: { type: DataTypes.STRING, unique: true, allowNull: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'delivery'), defaultValue: 'delivery' },
  phone: { type: DataTypes.STRING, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
});

async function resetPassword() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a PostgreSQL');
    
    const hashedPassword = await bcrypt.hash('delivery123', 10);
    
    const [updatedRowsCount] = await User.update(
      { password: hashedPassword },
      { where: { employeeId: 'DEL001' } }
    );
    
    if (updatedRowsCount > 0) {
      console.log('✅ Contraseña del delivery DEL001 actualizada');
    } else {
      console.log('❌ No se encontró usuario DEL001');
    }

    // Verificar usuario
    const user = await User.findOne({ 
      where: { employeeId: 'DEL001' },
      attributes: ['id', 'name', 'employeeId', 'role', 'isActive']
    });
    
    if (user) {
      console.log('👤 Usuario encontrado:', {
        id: user.id,
        name: user.name,
        employeeId: user.employeeId,
        role: user.role,
        isActive: user.isActive
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

resetPassword();
