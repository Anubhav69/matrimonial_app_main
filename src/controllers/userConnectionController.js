import UserConnectionService from '../services/userConnectionService.js';

const sendInterest = async (req, res) => {
  try {
    const { senderId, receiverId } = req.params;
    const result = await UserConnectionService.sendInterest(senderId, receiverId);
    res.status(201).json(result);
  } catch (error) {
    const statusCode = error.message === 'User not found' ? 404
      : error.message.includes('already') || error.message.includes('cannot') ? 409 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

const respondToInterest = async (req, res) => {
  try {
    const { receiverId, senderId } = req.params;
    const { type } = req.body;
    const result = await UserConnectionService.respondToInterest(receiverId, senderId, type);
    res.status(200).json(result);
  } catch (error) {
    const statusCode = error.message === 'Interest request not found' ? 404 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

const blockUser = async (req, res) => {
  try {
    const { senderId, receiverId } = req.params;
    const result = await UserConnectionService.blockUser(senderId, receiverId);
    res.status(200).json(result);
  } catch (error) {
    const statusCode = error.message === 'User not found' ? 404 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

const unblockUser = async (req, res) => {
  try {
    const { senderId, receiverId } = req.params;
    const result = await UserConnectionService.unblockUser(senderId, receiverId);
    res.status(200).json(result);
  } catch (error) {
    const statusCode = error.message === 'User is not blocked' ? 404 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

const getReceivedInterests = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await UserConnectionService.getReceivedInterests(userId);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getSentInterests = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await UserConnectionService.getSentInterests(userId);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getConnections = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await UserConnectionService.getConnections(userId);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getBlockedUsers = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await UserConnectionService.getBlockedUsers(userId);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export { sendInterest, respondToInterest, blockUser, unblockUser, getReceivedInterests, getSentInterests, getConnections, getBlockedUsers };
