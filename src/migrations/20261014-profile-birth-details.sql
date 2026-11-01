-- Apply before deploying the updated API. Existing users supply gotra on next edit.
ALTER TABLE user_profiles
  ADD COLUMN birth_time VARCHAR(5) NULL,
  ADD COLUMN birth_place VARCHAR(100) NULL,
  ADD COLUMN gotra VARCHAR(100) NULL,
  ADD COLUMN profile_status ENUM('pending', 'published', 'rejected') DEFAULT 'pending';