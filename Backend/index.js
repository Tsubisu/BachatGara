const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const DEV_ORIGIN = process.env.DEV_FRONTEND_URL || 'http://localhost:3000';
const PROD_ORIGIN = process.env.FRONTEND_URL || null;

const LOCAL_NETWORK_REGEX = /^https?:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (PROD_ORIGIN) {
      return PROD_ORIGIN === origin
        ? callback(null, true)
        : callback(new Error(`CORS: Origin "${origin}" is not allowed.`));
    }

    if (
      origin === DEV_ORIGIN ||
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
      LOCAL_NETWORK_REGEX.test(origin)
    ) {
      return callback(null, true);
    }

    callback(new Error(`CORS: Origin "${origin}" is not allowed.`));
  },
  credentials: true,
}));
app.use(express.json());

const os = require('os');
const getLocalIP = () => {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return 'localhost';
};

app.get('/api/server-info', (req, res) => {
  res.json({
    app: 'BachatGara Backend',
    version: '1.0.0',
    local_ip: getLocalIP(),
    port: PORT,
  });
});

app.get('/', (req, res) => {
  res.json({ message: 'BachatGara Backend API is running successfully.' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/budgets', require('./routes/budgets'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/gateway', require('./routes/gateway'));

const { errorHandler } = require('./middleware/errorHandler');

app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  const localIP = getLocalIP();
  console.log(`✅ BachatGara backend running on port ${PORT}`);
  console.log(`   Local access:   http://localhost:${PORT}`);
  console.log(`   Network access: http://${localIP}:${PORT}`);
  console.log(`   ↑ Use the Network address above in the Android app.`);
});
