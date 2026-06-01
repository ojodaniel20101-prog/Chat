import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class User extends Model {
  public id!: number;
  public email!: string;
  public password!: string;
  public displayName!: string;
  public avatar!: string | null;
  public status!: 'online' | 'away' | 'offline';
  public lastSeen!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    displayName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'display_name',
    },
    avatar: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('online', 'away', 'offline'),
      defaultValue: 'offline',
    },
    lastSeen: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_seen',
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    underscored: true,
  }
);

export default User;
