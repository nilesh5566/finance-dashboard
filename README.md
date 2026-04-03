# Finance Dashboard Backend

> A production-ready RESTful API for a Finance Dashboard built with **Node.js**, **Express.js**, **MongoDB**, **JWT Authentication**, and **Role-Based Access Control (RBAC)**.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Setup & Installation](#4-setup--installation)
5. [Environment Configuration](#5-environment-configuration)
6. [Database Connection](#6-database-connection)
7. [Data Models](#7-data-models)
8. [Utilities — AppError & catchAsync](#8-utilities)
9. [Middleware — Auth & RBAC](#9-middleware)
10. [Services Layer](#10-services-layer)
11. [Controllers Layer](#11-controllers-layer)
12. [Routes Layer](#12-routes-layer)
13. [Server Entry Point](#13-server-entry-point)
14. [Complete API Reference](#14-complete-api-reference)
15. [Role Permissions Matrix](#15-role-permissions-matrix)
16. [Request & Response Examples](#16-request--response-examples)

---

## 1. Project Overview

This backend powers a Finance Dashboard where users with different roles manage financial transactions and view analytics. It follows a clean **layered architecture**:

```
Request → Routes → Middleware → Controllers → Services → Models → MongoDB
```

### Key Features
- JWT-based stateless authentication
- Role-based access control (viewer / analyst / admin)
- Financial transaction CRUD with soft delete
- Dashboard analytics using MongoDB aggregation
- Input validation and global error handling
- Rate limiting and security headers

---

## 2. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Runtime | Node.js v24 | JavaScript server-side runtime |
| Framework | Express.js v5 | HTTP server, routing, middleware |
| Database | MongoDB Atlas | Cloud NoSQL document storage |
| ODM | Mongoose | Schema definition, validation, queries |
| Auth | jsonwebtoken | Stateless JWT authentication |
| Password | bcryptjs | Secure password hashing |
| Validation | express-validator | Input validation & sanitization |
| Security | helmet + cors | Secure HTTP headers, cross-origin |
| Logging | morgan | HTTP request logger |
| Rate Limit | express-rate-limit | Prevent abuse |

---

## 3. Project Structure

```
finance-dashboard/
├── src/
│   ├── config/
│   │   └── db.js                  ← MongoDB connection
│   ├── models/
│   │   ├── User.js                ← User schema + password hashing
│   │   └── Transaction.js         ← Transaction schema + soft delete
│   ├── middleware/
│   │   ├── auth.js                ← JWT verification (protect)
│   │   ├── rbac.js                ← Role-based access (restrictTo)
│   │   └── validate.js            ← express-validator error handler
│   ├── controllers/
│   │   ├── authController.js      ← register, login
│   │   ├── userController.js      ← getAllUsers, updateUser
│   │   ├── transactionController.js ← CRUD handlers
│   │   └── dashboardController.js ← summary, analytics
│   ├── routes/
│   │   ├── auth.js                ← POST /api/auth/*
│   │   ├── users.js               ← GET/PATCH /api/users/*
│   │   ├── transactions.js        ← CRUD /api/transactions/*
│   │   └── dashboard.js           ← GET /api/dashboard/*
│   ├── services/
│   │   ├── authService.js         ← register/login business logic
│   │   ├── userService.js         ← user query logic
│   │   ├── transactionService.js  ← transaction query + filters
│   │   └── dashboardService.js    ← MongoDB aggregation pipelines
│   └── utils/
│       ├── AppError.js            ← Custom error class
│       └── catchAsync.js          ← Async error wrapper
├── .env                           ← Environment variables (never commit)
├── .env.example                   ← Template for .env
├── .gitignore
├── package.json
└── server.js                      ← Entry point
```

### Why this structure?
- **Routes** only define URL paths and attach middleware
- **Controllers** only handle HTTP request and response
- **Services** contain all business logic and DB queries
- **Models** define data shape and validation rules
- This makes the code easy to **test**, **maintain**, and **scale**

---

## 4. Setup & Installation

### Prerequisites
- Node.js v18 or higher
- MongoDB Atlas account (free tier works)
- npm or yarn

### Step by step

```bash
# 1. Create project folder
mkdir finance-dashboard && cd finance-dashboard

# 2. Initialize npm
npm init -y

# 3. Install all dependencies
npm install express mongoose dotenv bcryptjs jsonwebtoken \
  express-validator morgan helmet cors express-rate-limit

# 4. Install dev dependencies
npm install --save-dev nodemon

# 5. Create your .env file (see section 5)

# 6. Run in development mode
npm run dev

# 7. Run in production
npm start
```

### package.json scripts

```json
"scripts": {
  "start": "node server.js",
  "dev":   "nodemon server.js"
}
```

---

## 5. Environment Configuration

Create a `.env` file in the project root:

```env
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/finance_dashboard?retryWrites=true&w=majority
JWT_SECRET=supersecretkey_change_this_in_production
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

| Variable | Purpose |
|---|---|
| `PORT` | Port the Express server listens on |
| `MONGO_URI` | Full MongoDB connection string with credentials |
| `JWT_SECRET` | Secret key to sign and verify JWT tokens — must be long and random |
| `JWT_EXPIRES_IN` | Token validity period — `"7d"`, `"1h"`, `"30m"` |
| `NODE_ENV` | When `development`, full stack traces are returned in error responses |

> **Never commit `.env` to Git.** Add it to `.gitignore`.

---

## 6. Database Connection

**`src/config/db.js`**

```js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ DB connection failed:', err.message);
    process.exit(1);   // exit code 1 = crash, not normal exit
  }
};

module.exports = connectDB;
```

### Line by line
| Line | Explanation |
|---|---|
| `mongoose.connect()` | Establishes connection to MongoDB using URI from `.env` |
| `async/await` | Used so we can await the promise that `connect()` returns |
| `try/catch` | If connection fails, log the error and stop the app |
| `process.exit(1)` | Exit code 1 = abnormal termination (crash), code 0 = normal |
| `module.exports` | Export the function so `server.js` can call it |

---

## 7. Data Models

### 7a. User Model — `src/models/User.js`

```js
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type:     String,
    required: [true, 'Name is required'],
    trim:     true
  },
  email: {
    type:      String,
    required:  [true, 'Email is required'],
    unique:    true,       // creates a DB index
    lowercase: true,
    trim:      true
  },
  password: {
    type:      String,
    required:  [true, 'Password is required'],
    minlength: 6,
    select:    false       // NEVER returned in queries by default
  },
  role: {
    type:    String,
    enum:    ['viewer', 'analyst', 'admin'],  // only these 3 values allowed
    default: 'viewer'
  },
  isActive: {
    type:    Boolean,
    default: true
  }
}, { timestamps: true });  // auto-adds createdAt and updatedAt
```

#### Field explanations

| Field | Key Option | Why |
|---|---|---|
| `email` | `unique: true` | Creates a DB index, prevents duplicate emails |
| `password` | `select: false` | Never returned in queries — must use `.select('+password')` explicitly |
| `role` | `enum: [...]` | Only allows exactly these 3 values — others cause validation error |
| `isActive` | `Boolean` | Soft user deactivation — admin disables without deleting |
| Schema | `{ timestamps: true }` | Mongoose auto-adds `createdAt` and `updatedAt` |

#### Pre-save hook — automatic password hashing

```js
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();  // only hash if password changed
  this.password = await bcrypt.hash(this.password, 12);  // 12 = salt rounds
  next();
});
```

| Line | Explanation |
|---|---|
| `pre('save')` | Runs automatically BEFORE every `.save()` call |
| `isModified('password')` | Skip hashing if only email or name was updated |
| `bcrypt.hash(password, 12)` | 12 salt rounds = ~300ms per hash, very hard to brute-force |
| `next()` | Must call to continue the save operation |

#### Instance method — password comparison

```js
userSchema.methods.correctPassword = async function(candidatePassword, hashedPassword) {
  return bcrypt.compare(candidatePassword, hashedPassword);
};
```

> You cannot reverse a bcrypt hash. You can only compare. `bcrypt.compare()` returns `true` or `false`.

---

### 7b. Transaction Model — `src/models/Transaction.js`

```js
const transactionSchema = new mongoose.Schema({
  amount: {
    type:     Number,
    required: [true, 'Amount is required'],
    min:      [0.01, 'Amount must be greater than 0']
  },
  type: {
    type:     String,
    enum:     ['income', 'expense'],
    required: [true, 'Type is required']
  },
  category: {
    type:     String,
    required: [true, 'Category is required'],
    trim:     true
  },
  date:      { type: Date,    default: Date.now },
  notes:     { type: String,  maxlength: 500 },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'User',           // foreign key reference to User collection
    required: true
  },
  isDeleted: { type: Boolean, default: false }  // soft delete flag
}, { timestamps: true });
```

#### Query middleware — auto-filter soft deleted records

```js
transactionSchema.pre(/^find/, function(next) {
  this.where({ isDeleted: false });  // add condition to every find query
  next();
});
```

| Line | Explanation |
|---|---|
| `/^find/` | Regex — matches `find`, `findOne`, `findById`, `findByIdAndUpdate` |
| `this.where()` | Adds an extra condition to the current query automatically |
| Result | Soft-deleted records are NEVER returned in any query |

---

## 8. Utilities

### 8a. AppError — `src/utils/AppError.js`

```js
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);              // calls Error constructor, sets this.message
    this.statusCode  = statusCode;
    this.isOperational = true;   // marks it as a known, expected error
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
```

| Line | Explanation |
|---|---|
| `extends Error` | Inherits all Error properties: `message`, `stack`, `name` |
| `super(message)` | Passes message to parent `Error` constructor |
| `isOperational: true` | Distinguishes expected errors (wrong input) from bugs (crashes) |
| `captureStackTrace` | Removes this constructor from the stack trace for cleaner logs |

**Usage:**
```js
throw new AppError('User not found', 404);
throw new AppError('Access denied', 403);
throw new AppError('Email already in use', 409);
```

---

### 8b. catchAsync — `src/utils/catchAsync.js`

```js
module.exports = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```

| Part | Explanation |
|---|---|
| `fn` | Your async controller function passed as argument |
| Returns | A new function that Express uses as a route handler |
| `Promise.resolve()` | Wraps `fn` in a promise so any rejection is caught |
| `.catch(next)` | Passes any error directly to Express global error handler |

**Without catchAsync — verbose:**
```js
exports.getAll = async (req, res, next) => {
  try {
    const data = await Transaction.find();
    res.json({ data });
  } catch (err) {
    next(err);  // must remember this in EVERY controller
  }
};
```

**With catchAsync — clean:**
```js
exports.getAll = catchAsync(async (req, res) => {
  const data = await Transaction.find();
  res.json({ data });
  // errors automatically forwarded to error handler
});
```

---

## 9. Middleware

### 9a. Auth Middleware — `src/middleware/auth.js`

Verifies the JWT token on every protected route. Runs before the controller.

```js
exports.protect = catchAsync(async (req, res, next) => {

  // Step 1: Check Authorization header exists
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return next(new AppError('Not authenticated. Please log in.', 401));

  // Step 2: Extract token (remove "Bearer " prefix)
  const token = authHeader.split(' ')[1];

  // Step 3: Verify signature and expiry
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded = { id: "userId", iat: timestamp, exp: timestamp }
  } catch (err) {
    return next(new AppError('Invalid or expired token.', 401));
  }

  // Step 4: Check user still exists in DB
  const user = await User.findById(decoded.id);
  if (!user) return next(new AppError('User no longer exists.', 401));

  // Step 5: Check account is active
  if (!user.isActive) return next(new AppError('Account deactivated.', 403));

  // Step 6: Attach user to request for downstream controllers
  req.user = user;
  next();
});
```

> `req.user = user` is critical — it makes the logged-in user available to every controller after this middleware without another DB query.

---

### 9b. RBAC Middleware — `src/middleware/rbac.js`

```js
const roleHierarchy = { viewer: 1, analyst: 2, admin: 3 };

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    const userLevel     = roleHierarchy[req.user.role] || 0;
    const requiredLevel = Math.min(...roles.map(r => roleHierarchy[r]));

    if (userLevel < requiredLevel)
      return next(new AppError(
        `Access denied. Required: ${roles.join(' or ')}. Your role: ${req.user.role}`,
        403
      ));

    next();
  };
};
```

| Line | Explanation |
|---|---|
| `roleHierarchy` | Maps roles to numbers — admin (3) > analyst (2) > viewer (1) |
| `...roles` | Rest parameter — accepts one or more allowed roles |
| `Math.min()` | If multiple roles allowed, user only needs the lowest one |
| `userLevel < requiredLevel` | Viewer (1) trying analyst (2) route → blocked with 403 |

**Usage in routes:**
```js
router.post('/', protect, restrictTo('analyst', 'admin'), create);
// Only analyst or admin can POST. Viewer gets 403 Forbidden.
```

---

### 9c. Validate Middleware — `src/middleware/validate.js`

```js
const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(e => e.msg).join(', ');
    return next(new AppError(messages, 400));
  }
  next();
};
```

| Line | Explanation |
|---|---|
| `validationResult(req)` | Collects all errors set by `body()` validators in the route |
| `errors.array().map(e => e.msg)` | Extracts just the message string from each error |
| `.join(', ')` | Combines multiple errors into one readable string |
| Returns `400` | Bad Request — the client sent invalid data |

---

## 10. Services Layer

Services contain all business logic and database operations. Controllers call services — **services never call controllers**.

### 10a. authService.js

```js
const signToken = id =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
```

| Part | Explanation |
|---|---|
| `jwt.sign({ id }, secret, options)` | Creates a token containing the user ID in the payload |
| `{ id }` | Only store user ID in token, not sensitive data |
| `expiresIn: '7d'` | Token automatically invalid after 7 days |

```js
exports.login = async ({ email, password }) => {
  // select:false on password so we must explicitly include it
  const user = await User.findOne({ email }).select('+password');

  // Check both in ONE condition — prevents user enumeration attacks
  if (!user || !(await user.correctPassword(password, user.password)))
    throw new AppError('Invalid email or password.', 401);

  if (!user.isActive)
    throw new AppError('Account deactivated.', 403);

  const token = signToken(user._id);
  return { token, user };
};
```

> Never tell the attacker whether the email exists OR the password is wrong — always use a single generic message for both cases.

---

### 10b. transactionService.js — Filtering & Pagination

```js
exports.getAll = async ({ type, category, startDate, endDate, page = 1, limit = 10 }) => {
  const filter = {};

  if (type)     filter.type     = type;
  if (category) filter.category = { $regex: category, $options: 'i' };  // case-insensitive

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);  // greater than or equal
    if (endDate)   filter.date.$lte = new Date(endDate);    // less than or equal
  }

  const skip = (Number(page) - 1) * Number(limit);  // pagination formula

  const [data, total] = await Promise.all([
    Transaction.find(filter).sort('-date').skip(skip).limit(Number(limit))
      .populate('createdBy', 'name email'),
    Transaction.countDocuments(filter)
  ]);

  return { data, total, page: Number(page), pages: Math.ceil(total / Number(limit)) };
};
```

| Line | Explanation |
|---|---|
| `$regex` with `$options: 'i'` | Case-insensitive search — "salary" matches "Salary" |
| `$gte` / `$lte` | MongoDB operators: greater-than-equal / less-than-equal |
| `Promise.all()` | Runs data query and count query simultaneously — faster |
| `sort('-date')` | Minus sign = descending order (newest first) |
| `.populate()` | Replaces `createdBy` ObjectId with actual user name and email |
| `skip = (page-1) * limit` | Standard pagination formula |

---

### 10c. dashboardService.js — MongoDB Aggregation

```js
exports.getSummary = async () => {
  const result = await Transaction.aggregate([
    { $match: { isDeleted: false } },          // filter out deleted (like WHERE)
    { $group: { _id: '$type', total: { $sum: '$amount' } } }  // group by type, sum amounts
  ]);
  // result = [{ _id: 'income', total: 8000 }, { _id: 'expense', total: 3000 }]

  const income  = result.find(r => r._id === 'income')?.total  || 0;
  const expense = result.find(r => r._id === 'expense')?.total || 0;

  return { totalIncome: income, totalExpenses: expense, netBalance: income - expense };
};
```

| Stage | SQL Equivalent | Explanation |
|---|---|---|
| `$match` | `WHERE` | Filters documents by condition |
| `$group` | `GROUP BY` | Groups and computes aggregate values |
| `$sort` | `ORDER BY` | Sorts documents |
| `$sum` | `SUM()` | Sums a numeric field |
| `?.total` | — | Optional chaining in case no income/expense records exist |

---

## 11. Controllers Layer

Controllers are **thin** — receive HTTP request, call the right service, send response. No business logic here.

```js
// CREATE
exports.create = catchAsync(async (req, res) => {
  const tx = await transactionService.create(req.body, req.user._id);
  res.status(201).json({ success: true, data: tx });
});

