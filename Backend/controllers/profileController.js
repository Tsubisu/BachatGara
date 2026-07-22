const profileService = require('../services/profileService');
const { catchAsync } = require('../middleware/errorHandler');

const get = catchAsync(async (req, res) => {
  const profile = await profileService.getProfile(req.user.id);
  res.json(profile);
});

const update = catchAsync(async (req, res) => {
  const updated = await profileService.updateProfile(req.user.id, req.body);
  res.json(updated);
});

module.exports = { get, update };
