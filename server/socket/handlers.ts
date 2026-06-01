import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Message, User, Reaction } from '../models';

const JWT_SECRET = process.env.JWT_SECRET || 'zentrix-chat-secret-key-change-in-production';

interface SocketUser {
  id: number;
  email: string;
  displayName: string;
}

export const setupSocketHandlers = (io: Server) => {
  // Middleware to authenticate socket connections
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as SocketUser;
      socket.data.user = decoded;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as SocketUser;
    console.log(`User connected: ${user.displayName} (${user.id})`);

    // Join user's personal room for direct messages
    socket.join(`user_${user.id}`);

    // Update user status to online
    User.update({ status: 'online', lastSeen: new Date() }, { where: { id: user.id } });

    // Broadcast status change to all users
    io.emit('user:status_change', {
      userId: user.id,
      status: 'online',
    });

    // Join a conversation room
    socket.on('conversation:join', (conversationId: number) => {
      socket.join(`conversation_${conversationId}`);
      console.log(`User ${user.id} joined conversation ${conversationId}`);
    });

    // Leave a conversation room
    socket.on('conversation:leave', (conversationId: number) => {
      socket.leave(`conversation_${conversationId}`);
    });

    // Send message
    socket.on(
      'message:send',
      async (data: {
        conversationId: number;
        content: string;
        type?: string;
        fileUrl?: string;
        fileName?: string;
        fileSize?: number;
      }) => {
        try {
          const message = await Message.create({
            conversationId: data.conversationId,
            senderId: user.id,
            content: data.content || '',
            type: data.type || 'text',
            fileUrl: data.fileUrl || null,
            fileName: data.fileName || null,
            fileSize: data.fileSize || null,
          });

          const fullMessage = await Message.findByPk(message.id, {
            include: [
              {
                model: User,
                as: 'sender',
                attributes: ['id', 'displayName', 'avatar'],
              },
            ],
          });

          // Broadcast to conversation room
          io.to(`conversation_${data.conversationId}`).emit('message:receive', fullMessage);

          // Notify all participants
          socket.to(`conversation_${data.conversationId}`).emit('message:notification', {
            conversationId: data.conversationId,
            message: fullMessage,
          });
        } catch (error) {
          console.error('Send message error:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      }
    );

    // Typing indicator
    socket.on(
      'typing:start',
      (data: { conversationId: number; userName: string }) => {
        socket.to(`conversation_${data.conversationId}`).emit('typing:start', {
          userId: user.id,
          userName: data.userName,
        });
      }
    );

    socket.on('typing:stop', (data: { conversationId: number }) => {
      socket.to(`conversation_${data.conversationId}`).emit('typing:stop', {
        userId: user.id,
      });
    });

    // Message read
    socket.on(
      'message:read',
      async (data: { messageId: number; conversationId: number }) => {
        try {
          const message = await Message.findByPk(data.messageId);
          if (message) {
            const readBy = JSON.parse(message.readBy);
            if (!readBy.includes(user.id)) {
              readBy.push(user.id);
              await message.update({ readBy: JSON.stringify(readBy) });
            }

            io.to(`conversation_${data.conversationId}`).emit('message:read_update', {
              messageId: data.messageId,
              readBy,
            });
          }
        } catch (error) {
          console.error('Read receipt error:', error);
        }
      }
    );

    // Edit message
    socket.on(
      'message:edit',
      async (data: { messageId: number; conversationId: number; content: string }) => {
        try {
          const message = await Message.findOne({
            where: { id: data.messageId, sender_id: user.id },
          });

          if (message) {
            await message.update({
              content: data.content,
              edited: true,
              editedAt: new Date(),
            });

            const updated = await Message.findByPk(data.messageId, {
              include: [
                {
                  model: User,
                  as: 'sender',
                  attributes: ['id', 'displayName', 'avatar'],
                },
              ],
            });

            io.to(`conversation_${data.conversationId}`).emit('message:edited', updated);
          }
        } catch (error) {
          console.error('Edit message error:', error);
        }
      }
    );

    // Delete message
    socket.on(
      'message:delete',
      async (data: { messageId: number; conversationId: number }) => {
        try {
          const message = await Message.findOne({
            where: { id: data.messageId, sender_id: user.id },
          });

          if (message) {
            await message.update({
              deleted: true,
              deletedAt: new Date(),
              content: '',
            });

            io.to(`conversation_${data.conversationId}`).emit('message:deleted', {
              messageId: data.messageId,
            });
          }
        } catch (error) {
          console.error('Delete message error:', error);
        }
      }
    );

    // Reaction
    socket.on(
      'reaction:toggle',
      async (data: { messageId: number; conversationId: number; emoji: string }) => {
        try {
          const existing = await Reaction.findOne({
            where: { message_id: data.messageId, user_id: user.id, emoji: data.emoji },
          });

          let action: 'added' | 'removed';
          if (existing) {
            await existing.destroy();
            action = 'removed';
          } else {
            await Reaction.create({
              messageId: data.messageId,
              userId: user.id,
              emoji: data.emoji,
            });
            action = 'added';
          }

          io.to(`conversation_${data.conversationId}`).emit('reaction:update', {
            messageId: data.messageId,
            userId: user.id,
            emoji: data.emoji,
            action,
          });
        } catch (error) {
          console.error('Reaction error:', error);
        }
      }
    );

    // Update status
    socket.on('user:status', async (data: { status: 'online' | 'away' | 'offline' }) => {
      try {
        await User.update(
          { status: data.status, lastSeen: new Date() },
          { where: { id: user.id } }
        );

        io.emit('user:status_change', {
          userId: user.id,
          status: data.status,
        });
      } catch (error) {
        console.error('Status update error:', error);
      }
    });

    // Disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${user.displayName} (${user.id})`);

      await User.update(
        { status: 'offline', lastSeen: new Date() },
        { where: { id: user.id } }
      );

      io.emit('user:status_change', {
        userId: user.id,
        status: 'offline',
      });
    });
  });
};
