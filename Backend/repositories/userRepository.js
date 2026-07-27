const db = require('../db');

const findByEmail = (email) =>
  db.query('SELECT * FROM users WHERE email = $1', [email]).then(r => r.rows[0]);

const create = (email, passwordHash, name) =>
  db.query(
    'INSERT INTO users (email, password_hash, profile_name) VALUES ($1, $2, $3) RETURNING id, email, profile_name, avatar_url, net_savings, theme, is_verified',
    [email, passwordHash, name || null]
  ).then(r => r.rows[0]);

const findById = (id) =>
  db.query(
    'SELECT id, email, profile_name, avatar_url, theme, net_savings, is_verified, created_at FROM users WHERE id = $1',
    [id]
  ).then(r => r.rows[0]);

const updateById = (id, fields) =>
  db.query(
    `UPDATE users
     SET profile_name  = COALESCE($1, profile_name),
         theme         = COALESCE($2, theme),
         net_savings   = COALESCE($3, net_savings),
         email         = COALESCE($4, email),
         password_hash = COALESCE($5, password_hash),
         is_verified   = COALESCE($6, is_verified),
         avatar_url    = COALESCE($7, avatar_url),
         updated_at    = CURRENT_TIMESTAMP
     WHERE id = $8
     RETURNING id, email, profile_name, avatar_url, theme, net_savings, is_verified`,
    [
      fields.profile_name !== undefined ? fields.profile_name : null,
      fields.theme !== undefined ? fields.theme : null,
      fields.net_savings !== undefined ? fields.net_savings : null,
      fields.email !== undefined ? fields.email : null,
      fields.password_hash !== undefined ? fields.password_hash : null,
      fields.is_verified !== undefined ? fields.is_verified : null,
      fields.avatar_url !== undefined ? fields.avatar_url : null,
      id
    ]
  ).then(r => r.rows[0]);

const findByIdWithPassword = (id) =>
  db.query('SELECT * FROM users WHERE id = $1', [id]).then(r => r.rows[0]);

const addToNetSavings = (id, amount) =>
  db.query(
    'UPDATE users SET net_savings = net_savings + $1 WHERE id = $2 RETURNING net_savings',
    [amount, id]
  ).then(r => r.rows[0]);

const updateGatewayHeartbeat = (userId) =>
  db.query(
    'UPDATE users SET gateway_last_seen = NOW() WHERE id = $1 RETURNING gateway_last_seen',
    [userId]
  ).then(r => r.rows[0]);

const getGatewayLastSeen = (userId) =>
  db.query(
    'SELECT gateway_last_seen FROM users WHERE id = $1',
    [userId]
  ).then(r => r.rows[0]);

module.exports = {
  findByEmail,
  create,
  findById,
  updateById,
  findByIdWithPassword,
  addToNetSavings,
  updateGatewayHeartbeat,
  getGatewayLastSeen,
};
