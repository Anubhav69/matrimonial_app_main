import ChatService from '../services/chatService.js';

const getChatHistory = async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;
    const { page, limit } = req.query;
    const result = await ChatService.getChatHistory(userId, otherUserId, page, limit);
    res.status(200).json(result);
  } catch (error) {
    const statusCode = error.message.includes('only view') ? 403 : 500;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

const getConversations = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await ChatService.getConversations(userId);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const { userId, messageId } = req.params;
    const result = await ChatService.deleteMessage(userId, messageId);
    res.status(200).json(result);
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

export { getChatHistory, getConversations, deleteMessage };
