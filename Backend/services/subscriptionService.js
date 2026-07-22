const subRepo = require('../repositories/subscriptionRepository');
const AppError = require('../utils/AppError');

const listSubscriptions = (userId) => subRepo.findAllByUser(userId);

const createSubscription = (userId, data) => subRepo.create(userId, data);

const deleteSubscription = async (id, userId) => {
  const deleted = await subRepo.remove(id, userId);
  if (!deleted) throw new AppError('Subscription not found or unauthorized.', 404);
};

module.exports = { listSubscriptions, createSubscription, deleteSubscription };
