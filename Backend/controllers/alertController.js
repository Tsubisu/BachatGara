const alertService = require('../services/alertService');
const { catchAsync } = require('../middleware/errorHandler');

const list = catchAsync(async (req, res) => {
  const alerts = await alertService.listAlerts(req.user.id);
  res.json(alerts);
});

const sync = catchAsync(async (req, res) => {
  const alert = await alertService.syncAlert(req.user.id, req.body);
  res.status(201).json({ message: 'Alert queued successfully.', alert });
});

const resolve = catchAsync(async (req, res) => {
  await alertService.resolveAlert(req.params.id, req.user.id, req.body);
  res.json({ message: 'Alert resolved and logged to ledger.' });
});

const discard = catchAsync(async (req, res) => {
  await alertService.discardAlert(req.params.id, req.user.id);
  res.json({ message: 'Alert discarded.' });
});

module.exports = { list, sync, resolve, discard };
