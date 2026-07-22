const router = require('express').Router();
const ctrl   = require('../controllers/gatewayController');
const auth   = require('../middleware/authMiddleware');

router.use(auth); // Both endpoints require a valid JWT

// Android app calls this every ~30s to prove it is alive
router.post('/heartbeat', ctrl.heartbeat);

// Web frontend calls this to check live status
router.get('/status', ctrl.status);

module.exports = router;
