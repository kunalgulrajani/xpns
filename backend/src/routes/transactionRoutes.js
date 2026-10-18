const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const protect = require('../middleware/auth');
const ctrl = require('../controllers/transactionController');

router.use(protect);

const txnRules = [
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
  body('category').isMongoId().withMessage('Valid category ID is required'),
  body('date').optional().isISO8601().withMessage('Date must be valid ISO 8601'),
  body('note').optional().isString().isLength({ max: 500 }),
  body('currency').optional().isIn(['INR', 'USD', 'EUR', 'GBP']).withMessage('Currency must be INR, USD, EUR, or GBP'),
];

router.get('/', ctrl.list);
router.post('/', txnRules, validate, ctrl.create);
router.get('/:id', ctrl.getOne);
router.put('/:id', txnRules, validate, ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
