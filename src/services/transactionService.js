const Transaction = require('../models/Transaction');

exports.create = async (data, userId) => {
  return Transaction.create({ ...data, createdBy: userId });
};

exports.getAll = async ({ type, category, startDate, endDate, page = 1, limit = 10 }) => {
  const filter = {};

  if (type)     filter.type     = type;
  if (category) filter.category = { $regex: category, $options: 'i' };

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate)   filter.date.$lte = new Date(endDate);
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [data, total] = await Promise.all([
    Transaction.find(filter)
      .sort('-date')
      .skip(skip)
      .limit(Number(limit))
      .populate('createdBy', 'name email'),
    Transaction.countDocuments(filter)
  ]);

  return {
    data,
    total,
    page:  Number(page),
    pages: Math.ceil(total / Number(limit))
  };
};

exports.getById = async id => {
  return Transaction.findById(id).populate('createdBy', 'name email');
};

exports.update = async (id, data) => {
  return Transaction.findByIdAndUpdate(id, data, {
    new:           true,
    runValidators: true
  }).populate('createdBy', 'name email');
};

exports.softDelete = async id => {
  return Transaction.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true }
  );
};