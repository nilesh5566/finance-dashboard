const jwt      = require('jsonwebtoken');
const User     = require('../models/User');
const AppError = require('../utils/AppError');

const signToken = id =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });

const formatUser = user => ({
  id:       user._id,
  name:     user.name,
  email:    user.email,
  role:     user.role,
  isActive: user.isActive
});

exports.register = async ({ name, email, password, role }) => {
  const existing = await User.findOne({ email });
  if (existing) throw new AppError('Email already in use.', 409);

  const user  = await User.create({ name, email, password, role });
  const token = signToken(user._id);

  return { token, user: formatUser(user) };
};

exports.login = async ({ email, password }) => {
  if (!email || !password) throw new AppError('Please provide email and password.', 400);

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Contact an admin.', 403);
  }

  const token = signToken(user._id);
  return { token, user: formatUser(user) };
};