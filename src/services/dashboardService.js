const Transaction = require('../models/Transaction');

exports.getSummary = async () => {
  const result = await Transaction.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id:   '$type',
        total: { $sum: '$amount' }
      }
    }
  ]);

  const income  = result.find(r => r._id === 'income')?.total  || 0;
  const expense = result.find(r => r._id === 'expense')?.total || 0;

  return {
    totalIncome:   income,
    totalExpenses: expense,
    netBalance:    income - expense
  };
};

exports.getCategoryBreakdown = async () => {
  return Transaction.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id:   { category: '$category', type: '$type' },
        total: { $sum: '$amount' }
      }
    },
    { $sort: { total: -1 } }
  ]);
};

exports.getMonthlyTrends = async () => {
  return Transaction.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: {
          year:  { $year:  '$date' },
          month: { $month: '$date' },
          type:  '$type'
        },
        total: { $sum: '$amount' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);
};

exports.getRecentActivity = async (limit = 5) => {
  return Transaction.find()
    .sort('-date')
    .limit(limit)
    .populate('createdBy', 'name email');
};