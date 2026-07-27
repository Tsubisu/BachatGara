const router = require('express').Router();
const ctrl = require('../controllers/goalController');
const auth = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const v = require('../validators/goalValidators');

router.use(auth);

router.get('/', ctrl.list);
router.post('/', validate(v.createGoal), ctrl.create);
router.post('/:id/fund', validate(v.fundGoal), ctrl.fund);
router.delete('/:id', ctrl.remove);

module.exports = router;
