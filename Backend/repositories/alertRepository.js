const db = require('../db');

const findUnresolvedByUser = (userId) =>
  db.query(
    'SELECT * FROM sms_alerts WHERE user_id = $1 AND resolved = false ORDER BY timestamp DESC',
    [userId]
  ).then(r => r.rows);

const findById = (id, userId) =>
  db.query('SELECT * FROM sms_alerts WHERE id = $1 AND user_id = $2', [id, userId]).then(r => r.rows[0]);

const create = (userId, { timestamp, sender, raw_body, bank_name, amount, type }) =>
  db.query(
    `INSERT INTO sms_alerts (user_id, timestamp, sender, raw_body, bank_name, amount, type)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [userId, timestamp || new Date(), sender, raw_body, bank_name, amount, type]
  ).then(r => r.rows[0]);

const markResolved = (id) =>
  db.query('UPDATE sms_alerts SET resolved = true WHERE id = $1', [id]);

const remove = (id, userId) =>
  db.query('DELETE FROM sms_alerts WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]).then(r => r.rows[0]);

module.exports = { findUnresolvedByUser, findById, create, markResolved, remove };
