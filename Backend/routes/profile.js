const router = require('express').Router();
const ctrl = require('../controllers/profileController');
const auth = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const v = require('../validators/profileValidators');

router.use(auth); // All profile routes require authentication

router.get('/', ctrl.get);
router.put('/', validate(v.update), ctrl.update);

module.exports = router;
