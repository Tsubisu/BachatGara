const gatewayService = require('../services/gatewayService');
const { catchAsync } = require('../middleware/errorHandler');

const heartbeat = catchAsync(async (req, res) => {
  const result = await gatewayService.recordHeartbeat(req.user.id);
  res.json(result);
});

const status = catchAsync(async (req, res) => {
  const result = await gatewayService.getStatus(req.user.id);
  res.json(result);
});

module.exports = { heartbeat, status };
