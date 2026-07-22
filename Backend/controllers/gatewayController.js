const gatewayService = require('../services/gatewayService');
const { catchAsync } = require('../middleware/errorHandler');

/**
 * POST /api/gateway/heartbeat
 * Called by the Android app every ~30 seconds while it is running.
 * Auth: JWT (the Android app stores the user JWT after login).
 */
const heartbeat = catchAsync(async (req, res) => {
  const result = await gatewayService.recordHeartbeat(req.user.id);
  res.json(result);
});

/**
 * GET /api/gateway/status
 * Called by the web frontend to check if the Android gateway is online.
 * Returns { online: bool, last_seen: ISO string | null, last_seen_ago: string, message: string }
 */
const status = catchAsync(async (req, res) => {
  const result = await gatewayService.getStatus(req.user.id);
  res.json(result);
});

module.exports = { heartbeat, status };
