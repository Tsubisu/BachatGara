const db = require('../db');

const findAllByUser = (userId) =>
  db.query(
    `SELECT sg.*, COALESCE(SUM(t.amount), 0) AS current
     FROM savings_goals sg
     LEFT JOIN savings_contributions sc ON sg.id = sc.goal_id
     LEFT JOIN transactions t ON sc.transaction_id = t.id
     WHERE sg.user_id = $1
     GROUP BY sg.id
     ORDER BY sg.created_at ASC`,
    [userId]
  ).then(r => r.rows);

const findById = (id, userId) =>
  db.query('SELECT * FROM savings_goals WHERE id = $1 AND user_id = $2', [id, userId]).then(r => r.rows[0]);

const create = (userId, { name, target_amount, target_date }) =>
  db.query(
    'INSERT INTO savings_goals (user_id, name, target_amount, target_date) VALUES ($1, $2, $3, $4) RETURNING *',
    [userId, name, target_amount, target_date || null]
  ).then(r => r.rows[0]);

const linkContribution = (goalId, transactionId) =>
  db.query(
    'INSERT INTO savings_contributions (goal_id, transaction_id) VALUES ($1, $2)',
    [goalId, transactionId]
  );

const remove = (id, userId) =>
  db.query('DELETE FROM savings_goals WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]).then(r => r.rows[0]);

module.exports = { findAllByUser, findById, create, linkContribution, remove };
