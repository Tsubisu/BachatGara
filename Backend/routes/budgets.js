const router = require('express').Router();
const ctrl = require('../controllers/budgetController');
const auth = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const v = require('../validators/budgetValidators');

router.use(auth); // All budget routes require authentication

router.get('/plans', ctrl.listPlans);
router.post('/plans', validate(v.createPlan), ctrl.createPlan);
router.post('/plans/:id/rollover', validate(v.rollover), ctrl.rolloverPlan);
router.delete('/plans/:id', ctrl.deletePlan);

module.exports = router;
