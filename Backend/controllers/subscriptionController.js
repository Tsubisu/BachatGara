const subService = require('../services/subscriptionService');
const { catchAsync } = require('../middleware/errorHandler');

const list = catchAsync(async (req, res) => {
  const subs = await subService.listSubscriptions(req.user.id);
  res.json(subs);
});

const create = catchAsync(async (req, res) => {
  const sub = await subService.createSubscription(req.user.id, req.body);
  res.status(201).json(sub);
});

const remove = catchAsync(async (req, res) => {
  await subService.deleteSubscription(req.params.id, req.user.id);
  res.json({ message: 'Subscription deleted successfully.' });
});

module.exports = { list, create, remove };
