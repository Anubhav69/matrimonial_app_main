import express from 'express';
import {
  sendInterest, respondToInterest,
  blockUser, unblockUser,
  getReceivedInterests, getSentInterests,
  getConnections, getBlockedUsers
} from '../controllers/userConnectionController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST   /api/v1/connections/:senderId/interest/:receiverId   - send interest
router.post('/:senderId/interest/:receiverId', authenticateToken, sendInterest);

// PUT    /api/v1/connections/:receiverId/respond/:senderId    - accept or reject interest
router.put('/:receiverId/respond/:senderId', authenticateToken, respondToInterest);

// POST   /api/v1/connections/:senderId/block/:receiverId      - block user
router.post('/:senderId/block/:receiverId', authenticateToken, blockUser);

// DELETE /api/v1/connections/:senderId/block/:receiverId      - unblock user
router.delete('/:senderId/block/:receiverId', authenticateToken, unblockUser);

// GET    /api/v1/connections/:userId/interests/received       - get received interests
router.get('/:userId/interests/received', authenticateToken, getReceivedInterests);

// GET    /api/v1/connections/:userId/interests/sent           - get sent interests
router.get('/:userId/interests/sent', authenticateToken, getSentInterests);

// GET    /api/v1/connections/:userId                          - get all accepted connections
router.get('/:userId', authenticateToken, getConnections);

// GET    /api/v1/connections/:userId/blocked                  - get blocked users
router.get('/:userId/blocked', authenticateToken, getBlockedUsers);

export default router;
