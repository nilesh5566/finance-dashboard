const transactionService = require('../services/transactionService');
const catchAsync         = require('../utils/catchAsync');
const AppError           = require('../utils/AppError');

exports.create = catchAsync(async (req, res) => {
  const tx = await transactionService.create(req.body, req.user._id);
  res.status(201).json({ success: true, data: tx });
});

exports.getAll = catchAsync(async (req, res) => {
  const result = await transactionService.getAll(req.query);
  res.status(200).json({ success: true, ...result });
});

exports.getOne = catchAsync(async (req, res, next) => {
  const tx = await transactionService.getById(req.params.id);
  if (!tx) return next(new AppError('Transaction not found.', 404));
  res.status(200).json({ success: true, data: tx });
});

exports.update = catchAsync(async (req, res, next) => {
  const tx = await transactionService.update(req.params.id, req.body);
  if (!tx) return next(new AppError('Transaction not found.', 404));
  res.status(200).json({ success: true, data: tx });
});

exports.remove = catchAsync(async (req, res, next) => {
  const tx = await transactionService.softDelete(req.params.id);
  if (!tx) return next(new AppError('Transaction not found.', 404));
  res.status(200).json({ success: true, message: 'Transaction deleted successfully.' });
});