const txRepo = require('../repositories/transactionRepository');
const accountRepo = require('../repositories/accountRepository');
const categoryRepo = require('../repositories/categoryRepository');
const AppError = require('../utils/AppError');

const listTransactions = (userId) => txRepo.findAllByUser(userId);

const addManualTransaction = async (userId, { description, amount, type, category_name, account_name, date }) => {

  let categoryId = null;
  if (category_name) {
    const cat = await categoryRepo.findByName(category_name, userId);
    if (cat) categoryId = cat.id;
  }

  let accountId = null;
  if (account_name) {
    const accounts = await accountRepo.findAllByUser(userId);
    const match = accounts.find(a => a.name.toLowerCase() === account_name.toLowerCase());
    if (!match) throw new AppError(`Account "${account_name}" not found. Add it in Settings first.`, 404);
    accountId = match.id;
  }

  const txDate = date || new Date().toISOString().split('T')[0];

  if (type === 'expense') {
    return txRepo.createExpense(userId, accountId, categoryId, amount, description, txDate);
  } else {
    return txRepo.createIncome(userId, accountId, categoryId, amount, description, txDate);
  }
};

const deleteTransaction = async (id, userId) => {
  const deleted = await txRepo.remove(id, userId);
  if (!deleted) throw new AppError('Transaction not found or unauthorized.', 404);
  return deleted;
};

module.exports = { listTransactions, addManualTransaction, deleteTransaction };
