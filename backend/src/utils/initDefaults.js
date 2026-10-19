const Category = require('../models/Category');

const DEFAULT_CATEGORIES = [
  { name: 'Salary', type: 'income', isDefault: true },
  { name: 'Freelance', type: 'income', isDefault: true },
  { name: 'Investments', type: 'income', isDefault: true },
  { name: 'Other Income', type: 'income', isDefault: true },

  { name: 'Food & Dining', type: 'expense', isDefault: true },
  { name: 'Transport', type: 'expense', isDefault: true },
  { name: 'Housing & Rent', type: 'expense', isDefault: true },
  { name: 'Utilities', type: 'expense', isDefault: true },
  { name: 'Entertainment', type: 'expense', isDefault: true },
  { name: 'Healthcare', type: 'expense', isDefault: true },
  { name: 'Shopping', type: 'expense', isDefault: true },
  { name: 'Personal Care', type: 'expense', isDefault: true },
  { name: 'Education', type: 'expense', isDefault: true },
];

const ensureDefaultCategories = async () => {
  try {
    const operations = DEFAULT_CATEGORIES.map((cat) => ({
      updateOne: {
        filter: { name: cat.name, type: cat.type, user: null },
        update: { $setOnInsert: { ...cat, user: null } },
        upsert: true,
      },
    }));

    await Category.bulkWrite(operations);
    console.log(`Default categories verified/initialized (${DEFAULT_CATEGORIES.length} categories)`);
  } catch (err) {
    console.error('Error ensuring default categories:', err.message);
  }
};

module.exports = {
  DEFAULT_CATEGORIES,
  ensureDefaultCategories,
};