// GET ONE
exports.getOne = catchAsync(async (req, res, next) => {
  const tx = await transactionService.getById(req.params.id);
  if (!tx) return next(new AppError('Transaction not found.', 404));
  res.status(200).json({ success: true, data: tx });
});

// UPDATE
exports.update = catchAsync(async (req, res, next) => {
  const tx = await transactionService.update(req.params.id, req.body);
  if (!tx) return next(new AppError('Transaction not found.', 404));
  res.status(200).json({ success: true, data: tx });
});

// SOFT DELETE
exports.remove = catchAsync(async (req, res, next) => {
  const tx = await transactionService.softDelete(req.params.id);
  if (!tx) return next(new AppError('Transaction not found.', 404));
  res.status(200).json({ success: true, message: 'Transaction deleted.' });
});
```

| Part | Explanation |
|---|---|
| `req.body` | JSON body sent by the client |
| `req.params.id` | The `:id` from the URL e.g. `/transactions/abc123` |
| `req.user._id` | Set by `protect` middleware — who is making the request |
| `201 Created` | Correct HTTP status for resource creation |
| `{ success: true }` | Consistent response envelope for the frontend |

---

## 12. Routes Layer

### Transaction Routes — full example

```js
router.use(protect);  // ALL routes below require a valid JWT token

