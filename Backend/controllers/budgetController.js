const budgetService = require('../services/budgetService');
const { catchAsync } = require('../middleware/errorHandler');

const listPlans = catchAsync(async (req, res) => {
  const plans = await budgetService.listPlans(req.user.id);
  res.json(plans);
});

const createPlan = catchAsync(async (req, res) => {
  const plan = await budgetService.createPlan(req.user.id, req.body);
  res.status(201).json(plan);
});

const rolloverPlan = catchAsync(async (req, res) => {
  await budgetService.rolloverPlan(req.params.id, req.user.id, req.body);
  res.json({ message: 'Plan rolled over successfully.' });
});

const deletePlan = catchAsync(async (req, res) => {
  await budgetService.deletePlan(req.params.id, req.user.id);
  res.json({ message: 'Budget plan deleted successfully.' });
});

module.exports = { listPlans, createPlan, rolloverPlan, deletePlan };
