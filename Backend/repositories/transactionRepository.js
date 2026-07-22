const db = require('../db');

const findAllByUser = (userId) =>
  db.query(
    `SELECT t.*, 
            c.name  AS category_name, c.icon AS category_icon, c.color AS category_color,
            sa.name AS source_account_name,
            da.name AS destination_account_name
     FROM transactions t
     LEFT JOIN categories c  ON t.category_id         = c.id
     LEFT JOIN accounts   sa ON t.source_account_id   = sa.id
     LEFT JOIN accounts   da ON t.destination_account_id = da.id
     WHERE t.user_id = $1
     ORDER BY t.date DESC, t.created_at DESC`,
    [userId]
  ).then(r => r.rows);

const createExpense = (userId, sourceAccountId, categoryId, amount, description, date) =>
  db.query(
    `INSERT INTO transactions 
       (user_id, source_account_id, category_id, amount, description, date)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [userId, sourceAccountId, categoryId, amount, description, date]
  ).then(r => r.rows[0]);

const createIncome = (userId, destAccountId, categoryId, amount, description, date) =>
  db.query(
    `INSERT INTO transactions 
       (user_id, destination_account_id, category_id, amount, description, date)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [userId, destAccountId, categoryId, amount, description, date]
  ).then(r => r.rows[0]);

const createTransfer = (userId, sourceId, destId, amount, description, date) =>
  db.query(
    `INSERT INTO transactions 
       (user_id, source_account_id, destination_account_id, amount, description, date)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [userId, sourceId, destId, amount, description, date]
  ).then(r => r.rows[0]);

const remove = (id, userId) =>
  db.query(
    'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId]
  ).then(r => r.rows[0]);

module.exports = { findAllByUser, createExpense, createIncome, createTransfer, remove };
