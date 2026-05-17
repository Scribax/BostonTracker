// ==========================================
// DATABASE TYPES - SEQUELIZE MODELS
// ==========================================

import { Model, Optional, DataTypes } from 'sequelize';
import { UserRole, TripStatus } from './index';

// ==========================================
// USER MODEL TYPES
// ==========================================

export interface UserAttributes {
  id: string;
  name: string;
  email?: string;
  employeeId?: string;
  password: string;
  role: UserRole;
  phone?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export interface UserInstance extends Model<UserAttributes, UserCreationAttributes>, UserAttributes {
  matchPassword(password: string): Promise<boolean>;
}

// ==========================================
// TRIP MODEL TYPES
// ==========================================

export interface TripAttributes {
  id: string;
  deliveryId: string;
  startTime: Date;
  endTime?: Date;
  status: TripStatus;
  mileage: number;
  duration: number;
  averageSpeed: number;
  realTimeMetrics: string; // JSON string
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TripCreationAttributes extends Optional<TripAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export interface TripInstance extends Model<TripAttributes, TripCreationAttributes>, TripAttributes {
  getDuration(): number;
  getAverageSpeed(): number;
}

// ==========================================
// LOCATION MODEL TYPES
// ==========================================

export interface LocationAttributes {
  id: string;
  tripId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LocationCreationAttributes extends Optional<LocationAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export interface LocationInstance extends Model<LocationAttributes, LocationCreationAttributes>, LocationAttributes {}

// ==========================================
// SEQUELIZE CONFIGURATION
// ==========================================

export interface SequelizeConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  dialect: 'postgres';
  logging: boolean | ((sql: string) => void);
  pool?: {
    max: number;
    min: number;
    acquire: number;
    idle: number;
  };
}

// ==========================================
// MODEL DEFINITION HELPERS
// ==========================================

export type ModelDefinition<T extends Model> = {
  new (): T;
};

export interface DatabaseModels {
  User: ModelDefinition<UserInstance>;
  Trip: ModelDefinition<TripInstance>;
  Location: ModelDefinition<LocationInstance>;
}

// ==========================================
// MIGRATION TYPES
// ==========================================

export interface MigrationContext {
  context: {
    queryInterface: {
      createTable: (tableName: string, attributes: Record<string, unknown>) => Promise<void>;
      dropTable: (tableName: string) => Promise<void>;
      addColumn: (tableName: string, columnName: string, attributes: unknown) => Promise<void>;
      removeColumn: (tableName: string, columnName: string) => Promise<void>;
    };
    Sequelize: typeof DataTypes;
  };
}

export type Migration = {
  up: (context: MigrationContext) => Promise<void>;
  down: (context: MigrationContext) => Promise<void>;
};
