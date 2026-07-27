const router = require('express').Router();
const ctrl = require('../controllers/eventsController');
const auth = require('../middleware/authMiddleware');

router.get('/stream', auth, ctrl.stream);

module.exports = router;