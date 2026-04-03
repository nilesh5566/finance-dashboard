const router     = require('express').Router();
const { body }   = require('express-validator');
const validate   = require('../middleware/validate');
const { protect }    = require('../middleware/auth');
const { restrictTo } = require('../middleware/rbac');
const {
  create,
  getAll,
  getOne,
  update,
  remove
} = require('../controllers/transactionController');

router.use(protect);

router.get('/',     restrictTo('viewer', 'analyst', 'admin'), getAll);
router.get('/:id',  restrictTo('viewer', 'analyst', 'admin'), getOne);

router.post(
  '/',
  restrictTo('analyst', 'admin'),
  [
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
    body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
    body('category').notEmpty().withMessage('Category is required')
  ],
  validate,
  create
);

router.patch('/:id',  restrictTo('analyst', 'admin'), update);
router.delete('/:id', restrictTo('admin'),            remove);

module.exports = router;