import UserPhotoService from '../services/userPhotoService.js';

const uploadPhotos = async (req, res) => {
  try {
    const { userId } = req.params;
    const { primary_index } = req.body; // index of file to mark as primary (0-based)

    const result = await UserPhotoService.uploadPhotos(userId, req.files, primary_index);
    res.status(201).json(result);
  } catch (error) {
    const statusCode = error.message.includes('already exists') ? 409
      : error.message.includes('Maximum') ? 422 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

const getPhotos = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await UserPhotoService.getPhotos(userId);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updatePhoto = async (req, res) => {
  try {
    const { userId, photoId } = req.params;
    const result = await UserPhotoService.updatePhoto(userId, photoId, req.body);
    res.status(200).json(result);
  } catch (error) {
    const statusCode = error.message === 'Photo not found' ? 404 : 400;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

const deletePhoto = async (req, res) => {
  try {
    const { userId, photoId } = req.params;
    const result = await UserPhotoService.deletePhoto(userId, photoId);
    res.status(200).json(result);
  } catch (error) {
    const statusCode = error.message === 'Photo not found' ? 404 : 500;
    res.status(statusCode).json({ success: false, error: error.message });
  }
};

export { uploadPhotos, getPhotos, updatePhoto, deletePhoto };
