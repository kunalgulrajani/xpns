const request = require('supertest');
const app = require('../src/app');
const Category = require('../src/models/Category');
const Transaction = require('../src/models/Transaction');

const registerUser = async (email = 'dash@test.com') => {
  const reg = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Dash User', email, password: 'password123' });
  return reg.body.token;
};

const getCategory = async (name, type) => {
  return Category.findOneAndUpdate(
    { name, type, user: null },
    { name, type, isDefault: true },
    { upsert: true, new: true }
  );
};

describe('GET /api/dashboard/summary', () => {
  it('should return 401 if unauthenticated', async () => {
    const res = await request(app).get('/api/dashboard/summary');
    expect(res.status).toBe(401);
  });

  it('should return zeroes and empty list when user has no transactions', async () => {
    const token = await registerUser('empty@test.com');
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalIncome).toBe(0);
    expect(res.body.data.totalExpense).toBe(0);
    expect(res.body.data.balance).toBe(0);
    expect(res.body.data.categoryExpenses).toEqual([]);
  });

  it('should correctly calculate income, expense, balance, and category breakdown', async () => {
    const token = await registerUser('calc@test.com');
    const foodCat = await getCategory('Food', 'expense');
    const rentCat = await getCategory('Rent', 'expense');
    const salaryCat = await getCategory('Salary', 'income');

    const now = new Date();
    const currentMonthDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 15));

    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'income',
        amount: 5000,
        category: salaryCat._id.toString(),
        date: currentMonthDate.toISOString(),
      });

    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'expense',
        amount: 200,
        category: foodCat._id.toString(),
        date: currentMonthDate.toISOString(),
      });

    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'expense',
        amount: 300,
        category: foodCat._id.toString(),
        date: currentMonthDate.toISOString(),
      });

    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'expense',
        amount: 1500,
        category: rentCat._id.toString(),
        date: currentMonthDate.toISOString(),
      });

    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const { totalIncome, totalExpense, balance, categoryExpenses, recentTransactions } =
      res.body.data;

    expect(totalIncome).toBe(5000);
    expect(totalExpense).toBe(2000);
    expect(balance).toBe(3000);

    expect(categoryExpenses.length).toBe(2);
    expect(categoryExpenses[0].categoryName).toBe('Rent');
    expect(categoryExpenses[0].amount).toBe(1500);
    expect(categoryExpenses[0].percentage).toBe(75);
    expect(categoryExpenses[0].count).toBe(1);

    expect(categoryExpenses[1].categoryName).toBe('Food');
    expect(categoryExpenses[1].amount).toBe(500);
    expect(categoryExpenses[1].percentage).toBe(25);
    expect(categoryExpenses[1].count).toBe(2);

    expect(recentTransactions.length).toBe(4);
  });

  it('should filter summary by specified month and year query parameters', async () => {
    const token = await registerUser('monthfilter@test.com');
    const foodCat = await getCategory('Food', 'expense');

    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'expense',
        amount: 120,
        category: foodCat._id.toString(),
        date: '2025-01-15T12:00:00.000Z',
      });

    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'expense',
        amount: 350,
        category: foodCat._id.toString(),
        date: '2025-02-15T12:00:00.000Z',
      });

    const resJan = await request(app)
      .get('/api/dashboard/summary?month=1&year=2025')
      .set('Authorization', `Bearer ${token}`);

    expect(resJan.status).toBe(200);
    expect(resJan.body.data.totalExpense).toBe(120);

    const resFeb = await request(app)
      .get('/api/dashboard/summary?month=2&year=2025')
      .set('Authorization', `Bearer ${token}`);

    expect(resFeb.status).toBe(200);
    expect(resFeb.body.data.totalExpense).toBe(350);
  });

  it('should isolate user transactions in dashboard aggregation', async () => {
    const userAToken = await registerUser('usera_dash@test.com');
    const userBToken = await registerUser('userb_dash@test.com');
    const salaryCat = await getCategory('Salary', 'income');

    const now = new Date();
    const currentMonthDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 10));

    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        type: 'income',
        amount: 10000,
        category: salaryCat._id.toString(),
        date: currentMonthDate.toISOString(),
      });

    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userBToken}`)
      .send({
        type: 'income',
        amount: 2000,
        category: salaryCat._id.toString(),
        date: currentMonthDate.toISOString(),
      });

    const resA = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${userAToken}`);
    expect(resA.body.data.totalIncome).toBe(10000);

    const resB = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${userBToken}`);
    expect(resB.body.data.totalIncome).toBe(2000);
  });
});
