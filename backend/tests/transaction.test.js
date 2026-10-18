const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Category = require('../src/models/Category');

const setup = async (email = 'txn@test.com') => {
  const reg = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Txn User', email, password: 'password123' });
  const token = reg.body.token;

  const cat = await Category.findOneAndUpdate(
    { name: 'Food', type: 'expense', user: null },
    { name: 'Food', type: 'expense', isDefault: true },
    { upsert: true, new: true }
  );
  const incomeCat = await Category.findOneAndUpdate(
    { name: 'Salary', type: 'income', user: null },
    { name: 'Salary', type: 'income', isDefault: true },
    { upsert: true, new: true }
  );

  return { token, categoryId: cat._id.toString(), incomeCatId: incomeCat._id.toString() };
};

describe('POST /api/transactions', () => {
  it('should create a transaction', async () => {
    const { token, categoryId } = await setup();
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'expense', amount: 25.5, category: categoryId, note: 'Lunch' });

    expect(res.status).toBe(201);
    expect(res.body.transaction.amount).toBe(25.5);
    expect(res.body.transaction.type).toBe('expense');
  });

  it('should reject negative amount', async () => {
    const { token, categoryId } = await setup();
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'expense', amount: -10, category: categoryId });
    expect(res.status).toBe(400);
  });

  it('should reject missing type', async () => {
    const { token, categoryId } = await setup();
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 10, category: categoryId });
    expect(res.status).toBe(400);
  });

  it('should reject invalid category id', async () => {
    const { token } = await setup();
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'expense', amount: 10, category: 'not-an-id' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/transactions', () => {
  it('should list user transactions', async () => {
    const { token, categoryId } = await setup();
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'expense', amount: 10, category: categoryId });

    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
  });

  it('should filter by type', async () => {
    const { token, categoryId, incomeCatId } = await setup();
    await request(app).post('/api/transactions').set('Authorization', `Bearer ${token}`)
      .send({ type: 'expense', amount: 10, category: categoryId });
    await request(app).post('/api/transactions').set('Authorization', `Bearer ${token}`)
      .send({ type: 'income', amount: 100, category: incomeCatId });

    const res = await request(app)
      .get('/api/transactions?type=income')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.count).toBe(1);
    expect(res.body.transactions[0].type).toBe('income');
  });

  it('should filter by date range', async () => {
    const { token, categoryId } = await setup();
    await request(app).post('/api/transactions').set('Authorization', `Bearer ${token}`)
      .send({ type: 'expense', amount: 50, category: categoryId, date: '2025-01-15' });
    await request(app).post('/api/transactions').set('Authorization', `Bearer ${token}`)
      .send({ type: 'expense', amount: 30, category: categoryId, date: '2025-03-20' });

    const res = await request(app)
      .get('/api/transactions?startDate=2025-03-01&endDate=2025-03-31')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body.count).toBe(1);
    expect(res.body.transactions[0].amount).toBe(30);
  });
});

describe('PUT /api/transactions/:id', () => {
  it('should update a transaction', async () => {
    const { token, categoryId } = await setup();
    const created = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'expense', amount: 20, category: categoryId });

    const res = await request(app)
      .put(`/api/transactions/${created.body.transaction._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'expense', amount: 35, category: categoryId, note: 'Updated' });
    expect(res.status).toBe(200);
    expect(res.body.transaction.amount).toBe(35);
    expect(res.body.transaction.note).toBe('Updated');
  });
});

describe('DELETE /api/transactions/:id', () => {
  it('should delete a transaction', async () => {
    const { token, categoryId } = await setup();
    const created = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'expense', amount: 10, category: categoryId });

    const res = await request(app)
      .delete(`/api/transactions/${created.body.transaction._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);

    const list = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${token}`);
    expect(list.body.count).toBe(0);
  });

  it('should return 404 for non-existent transaction', async () => {
    const { token } = await setup();
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/api/transactions/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('User isolation', () => {
  it('user A cannot read user B transaction', async () => {
    const userA = await setup('a@test.com');
    const userB = await setup('b@test.com');

    const created = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ type: 'expense', amount: 99, category: userA.categoryId });

    const res = await request(app)
      .get(`/api/transactions/${created.body.transaction._id}`)
      .set('Authorization', `Bearer ${userB.token}`);
    expect(res.status).toBe(403);
  });

  it('user A cannot delete user B transaction', async () => {
    const userA = await setup('a2@test.com');
    const userB = await setup('b2@test.com');

    const created = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ type: 'expense', amount: 50, category: userA.categoryId });

    const res = await request(app)
      .delete(`/api/transactions/${created.body.transaction._id}`)
      .set('Authorization', `Bearer ${userB.token}`);
    expect(res.status).toBe(403);
  });

  it('user A cannot update user B transaction', async () => {
    const userA = await setup('a3@test.com');
    const userB = await setup('b3@test.com');

    const created = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userA.token}`)
      .send({ type: 'expense', amount: 50, category: userA.categoryId });

    const res = await request(app)
      .put(`/api/transactions/${created.body.transaction._id}`)
      .set('Authorization', `Bearer ${userB.token}`)
      .send({ type: 'expense', amount: 999, category: userB.categoryId });
    expect(res.status).toBe(403);
  });

  it('user B list should not include user A transactions', async () => {
    const userA = await setup('a4@test.com');
    const userB = await setup('b4@test.com');

    await request(app).post('/api/transactions').set('Authorization', `Bearer ${userA.token}`)
      .send({ type: 'expense', amount: 10, category: userA.categoryId });

    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${userB.token}`);
    expect(res.body.count).toBe(0);
  });
});
