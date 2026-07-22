const txService = require('../services/transactionService');
const { catchAsync } = require('../middleware/errorHandler');

const list = catchAsync(async (req, res) => {
  const transactions = await txService.listTransactions(req.user.id);
  res.json(transactions);
});

const addManual = catchAsync(async (req, res) => {
  const tx = await txService.addManualTransaction(req.user.id, req.body);
  res.status(201).json(tx);
});

const remove = catchAsync(async (req, res) => {
  await txService.deleteTransaction(req.params.id, req.user.id);
  res.json({ message: 'Transaction deleted successfully.' });
});

module.exports = { list, addManual, remove };
