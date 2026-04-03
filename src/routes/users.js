const router     = require('express').Router();
const { protect }    = require('../middleware/auth');
const { restrictTo } = require('../middleware/rbac');
const { getAllUsers, updateUser } = require('../controllers/userController');

router.use(protect);
router.use(restrictTo('admin'));

router.get('/',    getAllUsers);
router.patch('/:id', updateUser);

module.exports = router;