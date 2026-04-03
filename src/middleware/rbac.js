const AppError = require('../utils/AppError');

const roleHierarchy = { viewer: 1, analyst: 2, admin: 3 };

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    const userLevel     = roleHierarchy[req.user.role] || 0;
    const requiredLevel = Math.min(...roles.map(r => roleHierarchy[r] || 99));

    if (userLevel < requiredLevel) {
      return next(
        new AppError(
          `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`,
          403
        )
      );
    }
    next();
  };
};