const path = require('path');

module.paths.push(path.join(__dirname, '../backend/node_modules'));

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/xpns';

let models;
try {
  models = require('../backend/src/models');
} catch (e) {
  models = require('./src/models');
}
const { User, Category, Transaction } = models;

// Demo credentials
const DEMO_USER = {
  name: 'Demo User',
  email: 'demo@xpns.test',
  password: 'DemoUser123!',
};

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

async function seed() {
  console.log('Connecting to database...');
  await mongoose.connect(MONGO_URI);
  console.log(`Connected to MongoDB at ${MONGO_URI}`);

  console.log('Seeding default categories...');
  const categoryMap = {};
  for (const cat of DEFAULT_CATEGORIES) {
    const existing = await Category.findOneAndUpdate(
      { name: cat.name, type: cat.type, user: null },
      { ...cat, user: null },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    categoryMap[`${cat.type}:${cat.name}`] = existing._id;
  }
  console.log(`Seeded ${DEFAULT_CATEGORIES.length} default categories.`);

  console.log('Seeding demo user...');
  let demoUser = await User.findOne({ email: DEMO_USER.email });
  if (demoUser) {
    demoUser.password = DEMO_USER.password; 
    demoUser.name = DEMO_USER.name;
    await demoUser.save();
    console.log(`Updated existing demo user: ${DEMO_USER.email}`);
  } else {
    demoUser = await User.create({
      name: DEMO_USER.name,
      email: DEMO_USER.email,
      password: DEMO_USER.password,
    });
    console.log(`Created demo user: ${DEMO_USER.email}`);
  }

  await Transaction.deleteMany({ user: demoUser._id });
  console.log('Cleared existing transactions for demo user.');

  const daysAgo = (days) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  };

  const sampleTransactions = [
    {
      type: 'income',
      amount: 4500,
      category: categoryMap['income:Salary'],
      date: daysAgo(3),
      note: 'Monthly salary (current month)',
    },
    {
      type: 'income',
      amount: 850,
      category: categoryMap['income:Freelance'],
      date: daysAgo(8),
      note: 'Web design freelance gig',
    },
    {
      type: 'income',
      amount: 120,
      category: categoryMap['income:Investments'],
      date: daysAgo(14),
      note: 'Index fund dividend payout',
    },
    {
      type: 'income',
      amount: 4500,
      category: categoryMap['income:Salary'],
      date: daysAgo(33),
      note: 'Monthly salary (prior month)',
    },

    {
      type: 'expense',
      amount: 1200,
      category: categoryMap['expense:Housing & Rent'],
      date: daysAgo(2),
      note: 'Apartment monthly rent',
    },
    {
      type: 'expense',
      amount: 85.5,
      category: categoryMap['expense:Utilities'],
      date: daysAgo(4),
      note: 'Electricity bill',
    },
    {
      type: 'expense',
      amount: 60,
      category: categoryMap['expense:Utilities'],
      date: daysAgo(5),
      note: 'Fiber internet connection',
    },
    {
      type: 'expense',
      amount: 32.2,
      category: categoryMap['expense:Utilities'],
      date: daysAgo(6),
      note: 'Water bill',
    },

    {
      type: 'expense',
      amount: 142.8,
      category: categoryMap['expense:Food & Dining'],
      date: daysAgo(1),
      note: 'Weekly grocery store trip',
    },
    {
      type: 'expense',
      amount: 68.5,
      category: categoryMap['expense:Food & Dining'],
      date: daysAgo(3),
      note: 'Italian restaurant dinner',
    },
    {
      type: 'expense',
      amount: 18.25,
      category: categoryMap['expense:Food & Dining'],
      date: daysAgo(4),
      note: 'Lunch at burrito joint',
    },
    {
      type: 'expense',
      amount: 5.75,
      category: categoryMap['expense:Food & Dining'],
      date: daysAgo(5),
      note: 'Morning artisan coffee',
    },
    {
      type: 'expense',
      amount: 115.4,
      category: categoryMap['expense:Food & Dining'],
      date: daysAgo(9),
      note: 'Supermarket supplies and snacks',
    },
    {
      type: 'expense',
      amount: 42.0,
      category: categoryMap['expense:Food & Dining'],
      date: daysAgo(11),
      note: 'Friday takeout sushi',
    },
    {
      type: 'expense',
      amount: 6.25,
      category: categoryMap['expense:Food & Dining'],
      date: daysAgo(12),
      note: 'Latte & pastry',
    },
    {
      type: 'expense',
      amount: 130.0,
      category: categoryMap['expense:Food & Dining'],
      date: daysAgo(16),
      note: 'Organic farmers market run',
    },

    {
      type: 'expense',
      amount: 90,
      category: categoryMap['expense:Transport'],
      date: daysAgo(2),
      note: 'Monthly city transit pass',
    },
    {
      type: 'expense',
      amount: 48.5,
      category: categoryMap['expense:Transport'],
      date: daysAgo(7),
      note: 'Gas tank refill',
    },
    {
      type: 'expense',
      amount: 24.3,
      category: categoryMap['expense:Transport'],
      date: daysAgo(10),
      note: 'Late night rideshare trip',
    },

    {
      type: 'expense',
      amount: 15.99,
      category: categoryMap['expense:Entertainment'],
      date: daysAgo(3),
      note: 'Streaming service subscription',
    },
    {
      type: 'expense',
      amount: 32.0,
      category: categoryMap['expense:Entertainment'],
      date: daysAgo(7),
      note: 'IMAX movie tickets for two',
    },
    {
      type: 'expense',
      amount: 65.0,
      category: categoryMap['expense:Entertainment'],
      date: daysAgo(15),
      note: 'Concert admission ticket',
    },

    {
      type: 'expense',
      amount: 35.5,
      category: categoryMap['expense:Healthcare'],
      date: daysAgo(8),
      note: 'Pharmacy prescription & vitamins',
    },
    {
      type: 'expense',
      amount: 120.0,
      category: categoryMap['expense:Healthcare'],
      date: daysAgo(20),
      note: 'Dental cleaning copay',
    },

    {
      type: 'expense',
      amount: 89.99,
      category: categoryMap['expense:Shopping'],
      date: daysAgo(6),
      note: 'Wireless noise-canceling earbuds',
    },
    {
      type: 'expense',
      amount: 45.0,
      category: categoryMap['expense:Shopping'],
      date: daysAgo(13),
      note: 'New work shirt',
    },
    {
      type: 'expense',
      amount: 28.5,
      category: categoryMap['expense:Shopping'],
      date: daysAgo(18),
      note: 'Paperback textbooks',
    },

    {
      type: 'expense',
      amount: 35.0,
      category: categoryMap['expense:Personal Care'],
      date: daysAgo(11),
      note: 'Haircut and styling',
    },

    {
      type: 'expense',
      amount: 29.99,
      category: categoryMap['expense:Education'],
      date: daysAgo(17),
      note: 'Online coding course monthly fee',
    },

    {
      type: 'expense',
      amount: 1200,
      category: categoryMap['expense:Housing & Rent'],
      date: daysAgo(32),
      note: 'Prior month apartment rent',
    },
    {
      type: 'expense',
      amount: 95.0,
      category: categoryMap['expense:Utilities'],
      date: daysAgo(34),
      note: 'Prior month electricity',
    },
    {
      type: 'expense',
      amount: 155.0,
      category: categoryMap['expense:Food & Dining'],
      date: daysAgo(35),
      note: 'Prior month major grocery shopping',
    },
  ];

  const docs = sampleTransactions.map((txn) => ({
    ...txn,
    user: demoUser._id,
  }));

  await Transaction.insertMany(docs);
  console.log(`Successfully seeded ${docs.length} sample transactions.`);

  console.log('\n==========================================');
  console.log('   SEED COMPLETED SUCCESSFULLY');
  console.log('==========================================');
  console.log('Demo Login Credentials (DEMO ONLY):');
  console.log(`Email:    ${DEMO_USER.email}`);
  console.log(`Password: ${DEMO_USER.password}`);
  console.log('==========================================\n');

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}

module.exports = seed;
