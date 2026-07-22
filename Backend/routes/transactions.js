const router = require('express').Router();
const ctrl = require('../controllers/transactionController');
const auth = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const v = require('../validators/transactionValidators');

router.use(auth); // All transaction routes require authentication

router.get('/', ctrl.list);
router.post('/manual', validate(v.addManual), ctrl.addManual);
router.delete('/:id', ctrl.remove);

module.exports = router;
