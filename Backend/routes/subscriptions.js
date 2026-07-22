const router = require('express').Router();
const ctrl = require('../controllers/subscriptionController');
const auth = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const v = require('../validators/subscriptionValidators');

router.use(auth); // All subscription routes require authentication

router.get('/', ctrl.list);
router.post('/', validate(v.create), ctrl.create);
router.delete('/:id', ctrl.remove);

module.exports = router;
