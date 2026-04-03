const User     = require('../models/User');
const AppError = require('../utils/AppError');

exports.getAllUsers = async () => {
  return User.find().select('-password');
};

exports.updateUser = async (id, updates) => {
  const allowed = {};
  if (updates.role     !== undefined) allowed.role     = updates.role;
  if (updates.isActive !== undefined) allowed.isActive = updates.isActive;

  const user = await User.findByIdAndUpdate(id, allowed, {
    new:           true,
    runValidators: true
  }).select('-password');

  if (!user) throw new AppError('User not found.', 404);
  return user;
};