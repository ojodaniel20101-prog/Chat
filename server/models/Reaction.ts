import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Reaction extends Model {
  public id!: number;
  public messageId!: number;
  public userId!: number;
  public emoji!: string;
  public readonly createdAt!: Date;
}

Reaction.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    messageId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'message_id',
      references: {
        model: 'messages',
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
    emoji: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'reactions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    underscored: true,
  }
);

export default Reaction;
