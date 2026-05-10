import express from 'express';
import { getChatHistory, getConversations, deleteMessage } from '../controllers/chatController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET    /api/v1/chat/:userId/history/:otherUserId     - get chat history between two users
router.get('/:userId/history/:otherUserId', authenticateToken, getChatHistory);

// GET    /api/v1/chat/:userId/conversations            - get all conversations (inbox)
router.get('/:userId/conversations', authenticateToken, getConversations);

// DELETE /api/v1/chat/:userId/message/:messageId       - delete a message (sender only)
router.delete('/:userId/message/:messageId', authenticateToken, deleteMessage);

export default router;
