const router = require('express').Router();
const ctrl = require('../controllers/bankController');
const auth = require('../middleware/authMiddleware');

router.use(auth);

router.get('/', ctrl.getBanks);

module.exports = router;