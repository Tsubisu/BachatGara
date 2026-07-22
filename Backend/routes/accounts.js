const router = require('express').Router();
const ctrl = require('../controllers/accountController');
const auth = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const v = require('../validators/accountValidators');

router.use(auth); // All account routes require auth

router.get('/',     ctrl.list);
router.post('/',    validate(v.create), ctrl.create);
router.put('/:id',  validate(v.update), ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
