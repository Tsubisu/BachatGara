const rateLimitMap = new Map();

// Clean up expired IP entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimitMap.entries()) {
    if (now > data.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, 10 * 60 * 1000);

const createRateLimiter = (options = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 mins default
  const max = options.max || 1000; // High limit so it doesn't interfere with app
  const message = options.message || 'Too many requests, please try again later.';

  return (req, res, next) => {
    // Never rate limit during automated unit tests or event streams
    if (process.env.NODE_ENV === 'test' || req.path.includes('/events/stream')) {
      return next();
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const key = `${req.baseUrl}${req.path}_${ip}`;
    const now = Date.now();

    let record = rateLimitMap.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      rateLimitMap.set(key, record);
      return next();
    }

    record.count += 1;

    if (record.count > max) {
      res.setHeader('Retry-After', Math.ceil((record.resetTime - now) / 1000));
      return res.status(429).json({ error: message });
    }

    next();
  };
};

const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many API requests from this IP. Please try again later.',
});

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
});

module.exports = {
  apiLimiter,
  authLimiter,
  createRateLimiter,
};
