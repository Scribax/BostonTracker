// ==========================================
// USER MODEL - TypeScript + Sequelize
// ==========================================

import { DataTypes, Model } from 'sequelize';
import bcrypt from 'bcryptjs';

import { sequelize } from '@config/database';
import {
  UserAttributes,
  UserCreationAttributes,
  UserInstance,
} from '@types/database';

class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: string;
  public name!: string;
  public email?: string;
  public employeeId?: string;
  public password!: string;
  public role!: 'admin' | 'delivery';
  public phone?: string;
  public isActive!: boolean;
  public lastLogin?: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public async matchPassword(enteredPassword: string): Promise<boolean> {
    return bcrypt.compare(enteredPassword, this.password);
  }

  public toJSON(): Omit<UserAttributes, 'password'> {
    const values = { ...this.get() } as UserAttributes;
    delete values.password;
    return values;
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El nombre es requerido' },
        len: { args: [2, 100], msg: 'El nombre debe tener entre 2 y 100 caracteres' },
      },
    },
    email: {
      type: DataTypes.STRING(100),
      unique: true,
      allowNull: true,
      validate: {
        isEmail: { msg: 'Email inválido' },
      },
    },
    employeeId: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'La contraseña es requerida' },
        len: { args: [6, 255], msg: 'La contraseña debe tener al menos 6 caracteres' },
      },
    },
    role: {
      type: DataTypes.ENUM('admin', 'delivery'),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El rol es requerido' },
      },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    indexes: [
      { fields: ['email'] },
      { fields: ['employeeId'] },
      { fields: ['role'] },
      { fields: ['isActive'] },
    ],
    hooks: {
      beforeSave: async (user: User) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

export default User;
