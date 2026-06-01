import { Router } from 'express';
import { Op } from 'sequelize';
import { Conversation, Participant, User, Message } from '../models';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all conversations for current user
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const participants = await Participant.findAll({
      where: { user_id: req.user!.id },
      include: [
        {
          model: Conversation,
          as: 'conversation',
          include: [
            {
              model: Participant,
              as: 'participants',
              include: [
                {
                  model: User,
                  as: 'user',
                  attributes: ['id', 'displayName', 'email', 'avatar', 'status', 'lastSeen'],
                },
              ],
            },
            {
              model: Message,
              as: 'messages',
              limit: 1,
              order: [['created_at', 'DESC']],
              include: [
                {
                  model: User,
                  as: 'sender',
                  attributes: ['id', 'displayName'],
                },
              ],
            },
          ],
        },
      ],
      order: [['joined_at', 'DESC']],
    });

    const conversations = participants.map((p) => {
      const conv = (p as any).conversation as any;
      const lastMessage = conv.messages?.[0];
      const otherParticipant = conv.participants?.find(
        (part: any) => part.user_id !== req.user!.id
      );

      return {
        id: conv.id,
        type: conv.type,
        name: conv.type === 'group' ? conv.name : otherParticipant?.user?.displayName,
        avatar: conv.type === 'group' ? conv.avatar : otherParticipant?.user?.avatar,
        status: conv.type === 'direct' ? otherParticipant?.user?.status : null,
        lastSeen: conv.type === 'direct' ? otherParticipant?.user?.lastSeen : null,
        participants: conv.participants?.map((part: any) => ({
          id: part.user?.id,
          displayName: part.user?.displayName,
          avatar: part.user?.avatar,
          status: part.user?.status,
          role: part.role,
        })),
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.content,
              senderName: lastMessage.sender?.displayName,
              createdAt: lastMessage.created_at,
              type: lastMessage.type,
            }
          : null,
        unreadCount: 0, // Will be calculated separately
      };
    });

    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create direct conversation
router.post('/direct', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.body;

    // Check if conversation already exists
    const existingParticipants = await Participant.findAll({
      where: { user_id: [req.user!.id, userId] },
      include: [
        {
          model: Conversation,
          as: 'conversation',
          where: { type: 'direct' },
        },
      ],
    });

    const conversationIds = existingParticipants.map((p) => (p as any).conversationId);
    const commonConversation = conversationIds.find(
      (id, index) => conversationIds.indexOf(id) !== index
    );

    if (commonConversation) {
      const conv = await Conversation.findByPk(commonConversation, {
        include: [
          {
            model: Participant,
            as: 'participants',
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'displayName', 'email', 'avatar', 'status', 'lastSeen'],
              },
            ],
          },
        ],
      });
      return res.json(conv);
    }

    // Create new direct conversation
    const conversation = await Conversation.create({ type: 'direct' });
    await Participant.create({
      conversationId: conversation.id,
      userId: req.user!.id,
      role: 'admin',
    });
    await Participant.create({
      conversationId: conversation.id,
      userId,
      role: 'member',
    });

    const fullConv = await Conversation.findByPk(conversation.id, {
      include: [
        {
          model: Participant,
          as: 'participants',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'displayName', 'email', 'avatar', 'status', 'lastSeen'],
            },
          ],
        },
      ],
    });

    res.status(201).json(fullConv);
  } catch (error) {
    console.error('Create direct conversation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create group conversation
router.post('/group', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, memberIds } = req.body;

    const conversation = await Conversation.create({
      type: 'group',
      name,
      createdBy: req.user!.id,
    });

    // Add creator as admin
    await Participant.create({
      conversationId: conversation.id,
      userId: req.user!.id,
      role: 'admin',
    });

    // Add members
    for (const userId of memberIds) {
      await Participant.create({
        conversationId: conversation.id,
        userId,
        role: 'member',
      });
    }

    const fullConv = await Conversation.findByPk(conversation.id, {
      include: [
        {
          model: Participant,
          as: 'participants',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'displayName', 'email', 'avatar', 'status', 'lastSeen'],
            },
          ],
        },
      ],
    });

    res.status(201).json(fullConv);
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Leave group
router.post('/:id/leave', authMiddleware, async (req: AuthRequest, res) => {
  try {
    await Participant.destroy({
      where: {
        conversation_id: req.params.id,
        user_id: req.user!.id,
      },
    });
    res.json({ message: 'Left group' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
