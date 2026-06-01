import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Participant extends Model {
  public id!: number;
  public conversationId!: number;
  public userId!: number;
  public role!: 'admin' | 'member';
  public joinedAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Participant.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    conversationId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'conversation_id',
      references: {
        model: 'conversations',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    role: {
      type: DataTypes.ENUM('admin', 'member'),
      defaultValue: 'member',
    },
    joinedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'joined_at',
    },
  },
  {
    sequelize,
    tableName: 'participants',
    timestamps: true,
    underscored: true,
  }
);

export default Participant;
