import express from 'express';
import upload from '../config/multer.js';
import { uploadPhotos, getPhotos, updatePhoto, deletePhoto } from '../controllers/userPhotoController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * User Photo Routes
 * Base path: /api/v1/photos
 * 
 * All routes require authentication via JWT token
 */

// POST   /api/v1/photos/:userId           - upload photos (max 5 files)
router.post('/:userId', authenticateToken, upload.array('photos', 5), uploadPhotos);

// GET    /api/v1/photos/:userId           - get all photos
router.get('/:userId', authenticateToken, getPhotos);

// PUT    /api/v1/photos/:userId/:photoId  - update photo (set as primary etc.)
router.put('/:userId/:photoId', authenticateToken, updatePhoto);

// DELETE /api/v1/photos/:userId/:photoId  - delete a photo
router.delete('/:userId/:photoId', authenticateToken, deletePhoto);

export default router;
