const router = require('express').Router();
const ctrl = require('../controllers/accountController');
const auth = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const v = require('../validators/accountValidators');

router.use(auth);

router.get('/',               ctrl.list);
router.get('/active',         ctrl.listActive);
router.post('/',              validate(v.create), ctrl.create);
router.put('/:id',            validate(v.update), ctrl.update);
router.post('/:id/archive',    ctrl.archive);
router.post('/:id/reactivate', ctrl.reactivate);
router.delete('/:id',         ctrl.remove);

module.exports = router;