// All roles can view
router.get('/',     restrictTo('viewer', 'analyst', 'admin'), getAll);
router.get('/:id',  restrictTo('viewer', 'analyst', 'admin'), getOne);

// Only analyst and admin can create
router.post('/',
  restrictTo('analyst', 'admin'),
  [
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
    body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
    body('category').notEmpty().withMessage('Category is required')
  ],
  validate,
  create
);

// Only analyst and admin can update
router.patch('/:id',  restrictTo('analyst', 'admin'), update);

// Only admin can delete
router.delete('/:id', restrictTo('admin'),            remove);
```

### Middleware execution order for POST /api/transactions

```
1. protect          → verify JWT token, attach req.user
2. restrictTo(...)  → check role is analyst or admin
3. body() validators → validate request body fields
4. validate         → if errors found, return 400 Bad Request
5. create           → call the controller
```

---

## 13. Server Entry Point

**`server.js`**

```js
const express   = require('express');
const mongoose  = require('mongoose');
const dotenv    = require('dotenv');
const helmet    = require('helmet');
const morgan    = require('morgan');
const cors      = require('cors');
const rateLimit = require('express-rate-limit');
const AppError  = require('./src/utils/AppError');

dotenv.config();  // load .env variables into process.env

const app = express();

// ── Security & Utility Middleware ──────────────────────────────
app.use(helmet());              // sets secure HTTP headers
app.use(cors({ origin: '*' })); // allow requests from any origin
app.use(morgan('dev'));          // log every request to console
app.use(express.json());         // parse JSON request body

