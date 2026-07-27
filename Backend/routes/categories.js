const router = require('express').Router();
const ctrl = require('../controllers/categoryController');
const auth = require('../middleware/authMiddleware');

router.use(auth);

router.get('/', ctrl.list);
router.post('/', ctrl.upsert);

module.exports = router;
