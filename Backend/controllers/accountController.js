const accountService = require('../services/accountService');
const { catchAsync } = require('../middleware/errorHandler');

const list = catchAsync(async (req, res) => {
  const accounts = await accountService.listAccounts(req.user.id);
  res.json(accounts);
});

const create = catchAsync(async (req, res) => {
  const account = await accountService.createAccount(req.user.id, req.body);
  res.status(201).json(account);
});

const update = catchAsync(async (req, res) => {
  const account = await accountService.updateAccount(req.params.id, req.user.id, req.body);
  res.json(account);
});

const remove = catchAsync(async (req, res) => {
  await accountService.deleteAccount(req.params.id, req.user.id);
  res.json({ message: 'Account deleted successfully.', id: req.params.id });
});

module.exports = { list, create, update, remove };