// ── Rate Limiting ──────────────────────────────────────────────
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minute window
  max: 100,                    // 100 requests per window per IP
  message: { success: false, message: 'Too many requests.' }
}));

// ── Routes ─────────────────────────────────────────────────────
app.use('/api/auth',         require('./src/routes/auth'));
app.use('/api/users',        require('./src/routes/users'));
app.use('/api/transactions', require('./src/routes/transactions'));
app.use('/api/dashboard',    require('./src/routes/dashboard'));

// ── 404 Handler ────────────────────────────────────────────────
app.all('*path', (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// ── Global Error Handler ───────────────────────────────────────
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

// ── Connect DB & Start Server ──────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
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
```

| Middleware | Purpose |
|---|---|
| `helmet()` | Sets X-Content-Type, X-Frame-Options, and other security headers |
| `cors({ origin: '*' })` | Allows browser requests from any origin — restrict in production |
| `morgan('dev')` | Logs: `GET /api/transactions 200 12ms` |
| `express.json()` | Without this `req.body` is `undefined` |
| `rateLimit` | Limits each IP to 100 requests per 15 minutes — prevents abuse |
| Error handler 4 params | Express identifies `(err, req, res, next)` as error handler |
| `stack` in dev only | Never expose stack traces in production |

---

## 14. Complete API Reference

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | None | Register a new user |
| `POST` | `/api/auth/login` | None | Login and get JWT token |

### Users

| Method | Endpoint | Role | Description |
|---|---|---|---|
| `GET` | `/api/users` | Admin | List all users |
| `PATCH` | `/api/users/:id` | Admin | Update role or active status |

### Transactions

| Method | Endpoint | Role | Description |
|---|---|---|---|
| `GET` | `/api/transactions` | All | List with filters & pagination |
| `GET` | `/api/transactions/:id` | All | Get single transaction |
| `POST` | `/api/transactions` | Analyst + | Create new transaction |
| `PATCH` | `/api/transactions/:id` | Analyst + | Update a transaction |
| `DELETE` | `/api/transactions/:id` | Admin | Soft delete |

### Dashboard

| Method | Endpoint | Role | Description |
|---|---|---|---|
| `GET` | `/api/dashboard/summary` | Analyst + | Total income, expense, net balance |
| `GET` | `/api/dashboard/categories` | Analyst + | Totals grouped by category |
| `GET` | `/api/dashboard/trends` | Analyst + | Monthly income and expense |
| `GET` | `/api/dashboard/recent` | Analyst + | 5 most recent transactions |

### Query Parameters for GET /api/transactions

| Parameter | Type | Example | Description |
|---|---|---|---|
| `type` | string | `income` | Filter by income or expense |
| `category` | string | `Salary` | Case-insensitive category search |
| `startDate` | date | `2025-01-01` | Filter from this date |
| `endDate` | date | `2025-12-31` | Filter until this date |
| `page` | number | `2` | Page number (default: 1) |
| `limit` | number | `10` | Records per page (default: 10) |

---

## 15. Role Permissions Matrix

| Action | Viewer | Analyst | Admin |
|---|---|---|---|
| View transactions | ✅ | ✅ | ✅ |
| Create transactions | ❌ | ✅ | ✅ |
| Update transactions | ❌ | ✅ | ✅ |
| Delete transactions | ❌ | ❌ | ✅ |
| View dashboard analytics | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ✅ |

### Role hierarchy in code

```js
const roleHierarchy = { viewer: 1, analyst: 2, admin: 3 };
// admin (3) > analyst (2) > viewer (1)
// A user only needs to meet the MINIMUM level of the allowed roles
```

---

## 16. Request & Response Examples

### Register User

**Request**
```http
POST /api/auth/register
Content-Type: application/json

{
  "name":     "Alice Admin",
  "email":    "alice@test.com",
  "password": "secret123",
  "role":     "admin"
}
```

**Response — 201 Created**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id":    "abc123",
    "name":  "Alice Admin",
    "email": "alice@test.com",
    "role":  "admin"
  }
}
```

---

### Login

**Request**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email":    "alice@test.com",
  "password": "secret123"
}
```

**Response — 200 OK**
```json
{
  "success": true,
  "token":   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user":    { "email": "alice@test.com", "role": "admin" }
}
```

---

### Create Transaction

**Request**
```http
POST /api/transactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount":   5000,
  "type":     "income",
  "category": "Salary",
  "date":     "2025-01-15",
  "notes":    "Monthly salary"
}
```

**Response — 201 Created**
```json
{
  "success": true,
  "data": {
    "_id":       "tx123",
    "amount":    5000,
    "type":      "income",
    "category":  "Salary",
    "isDeleted": false,
    "createdBy": { "name": "Alice Admin", "email": "alice@test.com" },
    "createdAt": "2025-01-15T10:00:00.000Z"
  }
}
```

---

### Dashboard Summary

**Response — 200 OK**
```json
{
  "success": true,
  "data": {
    "totalIncome":   8000,
    "totalExpenses": 3000,
    "netBalance":    5000
  }
}
```

---

### RBAC Error — 403 Forbidden

```json
{
  "success": false,
  "status":  403,
  "message": "Access denied. Required role: analyst or admin. Your role: viewer"
}
```

---

### Validation Error — 400 Bad Request

```json
{
  "success": false,
  "status":  400,
  "message": "Amount must be a positive number, Category is required"
}
```

---
