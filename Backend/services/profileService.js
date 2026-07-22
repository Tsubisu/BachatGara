const bcrypt = require('bcrypt');
const userRepo = require('../repositories/userRepository');
const AppError = require('../utils/AppError');

const getProfile = async (userId) => {
  const user = await userRepo.findById(userId);
  if (!user) throw new AppError('User not found.', 404);
  return user;
};

const updateProfile = async (userId, fields) => {
  const updates = {
    profile_name: fields.profile_name,
    theme: fields.theme,
    net_savings: fields.net_savings,
  };

  // If email or password is changing, we need to verify current_password
  const isChangingEmail = fields.email && fields.email.trim() !== '';
  const isChangingPassword = fields.new_password && fields.new_password.trim() !== '';

  if (isChangingEmail || isChangingPassword) {
    const user = await userRepo.findByIdWithPassword(userId);
    if (!user) throw new AppError('User not found.', 404);

    // Verify current password
    const isMatch = await bcrypt.compare(fields.current_password, user.password_hash);
    if (!isMatch) throw new AppError('Incorrect current password.', 400);

    if (isChangingEmail) {
      const normalizedEmail = fields.email.trim().toLowerCase();
      // Check if new email is already taken
      if (normalizedEmail !== user.email.toLowerCase()) {
        const existing = await userRepo.findByEmail(normalizedEmail);
        if (existing) {
          throw new AppError('An account with this email address already exists.', 400);
        }
        updates.email = normalizedEmail;
      }
    }

    if (isChangingPassword) {
      updates.password_hash = await bcrypt.hash(fields.new_password, 10);
    }
  }

  const updated = await userRepo.updateById(userId, updates);
  if (!updated) throw new AppError('User not found.', 404);
  return updated;
};

module.exports = { getProfile, updateProfile };
