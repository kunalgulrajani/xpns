const request = require('supertest');
const app = require('../src/app');
const Category = require('../src/models/Category');

const getToken = async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Cat User', email: 'cat@test.com', password: 'password123' });
  return res.body.token;
};

let token;

beforeEach(async () => {
  token = await getToken();
});

describe('GET /api/categories', () => {
  it('should return default categories', async () => {
    await Category.create({ name: 'Food', type: 'expense', isDefault: true });

    const res = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.categories.length).toBe(1);
    expect(res.body.categories[0].name).toBe('Food');
  });

  it('should return user custom categories along with defaults', async () => {
    await Category.create({ name: 'Salary', type: 'income', isDefault: true });
    await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Freelance', type: 'income' });

    const res = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.categories.length).toBe(2);
  });
});

describe('POST /api/categories', () => {
  it('should create a custom category', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Gym', type: 'expense' });
    expect(res.status).toBe(201);
    expect(res.body.category.name).toBe('Gym');
    expect(res.body.category.isDefault).toBe(false);
  });

  it('should reject duplicate category name', async () => {
    await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Gym', type: 'expense' });

    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Gym', type: 'expense' });
    expect(res.status).toBe(409);
  });

  it('should reject missing name', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'expense' });
    expect(res.status).toBe(400);
  });

  it('should reject invalid type', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Foo', type: 'other' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/categories/:id', () => {
  it('should delete a custom category', async () => {
    const created = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Temp', type: 'expense' });

    const res = await request(app)
      .delete(`/api/categories/${created.body.category._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('should not delete a default category', async () => {
    const cat = await Category.create({ name: 'Food', type: 'expense', isDefault: true });
    const res = await request(app)
      .delete(`/api/categories/${cat._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('should not let user A delete user B custom category', async () => {
    const created = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Private', type: 'expense' });

    const regB = await request(app)
      .post('/api/auth/register')
      .send({ name: 'User B', email: 'b@test.com', password: 'password123' });

    const res = await request(app)
      .delete(`/api/categories/${created.body.category._id}`)
      .set('Authorization', `Bearer ${regB.body.token}`);
    expect(res.status).toBe(403);
  });
});
