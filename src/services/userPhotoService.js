import { UserPhoto } from '../models/index.js';
import { sequelize } from '../models/index.js';
import fs from 'fs';

const MAX_OTHER_PHOTOS = 4;

const cleanupUploadedFiles = (files = []) => {
  files.forEach((file) => {
    if (file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  });
};

class UserPhotoService {

  static async uploadPhotos(userId, files, primaryIndex) {
    if (!files || files.length === 0)
      throw new Error('No files uploaded');

    const hasPrimaryInRequest = primaryIndex !== undefined
      && primaryIndex !== null
      && primaryIndex !== ''
      && String(primaryIndex) !== '-1';
    const parsedPrimaryIndex = hasPrimaryInRequest ? parseInt(primaryIndex, 10) : null;

    if (hasPrimaryInRequest && (Number.isNaN(parsedPrimaryIndex) || parsedPrimaryIndex < 0 || parsedPrimaryIndex >= files.length)) {
      cleanupUploadedFiles(files);
      throw new Error(`primary_index ${primaryIndex} is out of range. You uploaded ${files.length} file(s)`);
    }

    const existing = await UserPhoto.findAll({ where: { user_id: userId } });
    const existingPrimary = existing.find(p => p.is_primary);
    const existingOthers = existing.filter(p => !p.is_primary);

    if (!existingPrimary && !hasPrimaryInRequest) {
      cleanupUploadedFiles(files);
      throw new Error('primary_index is required for the first upload. Please specify which photo is the primary photo');
    }

    const willReplacePrimary = Boolean(existingPrimary && hasPrimaryInRequest);
    const newOthersCount = files.length - (hasPrimaryInRequest ? 1 : 0);
    const oldPrimaryBecomesOtherCount = willReplacePrimary ? 1 : 0;

    if (existingOthers.length + oldPrimaryBecomesOtherCount + newOthersCount > MAX_OTHER_PHOTOS) {
      cleanupUploadedFiles(files);
      throw new Error(`Maximum ${MAX_OTHER_PHOTOS} non-primary photos allowed. You have ${existingOthers.length} already`);
    }

    const result = await sequelize.transaction(async (t) => {
      if (willReplacePrimary) {
        await UserPhoto.update(
          { is_primary: false },
          { where: { user_id: userId, is_primary: true }, transaction: t }
        );
      }

      return await UserPhoto.bulkCreate(
        files.map((file, i) => ({
          user_id: userId,
          photo_url: file.path,
          is_primary: hasPrimaryInRequest && parsedPrimaryIndex === i
        })),
        { transaction: t }
      );
    });

    return {
      success: true,
      message: 'Photos uploaded successfully',
      data: result
    };
  }

  static async getPhotos(userId) {
    const baseUrl = `${process.env.APP_URL || 'http://44.211.53.65:3000'}`;

    const photos = await UserPhoto.findAll({
      where: { user_id: userId },
      order: [['is_primary', 'DESC'], ['uploaded_at', 'ASC']]
    });

    const format = (photo) => ({
      ...photo.toJSON(),
      photo_url: `${baseUrl}/${photo.photo_url}`
    });

    return {
      success: true,
      data: {
        primary: photos.find(p => p.is_primary) ? format(photos.find(p => p.is_primary)) : null,
        others: photos.filter(p => !p.is_primary).map(format)
      }
    };
  }

  static async updatePhoto(userId, photoId, updateData) {
    const photo = await UserPhoto.findOne({ where: { id: photoId, user_id: userId } });
    if (!photo) throw new Error('Photo not found');

    // If setting as primary, unset existing primary first
    if (updateData.is_primary === true && !photo.is_primary) {
      await sequelize.transaction(async (t) => {
        await UserPhoto.update(
          { is_primary: false },
          { where: { user_id: userId, is_primary: true }, transaction: t }
        );
        await photo.update(updateData, { transaction: t });
      });
    } else {
      await photo.update(updateData);
    }

    return {
      success: true,
      message: 'Photo updated successfully',
      data: photo
    };
  }

  static async deletePhoto(userId, photoId) {
    const photo = await UserPhoto.findOne({ where: { id: photoId, user_id: userId } });
    if (!photo) throw new Error('Photo not found');

    // Delete file from disk
    if (photo.photo_url && fs.existsSync(photo.photo_url)) {
      fs.unlinkSync(photo.photo_url);
    }

    await photo.destroy();

    return {
      success: true,
      message: 'Photo deleted successfully'
    };
  }
}

export default UserPhotoService;
