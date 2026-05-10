import { Op } from 'sequelize';
import { Message, UserInteraction, User, UserProfile, UserPhoto } from '../models/index.js';

const baseUrl = process.env.APP_URL || 'http://localhost:3000';

// Check if two users have an accepted connection
const areConnected = async (userA, userB) => {
  const connection = await UserInteraction.findOne({
    where: {
      type: 'accepted',
      [Op.or]: [
        { sender_id: userA, receiver_id: userB },
        { sender_id: userB, receiver_id: userA },
      ],
    },
  });
  return !!connection;
};

class ChatService {

  // Get full chat history between two users (paginated)
  static async getChatHistory(userId, otherUserId, page = 1, limit = 20) {
    const connected = await areConnected(userId, otherUserId);
    if (!connected)
      throw new Error('You can only view chats with connected users');

    const offset = (page - 1) * limit;

    const { count, rows } = await Message.findAndCountAll({
      where: {
        [Op.or]: [
          { sender_id: userId, receiver_id: otherUserId },
          { sender_id: otherUserId, receiver_id: userId },
        ],
      },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Mark unread messages as read (messages sent to userId)
    await Message.update(
      { is_read: true },
      {
        where: {
          sender_id: otherUserId,
          receiver_id: userId,
          is_read: false,
        },
      }
    );

    return {
      success: true,
      data: rows.reverse(), // oldest first
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        total_pages: Math.ceil(count / limit),
      },
    };
  }

  // Get all conversations (inbox) for a user
  static async getConversations(userId) {
    // Get all users this person has exchanged messages with
    const messages = await Message.findAll({
      where: {
        [Op.or]: [{ sender_id: userId }, { receiver_id: userId }],
      },
      attributes: ['sender_id', 'receiver_id', 'message', 'is_read', 'created_at'],
      order: [['created_at', 'DESC']],
    });

    // Build unique conversation list with latest message per user
    const seen = new Map();
    for (const msg of messages) {
      const otherUserId = msg.sender_id == userId ? msg.receiver_id : msg.sender_id;
      if (!seen.has(String(otherUserId))) {
        seen.set(String(otherUserId), msg);
      }
    }

    // Fetch user details for each conversation partner
    const otherUserIds = [...seen.keys()];
    const users = await User.findAll({
      where: { id: { [Op.in]: otherUserIds } },
      attributes: ['id', 'email', 'phone'],
      include: [
        { model: UserProfile, attributes: ['first_name', 'last_name', 'city'] },
        {
          model: UserPhoto,
          where: { is_primary: true },
          required: false,
          attributes: ['photo_url'],
        },
      ],
    });

    const userMap = {};
    users.forEach(u => { userMap[u.id] = u; });

    // Count unread messages per conversation
    const unreadCounts = await Message.findAll({
      where: { receiver_id: userId, is_read: false },
      attributes: ['sender_id', [Message.sequelize.fn('COUNT', Message.sequelize.col('id')), 'unread_count']],
      group: ['sender_id'],
    });
    const unreadMap = {};
    unreadCounts.forEach(r => { unreadMap[r.sender_id] = parseInt(r.get('unread_count')); });

    const conversations = otherUserIds.map(otherId => {
      const lastMsg = seen.get(otherId);
      const user = userMap[otherId];
      const profile = user?.UserProfile;
      const photo = user?.UserPhotos?.[0];
      return {
        user: {
          id: user?.id,
          first_name: profile?.first_name || null,
          last_name: profile?.last_name || null,
          city: profile?.city || null,
          primary_photo: photo ? `${baseUrl}/${photo.photo_url}` : null,
        },
        last_message: lastMsg.message,
        last_message_at: lastMsg.created_at,
        unread_count: unreadMap[otherId] || 0,
      };
    });

    return { success: true, data: conversations };
  }

  // Delete a message (only sender can delete)
  static async deleteMessage(userId, messageId) {
    const msg = await Message.findOne({ where: { id: messageId, sender_id: userId } });
    if (!msg) throw new Error('Message not found or you are not the sender');

    await msg.destroy();
    return { success: true, message: 'Message deleted successfully' };
  }
}

export default ChatService;
