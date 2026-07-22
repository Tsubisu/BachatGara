const userRepo = require('../repositories/userRepository');

// Gateway is "online" if a heartbeat arrived within 90s.
// Android app sends every 30s, so 3 missed beats => offline.
const ONLINE_THRESHOLD_MS = 90 * 1000;

const recordHeartbeat = async (userId) => {
  await userRepo.updateGatewayHeartbeat(userId);
  return { message: 'Heartbeat recorded.' };
};

const getStatus = async (userId) => {
  const row = await userRepo.getGatewayLastSeen(userId);
  const lastSeen = row?.gateway_last_seen ? new Date(row.gateway_last_seen) : null;

  if (!lastSeen) {
    return {
      online: false,
      last_seen: null,
      last_seen_ago: null,
      message: 'No gateway device has ever connected for this account.',
    };
  }

  const ageMs = Date.now() - lastSeen.getTime();
  const online = ageMs <= ONLINE_THRESHOLD_MS;

  return {
    online,
    last_seen: lastSeen.toISOString(),
    last_seen_ago: formatAgo(ageMs),
    message: online
      ? 'Android gateway is connected and forwarding SMS alerts.'
      : 'Android gateway is offline or disconnected.',
  };
};

function formatAgo(ms) {
  const s = Math.floor(ms / 1000);
  if (s < 60) return s + ' second' + (s !== 1 ? 's' : '') + ' ago';
  const m = Math.floor(s / 60);
  if (m < 60) return m + ' minute' + (m !== 1 ? 's' : '') + ' ago';
  const h = Math.floor(m / 60);
  return h + ' hour' + (h !== 1 ? 's' : '') + ' ago';
}

module.exports = { recordHeartbeat, getStatus };
