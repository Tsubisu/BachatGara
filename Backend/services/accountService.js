const accountRepo = require('../repositories/accountRepository');
const transactionRepo = require('../repositories/transactionRepository');
const eventBus = require('../utils/eventBus');
const AppError = require('../utils/AppError');
const { bankConfigs } = require('../utils/smsParser');

const listAccounts = (userId) => accountRepo.findAllByUser(userId);
const listActiveAccounts = (userId) => accountRepo.findActiveByUser(userId);
const listActiveBankAccounts = (userId) => accountRepo.findActiveBankAccountsByUser(userId);

function extractSenderShortcodes(senderPatterns) {
  return senderPatterns.map(pattern => {
    const src = pattern.source;
    return src.replace(/^\^/, '').replace(/\$$/, '');
  });
}

const bankShortcodeMap = {};
for (const cfg of bankConfigs) {
  bankShortcodeMap[cfg.name.toLowerCase()] = extractSenderShortcodes(cfg.senderPatterns);
}

function getSenderShortcodes(accountName) {
  if (!accountName) return [];
  const nameLower = accountName.toLowerCase();
  if (bankShortcodeMap[nameLower]) return bankShortcodeMap[nameLower];
  for (const [bankName, codes] of Object.entries(bankShortcodeMap)) {
    if (nameLower.includes(bankName) || bankName.includes(nameLower)) return codes;
    const bankWords = bankName.split(' ').filter(w => w.length > 2);
    if (bankWords.some(w => nameLower.includes(w))) return codes;
  }
  return [];
}

async function buildActiveSenderShortcodes(userId) {
  try {
    const accounts = await accountRepo.findActiveBankAccountsByUser(userId);
    return accounts.flatMap(acc => getSenderShortcodes(acc.name));
  } catch {
    return [];
  }
}

const createAccount = async (userId, data) => {
  try {
    const account = await accountRepo.create(userId, data);
    const activeSenderShortcodes = await buildActiveSenderShortcodes(userId);
    eventBus.emit('dataUpdated', { userId, type: 'account', action: 'created', account, activeSenderShortcodes });
    return account;
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
  const activeSenderShortcodes = await buildActiveSenderShortcodes(userId);
  eventBus.emit('dataUpdated', { userId, type: 'account', action: 'updated', account, activeSenderShortcodes });
  return account;
};

const processBalanceTransfer = async (userId, sourceAcc, targetAccountId) => {
  if (!targetAccountId || !sourceAcc || parseFloat(sourceAcc.balance || 0) <= 0) return;

  let targetAcc;
  if (targetAccountId === 'cash' || targetAccountId === 'default_cash') {
    targetAcc = await accountRepo.findOrCreateDefaultCashAccount(userId);
  } else {
    targetAcc = await accountRepo.findById(targetAccountId, userId);
  }

  if (targetAcc && targetAcc.id !== sourceAcc.id) {
    const transferAmount = parseFloat(sourceAcc.balance);
    const dateStr = new Date().toISOString().split('T')[0];
    await transactionRepo.createTransfer(
      userId,
      sourceAcc.id,
      targetAcc.id,
      transferAmount,
      `Balance transfer from ${sourceAcc.name} to ${targetAcc.name}`,
      dateStr
    );
  }
};

const archiveAccount = async (id, userId, targetAccountId = null) => {
  const sourceAcc = await accountRepo.findById(id, userId);
  if (!sourceAcc) throw new AppError('Account not found or unauthorized.', 404);

  if (sourceAcc.type === 'cash' || sourceAcc.name.toLowerCase() === 'cash') {
    throw new AppError('Default Cash account cannot be archived.', 400);
  }

  if (targetAccountId) {
    await processBalanceTransfer(userId, sourceAcc, targetAccountId);
  }

  const archived = await accountRepo.setActiveStatus(id, userId, false);
  const activeSenderShortcodes = await buildActiveSenderShortcodes(userId);
  eventBus.emit('dataUpdated', { userId, type: 'account', action: 'archived', accountId: id, activeSenderShortcodes });
  return archived;
};

const reactivateAccount = async (id, userId) => {
  const account = await accountRepo.setActiveStatus(id, userId, true);
  if (!account) throw new AppError('Account not found or unauthorized.', 404);
  const activeSenderShortcodes = await buildActiveSenderShortcodes(userId);
  eventBus.emit('dataUpdated', { userId, type: 'account', action: 'reactivated', account, activeSenderShortcodes });
  return account;
};

const deleteAccount = async (id, userId, targetAccountId = null) => {
  const sourceAcc = await accountRepo.findById(id, userId);
  if (!sourceAcc) throw new AppError('Account not found or unauthorized.', 404);

  if (sourceAcc.type === 'cash' || sourceAcc.name.toLowerCase() === 'cash') {
    throw new AppError('Default Cash account cannot be deleted.', 400);
  }

  if (targetAccountId) {
    await processBalanceTransfer(userId, sourceAcc, targetAccountId);
  }

  const deleted = await accountRepo.remove(id, userId);
  const activeSenderShortcodes = await buildActiveSenderShortcodes(userId);
  eventBus.emit('dataUpdated', { userId, type: 'account', action: 'deleted', accountId: id, activeSenderShortcodes });
  return deleted;
};

module.exports = {
  listAccounts,
  listActiveAccounts,
  listActiveBankAccounts,
  createAccount,
  updateAccount,
  archiveAccount,
  reactivateAccount,
  deleteAccount,
};
