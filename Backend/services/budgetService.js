const budgetRepo = require('../repositories/budgetRepository');
const userRepo = require('../repositories/userRepository');
const AppError = require('../utils/AppError');

const listPlans = async (userId) => {
  const plans = await budgetRepo.findPlansByUser(userId);
  if (!plans.length) return [];

  const planIds = plans.map(p => p.id);
  const allAllocations = await budgetRepo.findAllocationsByPlanIds(planIds);

  const allocationsByPlan = {};
  allAllocations.forEach(alloc => {
    if (!allocationsByPlan[alloc.plan_id]) allocationsByPlan[alloc.plan_id] = {};
    allocationsByPlan[alloc.plan_id][alloc.category_name] = parseFloat(alloc.amount_limit);
  });

  return plans.map(p => ({ ...p, allocations: allocationsByPlan[p.id] || {} }));
};

const createPlan = async (userId, { name, start_date, end_date, total_pool, allocations }) => {

  await budgetRepo.deactivateAllForUser(userId);

  const plan = await budgetRepo.createPlan(userId, { name, start_date, end_date, total_pool });

  if (allocations && Object.keys(allocations).length > 0) {
    await Promise.all(
      Object.entries(allocations).map(([cat, limit]) =>
        budgetRepo.createAllocation(plan.id, cat, limit)
      )
    );
  }

  return { ...plan, allocations: allocations || {} };
};

const rolloverPlan = async (planId, userId, { action, leftover_amount, target_plan_id }) => {
  const plan = await budgetRepo.findPlanById(planId, userId);
  if (!plan) throw new AppError('Budget plan not found.', 404);

  if (action === 'savings') {
    await userRepo.addToNetSavings(userId, leftover_amount);
  } else if (action === 'rollover') {
    const targetPlan = await budgetRepo.findPlanById(target_plan_id, userId);
    if (!targetPlan) throw new AppError('Target rollover plan not found.', 404);
    await budgetRepo.incrementPlanPool(target_plan_id, userId, leftover_amount);
  }

  await budgetRepo.setInactive(planId, userId);
};

const deletePlan = async (planId, userId) => {
  const deleted = await budgetRepo.removePlan(planId, userId);
  if (!deleted) throw new AppError('Budget plan not found or unauthorized.', 404);
};

module.exports = { listPlans, createPlan, rolloverPlan, deletePlan };
