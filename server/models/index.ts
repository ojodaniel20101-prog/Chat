import User from './User';
import Conversation from './Conversation';
import Participant from './Participant';
import Message from './Message';
import Reaction from './Reaction';

// User associations
User.hasMany(Participant, { foreignKey: 'user_id', as: 'participants' });
User.hasMany(Message, { foreignKey: 'sender_id', as: 'messages' });

// Conversation associations
Conversation.hasMany(Participant, { foreignKey: 'conversation_id', as: 'participants' });
Conversation.hasMany(Message, { foreignKey: 'conversation_id', as: 'messages' });

// Participant associations
Participant.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Participant.belongsTo(Conversation, { foreignKey: 'conversation_id', as: 'conversation' });

// Message associations
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });
Message.belongsTo(Conversation, { foreignKey: 'conversation_id', as: 'conversation' });
Message.hasMany(Reaction, { foreignKey: 'message_id', as: 'reactions' });

// Reaction associations
Reaction.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Reaction.belongsTo(Message, { foreignKey: 'message_id', as: 'message' });

export { User, Conversation, Participant, Message, Reaction };
