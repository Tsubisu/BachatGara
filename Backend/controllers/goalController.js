const goalService = require('../services/goalService');
const { catchAsync } = require('../middleware/errorHandler');

const list = catchAsync(async (req, res) => {
  const goals = await goalService.listGoals(req.user.id);
  res.json(goals);
});

const create = catchAsync(async (req, res) => {
  const goal = await goalService.createGoal(req.user.id, req.body);
  res.status(201).json(goal);
});

const fund = catchAsync(async (req, res) => {
  await goalService.fundGoal(req.params.id, req.user.id, req.body);
  res.json({ message: 'Goal funded successfully.' });
});

const remove = catchAsync(async (req, res) => {
  await goalService.deleteGoal(req.params.id, req.user.id);
  res.json({ message: 'Goal deleted successfully.' });
});

module.exports = { list, create, fund, remove };
