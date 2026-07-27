const eventBus = require('../utils/eventBus');

const stream = (req, res) => {
  const userId = req.user.id;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'SSE Stream Connected' })}\n\n`);

  const keepAliveInterval = setInterval(() => {
    res.write(':\n\n');
  }, 15000);

  const onDataUpdated = (data) => {
    if (String(data.userId) === String(userId)) {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
      if (typeof res.flush === 'function') {
        res.flush();
      }
    }
  };

  eventBus.on('dataUpdated', onDataUpdated);

  req.on('close', () => {
    clearInterval(keepAliveInterval);
    eventBus.removeListener('dataUpdated', onDataUpdated);
  });
};

module.exports = { stream };