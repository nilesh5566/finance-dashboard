const router     = require('express').Router();
const { protect }    = require('../middleware/auth');
const { restrictTo } = require('../middleware/rbac');
const {
  getSummary,
  getCategoryBreakdown,
  getMonthlyTrends,
  getRecentActivity
} = require('../controllers/dashboardController');

router.use(protect);
router.use(restrictTo('analyst', 'admin'));

router.get('/summary',    getSummary);
router.get('/categories', getCategoryBreakdown);
router.get('/trends',     getMonthlyTrends);
router.get('/recent',     getRecentActivity);

module.exports = router;