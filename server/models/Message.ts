import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Message extends Model {
  public id!: number;
  public conversationId!: number;
  public senderId!: number;
  public content!: string;
  public type!: 'text' | 'image' | 'file';
  public fileUrl!: string | null;
  public fileName!: string | null;
  public fileSize!: number | null;
  public edited!: boolean;
  public editedAt!: Date | null;
  public deleted!: boolean;
  public deletedAt!: Date | null;
  public readBy!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Message.init(
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
    senderId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'sender_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '',
    },
    type: {
      type: DataTypes.ENUM('text', 'image', 'file'),
      defaultValue: 'text',
    },
    fileUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'file_url',
    },
    fileName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'file_name',
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'file_size',
    },
    edited: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    editedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'edited_at',
    },
    deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at',
    },
    readBy: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '[]',
      field: 'read_by',
    },
  },
  {
    sequelize,
    tableName: 'messages',
    timestamps: true,
    underscored: true,
  }
);

export default Message;
