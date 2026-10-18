const Transaction = require('../models/Transaction');
const ApiError = require('../utils/ApiError');

// GET /api/transactions
exports.list = async (req, res, next) => {
  try {
    const filter = { user: req.user._id };

    if (req.query.type) filter.type = req.query.type;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.date.$lte = new Date(req.query.endDate);
    }

    const transactions = await Transaction.find(filter)
      .populate('category', 'name type')
      .sort('-date');

    res.json({ success: true, count: transactions.length, transactions });
  } catch (err) {
    next(err);
  }
};

// POST /api/transactions
exports.create = async (req, res, next) => {
  try {
    const { type, amount, category, date, note, currency } = req.body;
    const transaction = await Transaction.create({
      user: req.user._id,
      type,
      amount,
      category,
      date: date || Date.now(),
      note,
      ...(currency && { currency }),
    });

    res.status(201).json({ success: true, transaction });
  } catch (err) {
    next(err);
  }
};

// GET /api/transactions/:id
exports.getOne = async (req, res, next) => {
  try {
    const txn = await Transaction.findById(req.params.id).populate('category', 'name type');
    if (!txn) throw new ApiError(404, 'Transaction not found');
    if (String(txn.user) !== String(req.user._id)) {
      throw new ApiError(403, 'Not authorized');
    }
    res.json({ success: true, transaction: txn });
  } catch (err) {
    next(err);
  }
};

// PUT /api/transactions/:id
exports.update = async (req, res, next) => {
  try {
    const txn = await Transaction.findById(req.params.id);
    if (!txn) throw new ApiError(404, 'Transaction not found');
    if (String(txn.user) !== String(req.user._id)) {
      throw new ApiError(403, 'Not authorized');
    }

    const allowed = ['type', 'amount', 'category', 'date', 'note', 'currency'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) txn[field] = req.body[field];
    });
    await txn.save();

    res.json({ success: true, transaction: txn });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/transactions/:id
exports.remove = async (req, res, next) => {
  try {
    const txn = await Transaction.findById(req.params.id);
    if (!txn) throw new ApiError(404, 'Transaction not found');
    if (String(txn.user) !== String(req.user._id)) {
      throw new ApiError(403, 'Not authorized');
    }

    await txn.deleteOne();
    res.json({ success: true, message: 'Transaction deleted' });
  } catch (err) {
    next(err);
  }
};
