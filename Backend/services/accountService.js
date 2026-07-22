const accountRepo = require('../repositories/accountRepository');
const AppError = require('../utils/AppError');

const listAccounts = (userId) => accountRepo.findAllByUser(userId);

const createAccount = async (userId, data) => {
  try {
    return await accountRepo.create(userId, data);
  } catch (err) {
    if (err.constraint === 'accounts_user_id_name_key') {
      throw new AppError('An account with this name already exists.', 400);
    }
    throw err;
  }
};

const updateAccount = async (id, userId, fields) => {
  const account = await accountRepo.update(id, userId, fields);
  if (!account) throw new AppError('Account not found or unauthorized.', 404);
  return account;
};

const deleteAccount = async (id, userId) => {
  const deleted = await accountRepo.remove(id, userId);
  if (!deleted) throw new AppError('Account not found or unauthorized.', 404);
  return deleted;
};

module.exports = { listAccounts, createAccount, updateAccount, deleteAccount };
