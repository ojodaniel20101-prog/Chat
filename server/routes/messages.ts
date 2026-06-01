import { Router } from 'express';
import { Op } from 'sequelize';
import { Message, Reaction, User } from '../models';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router({ mergeParams: true });

// Get messages for a conversation
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { conversationId } = req.params;
    const { page = '1', limit = '50' } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const messages = await Message.findAll({
      where: {
        conversation_id: conversationId as string,
        deleted: false,
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'displayName', 'avatar'],
        },
        {
          model: Reaction,
          as: 'reactions',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'displayName'],
            },
          ],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit as string),
      offset,
    });

    res.json(messages.reverse());
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search messages
router.get('/search', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { conversationId } = req.params;
    const { q } = req.query;

    if (!q) return res.json([]);

    const messages = await Message.findAll({
      where: {
        conversation_id: conversationId as string,
        deleted: false,
        content: { [Op.like]: `%${q}%` },
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'displayName', 'avatar'],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: 20,
    });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Send message (REST fallback)
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { conversationId } = req.params;
    const { content, type = 'text', fileUrl, fileName, fileSize } = req.body;

    const message = await Message.create({
      conversationId: parseInt(Array.isArray(conversationId) ? conversationId[0] : conversationId),
      senderId: req.user!.id,
      content: content || '',
      type,
      fileUrl,
      fileName,
      fileSize,
    });

    const fullMessage = await Message.findByPk(message.id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'displayName', 'avatar'],
        },
        {
          model: Reaction,
          as: 'reactions',
        },
      ],
    });

    res.status(201).json(fullMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Edit message
router.put('/:messageId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    const message = await Message.findOne({
      where: { id: Array.isArray(messageId) ? messageId[0] : messageId, sender_id: req.user!.id },
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    await message.update({
      content,
      edited: true,
      editedAt: new Date(),
    });

    const updated = await Message.findByPk(message.id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'displayName', 'avatar'],
        },
        {
          model: Reaction,
          as: 'reactions',
        },
      ],
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete message (soft delete)
router.delete('/:messageId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findOne({
      where: { id: Array.isArray(messageId) ? messageId[0] : messageId, sender_id: req.user!.id },
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    await message.update({
      deleted: true,
      deletedAt: new Date(),
      content: '',
    });

    res.json({ message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add reaction
router.post('/:messageId/reactions', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    // Check if user already reacted with this emoji
    const existing = await Reaction.findOne({
      where: { message_id: messageId, user_id: req.user!.id, emoji },
    });

    if (existing) {
      await existing.destroy();
      return res.json({ action: 'removed' });
    }

    const reaction = await Reaction.create({
      messageId: parseInt(Array.isArray(messageId) ? messageId[0] : messageId),
      userId: req.user!.id,
      emoji,
    });

    res.status(201).json(reaction);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
