const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');

// GET /api/dashboard/summary
exports.getSummary = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    let startDate;
    let endDate;

    if (req.query.startDate && req.query.endDate) {
      startDate = new Date(req.query.startDate);
      endDate = new Date(req.query.endDate);
    } else {
      const now = new Date();
      const year = req.query.year ? parseInt(req.query.year, 10) : now.getFullYear();
      const month = req.query.month ? parseInt(req.query.month, 10) : now.getMonth() + 1;

      startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    }

    const totals = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
        },
      },
    ]);

    let totalIncome = 0;
    let totalExpense = 0;

    totals.forEach((item) => {
      if (item._id === 'income') totalIncome = item.total;
      if (item._id === 'expense') totalExpense = item.total;
    });

    const balance = totalIncome - totalExpense;

    const categoryBreakdown = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          type: 'expense',
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryDetails',
        },
      },
      {
        $unwind: {
          path: '$categoryDetails',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          categoryId: '$_id',
          categoryName: { $ifNull: ['$categoryDetails.name', 'Uncategorized'] },
          amount: '$totalAmount',
          count: '$count',
        },
      },
      {
        $sort: { amount: -1 },
      },
    ]);

    const categoryExpenses = categoryBreakdown.map((item) => ({
      ...item,
      percentage:
        totalExpense > 0
          ? Number(((item.amount / totalExpense) * 100).toFixed(1))
          : 0,
    }));

    const recentTransactions = await Transaction.find({ user: userId })
      .populate('category', 'name type')
      .sort({ date: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        period: {
          startDate,
          endDate,
        },
        totalIncome,
        totalExpense,
        balance,
        categoryExpenses,
        recentTransactions,
      },
    });
  } catch (err) {
    next(err);
  }
};
