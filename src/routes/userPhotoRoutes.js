import express from 'express';
import upload from '../config/multer.js';
import { uploadPhotos, getPhotos, updatePhoto, deletePhoto } from '../controllers/userPhotoController.js';

const router = express.Router();

// POST   /api/v1/photos/:userId           - upload photos (max 5 files)
router.post('/:userId', upload.array('photos', 5), uploadPhotos);

// GET    /api/v1/photos/:userId           - get all photos
router.get('/:userId', getPhotos);

// PUT    /api/v1/photos/:userId/:photoId  - update photo (set as primary etc.)
router.put('/:userId/:photoId', updatePhoto);

// DELETE /api/v1/photos/:userId/:photoId  - delete a photo
router.delete('/:userId/:photoId', deletePhoto);

export default router;
