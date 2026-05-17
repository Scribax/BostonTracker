// ==========================================
// DATABASE CONFIGURATION
// Configuración de Sequelize con PostgreSQL
// ==========================================

import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

import type { DatabaseConfig } from '../types/index';

dotenv.config();

const dbConfig: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  name: process.env.DB_NAME || 'boston_tracker',
  user: process.env.DB_USER || 'boston_user',
  password: process.env.DB_PASSWORD || 'boston123',
  ssl: process.env.DB_SSL === 'true',
};

export const sequelize = new Sequelize(
  dbConfig.name,
  dbConfig.user,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: dbConfig.ssl
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : {},
  }
);

// ==========================================
// CONNECTION TEST
// ==========================================

export const testConnection = async (): Promise<boolean> => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    return false;
  }
};

// ==========================================
// SYNC DATABASE
// ==========================================

export const syncDatabase = async (force = false): Promise<void> => {
  try {
    await sequelize.sync({ force });
    console.log(`✅ Database synchronized${force ? ' (force mode)' : ''}`);
  } catch (error) {
    console.error('❌ Error synchronizing database:', error);
    throw error;
  }
};

export default sequelize;
