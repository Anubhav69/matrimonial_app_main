import { Op } from 'sequelize';
import { UserInteraction, User, UserProfile, UserPhoto } from '../models/index.js';
import { sequelize } from '../models/index.js';

const baseUrl = process.env.APP_URL || 'http://localhost:3000';

const formatUser = (user) => {
  const profile = user.UserProfile;
  const primaryPhoto = user.UserPhotos?.find(p => p.is_primary);
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    first_name: profile?.first_name || null,
    last_name: profile?.last_name || null,
    city: profile?.city || null,
    primary_photo: primaryPhoto ? `${baseUrl}/${primaryPhoto.photo_url}` : null,
  };
};

const userInclude = [
  { model: UserProfile, attributes: ['first_name', 'last_name', 'city'] },
  { model: UserPhoto, where: { is_primary: true }, required: false, attributes: ['photo_url', 'is_primary'] }
];

class UserConnectionService {

  // Send interest to another user
  static async sendInterest(senderId, receiverId) {
    if (senderId == receiverId)
      throw new Error('You cannot send interest to yourself');

    const receiver = await User.findOne({ where: { id: receiverId, is_deleted: false } });
    if (!receiver) throw new Error('User not found');

    const existing = await UserInteraction.findOne({
      where: { sender_id: senderId, receiver_id: receiverId }
    });
    if (existing) throw new Error(`You have already ${existing.type} this user`);

    // Check if receiver has blocked sender
    const blocked = await UserInteraction.findOne({
      where: { sender_id: receiverId, receiver_id: senderId, type: 'blocked' }
    });
    if (blocked) throw new Error('You cannot send interest to this user');

    const interaction = await UserInteraction.create({
      sender_id: senderId,
      receiver_id: receiverId,
      type: 'interest'
    });

    return { success: true, message: 'Interest sent successfully', data: interaction };
  }

  // Accept or reject an interest
  static async respondToInterest(receiverId, senderId, type) {
    if (!['accepted', 'rejected'].includes(type))
      throw new Error('Response type must be accepted or rejected');

    const interaction = await UserInteraction.findOne({
      where: { sender_id: senderId, receiver_id: receiverId, type: 'interest' }
    });
    if (!interaction) throw new Error('Interest request not found');

    await interaction.update({ type });

    return {
      success: true,
      message: `Interest ${type} successfully`,
      data: interaction
    };
  }

  // Block a user
  static async blockUser(senderId, receiverId) {
    if (senderId == receiverId)
      throw new Error('You cannot block yourself');

    const receiver = await User.findOne({ where: { id: receiverId, is_deleted: false } });
    if (!receiver) throw new Error('User not found');

    const existing = await UserInteraction.findOne({
      where: { sender_id: senderId, receiver_id: receiverId }
    });

    if (existing) {
      await existing.update({ type: 'blocked' });
    } else {
      await UserInteraction.create({ sender_id: senderId, receiver_id: receiverId, type: 'blocked' });
    }

    return { success: true, message: 'User blocked successfully' };
  }

  // Unblock a user
  static async unblockUser(senderId, receiverId) {
    const interaction = await UserInteraction.findOne({
      where: { sender_id: senderId, receiver_id: receiverId, type: 'blocked' }
    });
    if (!interaction) throw new Error('User is not blocked');

    await interaction.destroy();

    return { success: true, message: 'User unblocked successfully' };
  }

  // Get all interests received (pending)
  static async getReceivedInterests(userId) {
    const interactions = await UserInteraction.findAll({
      where: { receiver_id: userId, type: 'interest' },
      include: [{ model: User, as: 'Sender', include: userInclude }],
      order: [['created_at', 'DESC']]
    });

    return {
      success: true,
      data: interactions.map(i => ({
        interaction_id: i.id,
        created_at: i.created_at,
        sender: formatUser(i.Sender)
      }))
    };
  }

  // Get all interests sent
  static async getSentInterests(userId) {
    const interactions = await UserInteraction.findAll({
      where: { sender_id: userId, type: 'interest' },
      include: [{ model: User, as: 'Receiver', include: userInclude }],
      order: [['created_at', 'DESC']]
    });

    return {
      success: true,
      data: interactions.map(i => ({
        interaction_id: i.id,
        created_at: i.created_at,
        receiver: formatUser(i.Receiver)
      }))
    };
  }

  // Get all accepted connections (mutual)
  static async getConnections(userId) {
    const interactions = await UserInteraction.findAll({
      where: {
        type: 'accepted',
        [Op.or]: [{ sender_id: userId }, { receiver_id: userId }]
      },
      include: [
        { model: User, as: 'Sender', include: userInclude },
        { model: User, as: 'Receiver', include: userInclude }
      ],
      order: [['created_at', 'DESC']]
    });

    return {
      success: true,
      data: interactions.map(i => {
        const connectedUser = i.sender_id == userId ? i.Receiver : i.Sender;
        return {
          interaction_id: i.id,
          connected_at: i.created_at,
          user: formatUser(connectedUser)
        };
      })
    };
  }

  // Get all blocked users
  static async getBlockedUsers(userId) {
    const interactions = await UserInteraction.findAll({
      where: { sender_id: userId, type: 'blocked' },
      include: [{ model: User, as: 'Receiver', include: userInclude }],
      order: [['created_at', 'DESC']]
    });

    return {
      success: true,
      data: interactions.map(i => ({
        interaction_id: i.id,
        blocked_at: i.created_at,
        user: formatUser(i.Receiver)
      }))
    };
  }
}

export default UserConnectionService;
