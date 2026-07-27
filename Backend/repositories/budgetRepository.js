const db = require('../db');

const findPlansByUser = (userId) =>
  db.query('SELECT * FROM budget_plans WHERE user_id = $1 ORDER BY start_date DESC', [userId]).then(r => r.rows);

const findPlanById = (id, userId) =>
  db.query('SELECT * FROM budget_plans WHERE id = $1 AND user_id = $2', [id, userId]).then(r => r.rows[0]);

const createPlan = (userId, { name, start_date, end_date, total_pool }) =>
  db.query(
    `INSERT INTO budget_plans (user_id, name, start_date, end_date, total_pool, active)
     VALUES ($1, $2, $3, $4, $5, true) RETURNING *`,
    [userId, name, start_date, end_date, total_pool]
  ).then(r => r.rows[0]);

const deactivateAllForUser = (userId) =>
  db.query('UPDATE budget_plans SET active = false WHERE user_id = $1', [userId]);

const incrementPlanPool = (planId, userId, amount) =>
  db.query(
    'UPDATE budget_plans SET total_pool = total_pool + $1 WHERE id = $2 AND user_id = $3',
    [amount, planId, userId]
  );

const setInactive = (planId, userId) =>
  db.query('UPDATE budget_plans SET active = false WHERE id = $1 AND user_id = $2', [planId, userId]);

const removePlan = (planId, userId) =>
  db.query('DELETE FROM budget_plans WHERE id = $1 AND user_id = $2 RETURNING id', [planId, userId]).then(r => r.rows[0]);

const findAllocationsByPlanIds = (planIds) =>
  db.query('SELECT * FROM budget_allocations WHERE plan_id = ANY($1)', [planIds]).then(r => r.rows);

const createAllocation = (planId, categoryName, amountLimit) =>
  db.query(
    'INSERT INTO budget_allocations (plan_id, category_name, amount_limit) VALUES ($1, $2, $3)',
    [planId, categoryName, amountLimit]
  );

module.exports = {
  findPlansByUser, findPlanById, createPlan, deactivateAllForUser,
  incrementPlanPool, setInactive, removePlan,
  findAllocationsByPlanIds, createAllocation,
};
