const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const protect = require('../middleware/auth');
const ctrl = require('../controllers/categoryController');

router.use(protect); 

const createRules = [
  body('name').trim().notEmpty().withMessage('Category name is required'),
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
];

router.get('/', ctrl.list);
router.post('/', createRules, validate, ctrl.create);
router.delete('/:id', ctrl.remove);

module.exports = router;
