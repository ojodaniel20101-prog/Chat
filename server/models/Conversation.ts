import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Conversation extends Model {
  public id!: number;
  public type!: 'direct' | 'group';
  public name!: string | null;
  public avatar!: string | null;
  public createdBy!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Conversation.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM('direct', 'group'),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    avatar: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'created_by',
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'conversations',
    timestamps: true,
    underscored: true,
  }
);

export default Conversation;
