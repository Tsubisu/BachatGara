const db = require('../db');

const findAllByUser = (userId) =>
  db.query(
    'SELECT * FROM accounts WHERE user_id = $1 ORDER BY created_at ASC',
    [userId]
  ).then(r => r.rows);

const findById = (id, userId) =>
  db.query(
    'SELECT * FROM accounts WHERE id = $1 AND user_id = $2',
    [id, userId]
  ).then(r => r.rows[0]);

const create = (userId, { name, type, currency, balance, account_mask }) =>
  db.query(
    `INSERT INTO accounts (user_id, name, type, currency, balance, account_mask) 
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [userId, name, type, currency, balance, account_mask || null]
  ).then(r => r.rows[0]);

const update = (id, userId, fields) =>
  db.query(
    `UPDATE accounts 
     SET name         = COALESCE($1, name),
         type         = COALESCE($2, type),
         currency     = COALESCE($3, currency),
         balance      = COALESCE($4, balance),
         account_mask = COALESCE($5, account_mask)
     WHERE id = $6 AND user_id = $7 RETURNING *`,
    [fields.name, fields.type, fields.currency, fields.balance, fields.account_mask, id, userId]
  ).then(r => r.rows[0]);

const remove = (id, userId) =>
  db.query(
    'DELETE FROM accounts WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId]
  ).then(r => r.rows[0]);

module.exports = { findAllByUser, findById, create, update, remove };
