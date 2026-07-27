const accountService = require('../services/accountService');
const { catchAsync } = require('../middleware/errorHandler');
const { bankConfigs } = require('../utils/smsParser');

function extractSenderShortcodes(senderPatterns) {
  return senderPatterns.map(pattern => {
    const src = pattern.source;
    return src.replace(/^\^/, '').replace(/\$$/, '');
  });
}

const bankShortcodeMap = {};
for (const cfg of bankConfigs) {
  const normalizedName = cfg.name.toLowerCase();
  bankShortcodeMap[normalizedName] = extractSenderShortcodes(cfg.senderPatterns);
}

function getSenderShortcodes(accountName) {
  if (!accountName) return [];
  const nameLower = accountName.toLowerCase();
  if (bankShortcodeMap[nameLower]) return bankShortcodeMap[nameLower];
  for (const [bankName, codes] of Object.entries(bankShortcodeMap)) {
    if (nameLower.includes(bankName) || bankName.includes(nameLower)) {
      return codes;
    }
    const bankWords = bankName.split(' ').filter(w => w.length > 2);
    if (bankWords.some(w => nameLower.includes(w))) return codes;
  }
  return [];
}

const list = catchAsync(async (req, res) => {
  const accounts = await accountService.listAccounts(req.user.id);
  res.json(accounts);
});

const listActive = catchAsync(async (req, res) => {
  const accounts = await accountService.listActiveBankAccounts(req.user.id);
  const enriched = accounts.map(acc => ({
    ...acc,
    senderShortcodes: getSenderShortcodes(acc.name)
  }));
  res.json(enriched);
});

const create = catchAsync(async (req, res) => {
  const account = await accountService.createAccount(req.user.id, req.body);
  res.status(201).json(account);
});

const update = catchAsync(async (req, res) => {
  const account = await accountService.updateAccount(req.params.id, req.user.id, req.body);
  res.json(account);
});

const archive = catchAsync(async (req, res) => {
  const targetAccountId = req.body?.target_account_id || req.query?.target_account_id;
  const account = await accountService.archiveAccount(req.params.id, req.user.id, targetAccountId);
  res.json({ message: 'Account archived successfully.', account });
});

const reactivate = catchAsync(async (req, res) => {
  const account = await accountService.reactivateAccount(req.params.id, req.user.id);
  res.json({ message: 'Account reactivated successfully.', account });
});

const remove = catchAsync(async (req, res) => {
  const targetAccountId = req.body?.target_account_id || req.query?.target_account_id;
  await accountService.deleteAccount(req.params.id, req.user.id, targetAccountId);
  res.json({ message: 'Account deleted successfully.', id: req.params.id });
});

module.exports = { list, listActive, create, update, archive, reactivate, remove };
