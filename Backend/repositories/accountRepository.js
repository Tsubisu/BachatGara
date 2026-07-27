const db = require('../db');

const findAllByUser = async (userId) => {
  let rows = await db.query(
    'SELECT * FROM accounts WHERE user_id = $1 ORDER BY created_at ASC',
    [userId]
  ).then(r => r.rows);

  // Deduplicate cash entries so only a single base Cash account exists
  let cashFound = false;
  rows = rows.filter(r => {
    const isCash = r.type === 'cash' || r.name.toLowerCase() === 'cash';
    if (isCash) {
      if (cashFound) return false;
      cashFound = true;
    }
    return true;
  });

  const hasCash = rows.some(r => r.type === 'cash' || r.name.toLowerCase() === 'cash');
  if (!hasCash) {
    try {
      const cashAcc = await findOrCreateDefaultCashAccount(userId);
      if (cashAcc) rows.unshift(cashAcc);
    } catch (err) {
      rows.unshift({
        id: 'default-cash-' + userId,
        user_id: userId,
        name: 'Cash',
        type: 'cash',
        currency: 'NPR',
        balance: 0.00,
        is_active: true
      });
    }
  }
  return rows;
};

const findActiveByUser = (userId) =>
  db.query(
    'SELECT * FROM accounts WHERE user_id = $1 AND (is_active IS NULL OR is_active = true) ORDER BY created_at ASC',
    [userId]
  ).then(r => r.rows);

const findActiveBankAccountsByUser = (userId) =>
  db.query(
    "SELECT * FROM accounts WHERE user_id = $1 AND (is_active IS NULL OR is_active = true) AND (type = 'bank' OR type IS NULL) ORDER BY created_at ASC",
    [userId]
  ).then(r => r.rows);

const findById = (id, userId) =>
  db.query(
    'SELECT * FROM accounts WHERE id = $1 AND user_id = $2',
    [id, userId]
  ).then(r => r.rows[0]);

const findOrCreateDefaultCashAccount = async (userId) => {
  const existing = await db.query(
    `SELECT * FROM accounts WHERE user_id = $1 AND (LOWER(name) = 'cash' OR type = 'cash') LIMIT 1`,
    [userId]
  ).then(r => r.rows[0]);

  if (existing) return existing;

  return db.query(
    `INSERT INTO accounts (user_id, name, type, currency, balance, is_active)
     VALUES ($1, 'Cash', 'cash', 'NPR', 0, true) RETURNING *`,
    [userId]
  ).then(r => r.rows[0]);
};

const create = (userId, { name, type, currency, balance, account_mask, is_active }) =>
  db.query(
    `INSERT INTO accounts (user_id, name, type, currency, balance, account_mask, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [userId, name, type, currency, balance, account_mask || null, is_active !== false]
  ).then(r => r.rows[0]);

const update = (id, userId, fields) =>
  db.query(
    `UPDATE accounts
     SET name         = COALESCE($1, name),
         type         = COALESCE($2, type),
         currency     = COALESCE($3, currency),
         balance      = COALESCE($4, balance),
         account_mask = COALESCE($5, account_mask),
         is_active    = COALESCE($6, is_active)
     WHERE id = $7 AND user_id = $8 RETURNING *`,
    [
      fields.name !== undefined ? fields.name : null,
      fields.type !== undefined ? fields.type : null,
      fields.currency !== undefined ? fields.currency : null,
      fields.balance !== undefined ? fields.balance : null,
      fields.account_mask !== undefined ? fields.account_mask : null,
      fields.is_active !== undefined ? fields.is_active : null,
      id,
      userId
    ]
  ).then(r => r.rows[0]);

const setActiveStatus = (id, userId, isActive) =>
  db.query(
    'UPDATE accounts SET is_active = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
    [isActive, id, userId]
  ).then(r => r.rows[0]);

const remove = (id, userId) =>
  db.query(
    'DELETE FROM accounts WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId]
  ).then(r => r.rows[0]);

module.exports = {
  findAllByUser,
  findActiveByUser,
  findActiveBankAccountsByUser,
  findById,
  findOrCreateDefaultCashAccount,
  create,
  update,
  setActiveStatus,
  remove,
};
