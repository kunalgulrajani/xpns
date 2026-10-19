const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/xpns';

const { User, Category, Transaction } = require('../src/models');
const { DEFAULT_CATEGORIES } = require('../src/utils/initDefaults');

// Demo credentials
const DEMO_USER = {
  name: 'Demo User',
  email: 'demo@xpns.test',
  password: 'DemoUser123!',
};

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
      amount: 65000,
      currency: 'INR',
      category: categoryMap['income:Salary'],
      date: daysAgo(3),
      note: 'Monthly salary (current month)',
    },
    {
      type: 'income',
      amount: 12500,
      currency: 'INR',
      category: categoryMap['income:Freelance'],
      date: daysAgo(8),
      note: 'Web design freelance gig',
    },
    {
      type: 'income',
      amount: 3200,
      currency: 'INR',
      category: categoryMap['income:Investments'],
      date: daysAgo(14),
      note: 'Index fund dividend payout',
    },
    {
      type: 'income',
      amount: 65000,
      currency: 'INR',
      category: categoryMap['income:Salary'],
      date: daysAgo(33),
      note: 'Monthly salary (prior month)',
    },

    {
      type: 'expense',
      amount: 18000,
      currency: 'INR',
      category: categoryMap['expense:Housing & Rent'],
      date: daysAgo(2),
      note: 'Apartment monthly rent',
    },
    {
      type: 'expense',
      amount: 1850,
      currency: 'INR',
      category: categoryMap['expense:Utilities'],
      date: daysAgo(4),
      note: 'Electricity bill',
    },
    {
      type: 'expense',
      amount: 999,
      currency: 'INR',
      category: categoryMap['expense:Utilities'],
      date: daysAgo(5),
      note: 'Fiber internet connection',
    },
    {
      type: 'expense',
      amount: 420,
      currency: 'INR',
      category: categoryMap['expense:Utilities'],
      date: daysAgo(6),
      note: 'Water bill',
    },

    {
      type: 'expense',
      amount: 3450,
      currency: 'INR',
      category: categoryMap['expense:Food & Dining'],
      date: daysAgo(1),
      note: 'Weekly supermarket groceries',
    },
    {
      type: 'expense',
      amount: 1650,
      currency: 'INR',
      category: categoryMap['expense:Food & Dining'],
      date: daysAgo(3),
      note: 'Dinner at Italian bistro',
    },
    {
      type: 'expense',
      amount: 380,
      currency: 'INR',
      category: categoryMap['expense:Food & Dining'],
      date: daysAgo(5),
      note: 'Artisan bakery breakfast',
    },
    {
      type: 'expense',
      amount: 1850,
      currency: 'INR',
      category: categoryMap['expense:Food & Dining'],
      date: daysAgo(7),
      note: 'Team lunch sushi platter',
    },
    {
      type: 'expense',
      amount: 750,
      currency: 'INR',
      category: categoryMap['expense:Food & Dining'],
      date: daysAgo(10),
      note: 'Farmers market fresh produce',
    },
    {
      type: 'expense',
      amount: 350,
      currency: 'INR',
      category: categoryMap['expense:Food & Dining'],
      date: daysAgo(12),
      note: 'Specialty coffee & beans',
    },

    {
      type: 'expense',
      amount: 1200,
      currency: 'INR',
      category: categoryMap['expense:Transport'],
      date: daysAgo(4),
      note: 'Monthly subway metro pass',
    },
    {
      type: 'expense',
      amount: 2500,
      currency: 'INR',
      category: categoryMap['expense:Transport'],
      date: daysAgo(9),
      note: 'Gasoline refill for car',
    },
    {
      type: 'expense',
      amount: 850,
      currency: 'INR',
      category: categoryMap['expense:Transport'],
      date: daysAgo(13),
      note: 'Airport rideshare trip',
    },

    {
      type: 'expense',
      amount: 649,
      currency: 'INR',
      category: categoryMap['expense:Entertainment'],
      date: daysAgo(6),
      note: 'Netflix monthly subscription',
    },
    {
      type: 'expense',
      amount: 119,
      currency: 'INR',
      category: categoryMap['expense:Entertainment'],
      date: daysAgo(11),
      note: 'Spotify Premium family plan',
    },
    {
      type: 'expense',
      amount: 750,
      currency: 'INR',
      category: categoryMap['expense:Entertainment'],
      date: daysAgo(15),
      note: 'Weekend IMAX cinema tickets',
    },

    {
      type: 'expense',
      amount: 800,
      currency: 'INR',
      category: categoryMap['expense:Healthcare'],
      date: daysAgo(8),
      note: 'Doctor consultation copay',
    },
    {
      type: 'expense',
      amount: 560,
      currency: 'INR',
      category: categoryMap['expense:Healthcare'],
      date: daysAgo(14),
      note: 'Prescription pharmacy refills',
    },

    {
      type: 'expense',
      amount: 4200,
      currency: 'INR',
      category: categoryMap['expense:Shopping'],
      date: daysAgo(7),
      note: 'Ergonomic mechanical keyboard',
    },
    {
      type: 'expense',
      amount: 2800,
      currency: 'INR',
      category: categoryMap['expense:Shopping'],
      date: daysAgo(16),
      note: 'Winter fleece jacket',
    },

    {
      type: 'expense',
      amount: 1800,
      currency: 'INR',
      category: categoryMap['expense:Personal Care'],
      date: daysAgo(11),
      note: 'Monthly gym membership',
    },
    {
      type: 'expense',
      amount: 450,
      currency: 'INR',
      category: categoryMap['expense:Personal Care'],
      date: daysAgo(17),
      note: 'Haircut and grooming',
    },

    {
      type: 'expense',
      amount: 1299,
      currency: 'INR',
      category: categoryMap['expense:Education'],
      date: daysAgo(10),
      note: 'Advanced TypeScript online course',
    },
    {
      type: 'expense',
      amount: 850,
      currency: 'INR',
      category: categoryMap['expense:Education'],
      date: daysAgo(18),
      note: 'System Architecture reference book',
    },

    {
      type: 'expense',
      amount: 18000,
      currency: 'INR',
      category: categoryMap['expense:Housing & Rent'],
      date: daysAgo(32),
      note: 'Prior month apartment rent',
    },
    {
      type: 'expense',
      amount: 1950,
      currency: 'INR',
      category: categoryMap['expense:Utilities'],
      date: daysAgo(34),
      note: 'Prior month electricity',
    },
    {
      type: 'expense',
      amount: 3800,
      currency: 'INR',
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