const dashboardService = require('../services/dashboardService');
const catchAsync       = require('../utils/catchAsync');

exports.getSummary = catchAsync(async (req, res) => {
  const data = await dashboardService.getSummary();
  res.status(200).json({ success: true, data });
});

exports.getCategoryBreakdown = catchAsync(async (req, res) => {
  const data = await dashboardService.getCategoryBreakdown();
  res.status(200).json({ success: true, data });
});

exports.getMonthlyTrends = catchAsync(async (req, res) => {
  const data = await dashboardService.getMonthlyTrends();
  res.status(200).json({ success: true, data });
});

exports.getRecentActivity = catchAsync(async (req, res) => {
  const data = await dashboardService.getRecentActivity();
  res.status(200).json({ success: true, data });
});