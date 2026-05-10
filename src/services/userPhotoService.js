import { UserPhoto } from '../models/index.js';
import { sequelize } from '../models/index.js';
import fs from 'fs';

const MAX_OTHER_PHOTOS = 4;

class UserPhotoService {

  static async uploadPhotos(userId, files, primaryIndex) {
    if (!files || files.length === 0)
      throw new Error('No files uploaded');

    const hasPrimaryInRequest = primaryIndex !== undefined && primaryIndex !== null && primaryIndex !== -1;

    if (!hasPrimaryInRequest)
      throw new Error('primary_index is required. Please specify which photo is the primary photo');

    if (parseInt(primaryIndex) >= files.length)
      throw new Error(`primary_index ${primaryIndex} is out of range. You uploaded ${files.length} file(s)`);

    const existing = await UserPhoto.findAll({ where: { user_id: userId } });
    const existingPrimary = existing.find(p => p.is_primary);
    const existingOthers = existing.filter(p => !p.is_primary);

    if (hasPrimaryInRequest && existingPrimary)
      throw new Error('A primary photo already exists. Update it instead of uploading a new one');

    const newOthersCount = hasPrimaryInRequest ? files.length - 1 : files.length;
    if (existingOthers.length + newOthersCount > MAX_OTHER_PHOTOS) {
      // Delete uploaded files since we're rejecting
      files.forEach(f => fs.existsSync(f.path) && fs.unlinkSync(f.path));
      throw new Error(`Maximum ${MAX_OTHER_PHOTOS} non-primary photos allowed. You have ${existingOthers.length} already`);
    }

    const result = await sequelize.transaction(async (t) => {
      return await UserPhoto.bulkCreate(
        files.map((file, i) => ({
          user_id: userId,
          photo_url: file.path,
          is_primary: hasPrimaryInRequest && parseInt(primaryIndex) === i
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
    const baseUrl = `${process.env.APP_URL || 'http://localhost:3000'}`;

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
