const db = require('../db');

const findByName = (name, userId) =>
  db.query(
    'SELECT id FROM categories WHERE name = $1 AND (user_id = $2 OR user_id IS NULL) LIMIT 1',
    [name, userId]
  ).then(r => r.rows[0]);

const findByNameGlobal = (name) =>
  db.query("SELECT id FROM categories WHERE name = $1 LIMIT 1", [name]).then(r => r.rows[0]);

const findAllByUser = (userId) =>
  db.query(
    `SELECT DISTINCT ON (name) id, user_id, name, type, icon, color
     FROM categories
     WHERE user_id = $1 OR user_id IS NULL
     ORDER BY name, user_id DESC`,
    [userId]
  ).then(r => r.rows);

const upsertCategory = async (userId, { name, type, icon, color }) => {
  // PostgreSQL NULL != NULL so ON CONFLICT won't fire for top-level (NULL parent) categories.
  // We do a manual check-then-insert/update instead.
  const existing = await db.query(
    `SELECT id FROM categories 
     WHERE user_id = $1 AND name = $2 AND type = $3 AND parent_category_id IS NULL
     LIMIT 1`,
    [userId, name, type || 'expense']
  );

  if (existing.rows.length > 0) {
    return db.query(
      `UPDATE categories SET icon = $1, color = $2 WHERE id = $3 RETURNING *`,
      [icon || '📁', color || '#10b981', existing.rows[0].id]
    ).then(r => r.rows[0]);
  }

  return db.query(
    `INSERT INTO categories (user_id, name, type, icon, color)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, name, type || 'expense', icon || '📁', color || '#10b981']
  ).then(r => r.rows[0]);
};

module.exports = {
  findByName,
  findByNameGlobal,
  findAllByUser,
  upsertCategory,
};
