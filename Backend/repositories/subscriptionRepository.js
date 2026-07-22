const db = require('../db');

const findAllByUser = (userId) =>
  db.query(
    `SELECT s.*, a.name AS account_name 
     FROM subscriptions s
     LEFT JOIN accounts a ON s.account_id = a.id
     WHERE s.user_id = $1 
     ORDER BY s.next_billing_date ASC`,
    [userId]
  ).then(r => r.rows);

const create = (userId, { name, amount, billing_cycle, next_billing_date, account_id }) =>
  db.query(
    `INSERT INTO subscriptions (user_id, name, amount, billing_cycle, next_billing_date, account_id) 
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [userId, name, amount, billing_cycle, next_billing_date, account_id || null]
  ).then(r => r.rows[0]);

const remove = (id, userId) =>
  db.query(
    'DELETE FROM subscriptions WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId]
  ).then(r => r.rows[0]);

module.exports = { findAllByUser, create, remove };
