// ==========================================
// TRIP MODEL - TypeScript + Sequelize
// ==========================================

import { DataTypes, Model } from 'sequelize';

import { sequelize } from '../config/database';
import type {
  TripAttributes,
  TripCreationAttributes,
  RealTimeMetrics,
  Location,
} from '../types/index';

// Helper function to calculate Haversine distance
function calculateHaversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

class Trip extends Model<TripAttributes, TripCreationAttributes> {
  // Virtual fields
  public locations?: Location[];

  // Instance methods
  public getDuration(): number {
    const end = (this as any).endTime || new Date();
    return Math.round((end.getTime() - (this as any).startTime.getTime()) / 1000 / 60); // minutes
  }

  public getAverageSpeed(): number {
    const duration = this.getDuration() / 60; // hours
    if (duration === 0) return 0;
    return Math.round(((this as any).mileage / duration) * 100) / 100;
  }

  public getRealTimeMetrics(): RealTimeMetrics {
    try {
      return JSON.parse((this as any).realTimeMetrics) as RealTimeMetrics;
    } catch {
      return {
        currentSpeed: 0,
        averageSpeed: 0,
        maxSpeed: 0,
        totalTime: 0,
        validLocations: 0,
      };
    }
  }

  public updateRealTimeMetrics(newMetrics: Partial<RealTimeMetrics>): void {
    const current = this.getRealTimeMetrics();
    const updated = { ...current, ...newMetrics };
    (this as any).realTimeMetrics = JSON.stringify(updated);
  }

  public setRealTimeMetrics(metrics: RealTimeMetrics): void {
    (this as any).realTimeMetrics = JSON.stringify(metrics);
  }

  // Calculate distance from array of locations
  public calculateDistance(locations: Location[]): number {
    if (!locations || locations.length < 2) return 0;

    let totalDistance = 0;

    for (let i = 1; i < locations.length; i++) {
      const prev = locations[i - 1];
      const curr = locations[i];

      const segmentDistance = calculateHaversineDistance(
        prev.latitude,
        prev.longitude,
        curr.latitude,
        curr.longitude
      );

      // Filter unrealistic jumps (more than 1km between consecutive points)
      if (segmentDistance < 1.0 && segmentDistance > 0.001) {
        totalDistance += segmentDistance;
      }
    }

    return totalDistance;
  }
}

Trip.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    deliveryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'completed', 'paused'),
      defaultValue: 'active',
      allowNull: false,
    },
    mileage: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    duration: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    averageSpeed: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      allowNull: false,
    },
    realTimeMetrics: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: JSON.stringify({
        currentSpeed: 0,
        averageSpeed: 0,
        maxSpeed: 0,
        totalTime: 0,
        validLocations: 0,
      }),
    },
    notes: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        len: { args: [0, 500], msg: 'Las notas no pueden exceder 500 caracteres' },
      },
    },
  },
  {
    sequelize,
    tableName: 'trips',
    timestamps: true,
    indexes: [
      { fields: ['deliveryId'] },
      { fields: ['status'] },
      { fields: ['startTime'] },
      { fields: ['deliveryId', 'startTime'] },
    ],
  }
);

export default Trip;
