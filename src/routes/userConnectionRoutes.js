import express from 'express';
import {
  sendInterest, respondToInterest,
  blockUser, unblockUser,
  getReceivedInterests, getSentInterests,
  getConnections, getBlockedUsers
} from '../controllers/userConnectionController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireCompleteProfile } from '../middleware/profileCompletionMiddleware.js';
import { requireOwnParam } from '../middleware/ownershipMiddleware.js';

const router = express.Router();

// POST   /api/v1/connections/:senderId/interest/:receiverId   - send interest
router.post('/:senderId/interest/:receiverId', authenticateToken, requireOwnParam('senderId'), requireCompleteProfile, sendInterest);

// PUT    /api/v1/connections/:receiverId/respond/:senderId    - accept or reject interest
router.put('/:receiverId/respond/:senderId', authenticateToken, requireOwnParam('receiverId'), respondToInterest);

// POST   /api/v1/connections/:senderId/block/:receiverId      - block user
router.post('/:senderId/block/:receiverId', authenticateToken, requireOwnParam('senderId'), blockUser);

// DELETE /api/v1/connections/:senderId/block/:receiverId      - unblock user
router.delete('/:senderId/block/:receiverId', authenticateToken, requireOwnParam('senderId'), unblockUser);

// GET    /api/v1/connections/:userId/interests/received       - get received interests
router.get('/:userId/interests/received', authenticateToken, requireOwnParam('userId'), getReceivedInterests);

// GET    /api/v1/connections/:userId/interests/sent           - get sent interests
router.get('/:userId/interests/sent', authenticateToken, requireOwnParam('userId'), getSentInterests);

// GET    /api/v1/connections/:userId                          - get all accepted connections
router.get('/:userId', authenticateToken, requireOwnParam('userId'), getConnections);

// GET    /api/v1/connections/:userId/blocked                  - get blocked users
router.get('/:userId/blocked', authenticateToken, requireOwnParam('userId'), getBlockedUsers);

export default router;
