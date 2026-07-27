const router = require('express').Router();
const ctrl   = require('../controllers/gatewayController');
const auth   = require('../middleware/authMiddleware');

router.use(auth);

router.post('/heartbeat', ctrl.heartbeat);

router.get('/status', ctrl.status);

module.exports = router;
