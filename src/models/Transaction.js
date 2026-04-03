const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
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
    date: {
      type:    Date,
      default: Date.now
    },
    notes: {
      type:      String,
      trim:      true,
      maxlength: 500
    },
    createdBy: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true
    },
    isDeleted: {
      type:    Boolean,
      default: false
    }
  },
  { timestamps: true }
);

transactionSchema.pre(/^find/, function (next) {
  this.where({ isDeleted: false });
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);