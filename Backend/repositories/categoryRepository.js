const db = require('../db');

const findByName = (name, userId) =>
  db.query(
    'SELECT id, parent_category_id FROM categories WHERE name = $1 AND (user_id = $2 OR user_id IS NULL) ORDER BY user_id DESC NULLS LAST LIMIT 1',
    [name, userId]
  ).then(r => r.rows[0]);

const findByNameGlobal = (name) =>
  db.query("SELECT id, parent_category_id FROM categories WHERE name = $1 LIMIT 1", [name]).then(r => r.rows[0]);

const findAllByUser = (userId) =>
  db.query(
    `SELECT DISTINCT ON (name) id, user_id, parent_category_id, name, type, icon, color
     FROM categories
     WHERE user_id = $1 OR user_id IS NULL
     ORDER BY name, user_id DESC NULLS LAST`,
    [userId]
  ).then(r => r.rows);

const upsertCategory = async (userId, { name, type, icon, color, parent_category_id }) => {
  const existingUserCat = await db.query(
    `SELECT id FROM categories
     WHERE user_id = $1 AND name = $2
     LIMIT 1`,
    [userId, name]
  );

  if (existingUserCat.rows.length > 0) {
    return db.query(
      `UPDATE categories
       SET icon = $1, color = $2, parent_category_id = COALESCE($3, parent_category_id)
       WHERE id = $4 RETURNING *`,
      [icon || '📁', color || '#10b981', parent_category_id || null, existingUserCat.rows[0].id]
    ).then(r => r.rows[0]);
  }

  return db.query(
    `INSERT INTO categories (user_id, parent_category_id, name, type, icon, color)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, parent_category_id || null, name, type || 'expense', icon || '📁', color || '#10b981']
  ).then(r => r.rows[0]);
};

module.exports = {
  findByName,
  findByNameGlobal,
  findAllByUser,
  upsertCategory,
};
