import express from 'express';
import { getChatHistory, getConversations, deleteMessage } from '../controllers/chatController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireOwnParam } from '../middleware/ownershipMiddleware.js';

const router = express.Router();

// GET    /api/v1/chat/:userId/history/:otherUserId     - get chat history between two users
router.get('/:userId/history/:otherUserId', authenticateToken, requireOwnParam('userId'), getChatHistory);

// GET    /api/v1/chat/:userId/conversations            - get all conversations (inbox)
router.get('/:userId/conversations', authenticateToken, requireOwnParam('userId'), getConversations);

// DELETE /api/v1/chat/:userId/message/:messageId       - delete a message (sender only)
router.delete('/:userId/message/:messageId', authenticateToken, requireOwnParam('userId'), deleteMessage);

export default router;
