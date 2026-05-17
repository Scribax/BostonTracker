// ==========================================
// MODELS INDEX - Export all models
// ==========================================

import { sequelize } from '@config/database';

import User from './User';
import Trip from './Trip';
import Location from './Location';

// ==========================================
// DEFINE ASSOCIATIONS (solo una vez)
// ==========================================

// Verificar si las asociaciones ya existen antes de crearlas
function setupAssociations(): void {
  try {
    // User <-> Trip
    if (!User.associations['trips']) {
      User.hasMany(Trip, { foreignKey: 'deliveryId', as: 'trips' });
    }
    if (!Trip.associations['delivery']) {
      Trip.belongsTo(User, { foreignKey: 'deliveryId', as: 'delivery' });
    }

    // Trip <-> Location
    if (!Trip.associations['tripLocations']) {
      Trip.hasMany(Location, { foreignKey: 'tripId', as: 'tripLocations' });
    }
    if (!Location.associations['trip']) {
      Location.belongsTo(Trip, { foreignKey: 'tripId', as: 'trip' });
    }

    console.log('Model associations initialized');
  } catch (error) {
    console.log('Associations may already be initialized:', error);
  }
}

setupAssociations();

// ==========================================
// EXPORTS
// ==========================================

// Export models
export { User, Trip, Location, sequelize };

// Export types
export type { default as UserModel } from './User';
export type { default as TripModel } from './Trip';
export type { default as LocationModel } from './Location';

// ==========================================
// SYNC FUNCTION (opcional, para desarrollo)
// ==========================================

export async function syncDatabase(force: boolean = false): Promise<void> {
  try {
    await sequelize.sync({ force });
    console.log('✅ Database synchronized');
  } catch (error) {
    console.error('❌ Error syncing database:', error);
    throw error;
  }
}
