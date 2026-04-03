const express   = require('express');
const mongoose  = require('mongoose');
const dotenv    = require('dotenv');
const helmet    = require('helmet');
const morgan    = require('morgan');
const cors      = require('cors');
const rateLimit = require('express-rate-limit');

dotenv.config();

const AppError = require('./src/utils/AppError');

const app = express();
app.use(cors({ origin: '*' }));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());


app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' }
}));

const authRoutes        = require('./src/routes/auth');
const userRoutes        = require('./src/routes/users');
const transactionRoutes = require('./src/routes/transactions');
const dashboardRoutes   = require('./src/routes/dashboard');

app.use('/api/auth',         authRoutes);
app.use('/api/users',        userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard',    dashboardRoutes);

app.all('*path', (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

app.use((err, req, res, next) => {
  const status  = err.statusCode || 500;
  const message = err.message    || 'Internal Server Error';
  res.status(status).json({
    success: false,
    status,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(process.env.PORT, () =>
      console.log(`🚀 Server running on port ${process.env.PORT}`)
    );
  })
  .catch(err => {
    console.error('❌ DB connection failed:', err.message);
    process.exit(1);
  });