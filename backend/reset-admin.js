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

// Model definitions must match server-postgres.js
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

async function resetAdmin() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conectado a PostgreSQL');

        // Hash new password
        const hashedPassword = await bcrypt.hash('password123', 10);
        const adminEmail = 'admin@bostonburgers.com';

        // Try to find admin
        const adminUser = await User.findOne({ where: { email: adminEmail } });

        if (adminUser) {
            // Update existing admin
            await adminUser.update({
                password: hashedPassword,
                isActive: true,
                role: 'admin'
            });
            console.log('✅ Contraseña del administrador actualizada');
        } else {
            // Create new admin if not exists
            await User.create({
                name: 'Administrador Boston',
                email: adminEmail,
                password: hashedPassword,
                role: 'admin',
                isActive: true
            });
            console.log('✅ Usuario administrador creado nuevo');
        }

        // Verify
        const finalUser = await User.findOne({
            where: { email: adminEmail },
            attributes: ['id', 'name', 'email', 'role', 'isActive']
        });

        console.log('👤 Admin Status:', {
            email: finalUser.email,
            role: finalUser.role,
            isActive: finalUser.isActive
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await sequelize.close();
    }
}

resetAdmin();
