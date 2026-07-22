const router = require('express').Router();
const ctrl = require('../controllers/alertController');
const auth = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const v = require('../validators/alertValidators');

router.use(auth); // All alert routes require authentication

router.get('/', ctrl.list);
router.post('/sync', validate(v.sync), ctrl.sync);
router.post('/:id/resolve', validate(v.resolve), ctrl.resolve);
router.delete('/:id', ctrl.discard);

module.exports = router;
