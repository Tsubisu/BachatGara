const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../index');
const db = require('../db');

const mockUserId = '11111111-1111-1111-1111-111111111111';
const mockToken = jwt.sign(
  { id: mockUserId, email: 'test@example.com' },
  process.env.JWT_SECRET || 'dev_insecure_jwt_secret_fallback_key'
);

describe('BachatGara Database API Endpoint Suite (20 Tests)', () => {

  afterAll(async () => {
    if (db.pool) {
      await db.pool.end();
    }
  });

  describe('Authentication Module', () => {
    test('1. POST /api/auth/register rejects missing fields with 422', async () => {
      const res = await request(app).post('/api/auth/register').send();
      expect(res.statusCode).toBe(422);
    });

    test('2. POST /api/auth/login rejects invalid credentials with 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'invalid@example.com', password: 'WrongPassword123!' });
      expect(res.statusCode).toBe(401);
    });

    test('3. POST /api/auth/verify-email rejects missing code with 422', async () => {
      const res = await request(app).post('/api/auth/verify-email').send();
      expect(res.statusCode).toBe(422);
    });

    test('4. POST /api/auth/forgot-password rejects empty payload with 422', async () => {
      const res = await request(app).post('/api/auth/forgot-password').send();
      expect(res.statusCode).toBe(422);
    });
  });

  describe('Security Controls Module', () => {
    test('5. GET /api/accounts rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/accounts');
      expect(res.statusCode).toBe(401);
    });

    test('6. GET /api/transactions rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/transactions');
      expect(res.statusCode).toBe(401);
    });

    test('7. GET /api/budgets/plans rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/budgets/plans');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('Bank Accounts Module', () => {
    test('8. GET /api/accounts returns user bank accounts list', async () => {
      const res = await request(app)
        .get('/api/accounts')
        .set('Authorization', `Bearer ${mockToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('9. GET /api/accounts?active=true returns active bank accounts list', async () => {
      const res = await request(app)
        .get('/api/accounts?active=true')
        .set('Authorization', `Bearer ${mockToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('10. POST /api/accounts rejects account creation without name/type with 422', async () => {
      const res = await request(app)
        .post('/api/accounts')
        .set('Authorization', `Bearer ${mockToken}`)
        .send();
      expect(res.statusCode).toBe(422);
    });
  });

  describe('Transactions Module', () => {
    test('11. GET /api/transactions returns user transaction ledger', async () => {
      const res = await request(app)
        .get('/api/transactions')
        .set('Authorization', `Bearer ${mockToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('12. POST /api/transactions/manual rejects creation without amount or category with 422', async () => {
      const res = await request(app)
        .post('/api/transactions/manual')
        .set('Authorization', `Bearer ${mockToken}`)
        .send();
      expect(res.statusCode).toBe(422);
    });
  });

  describe('Budgets & Goals Module', () => {
    test('13. GET /api/budgets/plans returns budget plans', async () => {
      const res = await request(app)
        .get('/api/budgets/plans')
        .set('Authorization', `Bearer ${mockToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('14. GET /api/goals returns user savings goals', async () => {
      const res = await request(app)
        .get('/api/goals')
        .set('Authorization', `Bearer ${mockToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Subscriptions & Alerts Module', () => {
    test('15. GET /api/subscriptions returns user recurring subscriptions', async () => {
      const res = await request(app)
        .get('/api/subscriptions')
        .set('Authorization', `Bearer ${mockToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('16. GET /api/alerts returns unresolved SMS alerts', async () => {
      const res = await request(app)
        .get('/api/alerts')
        .set('Authorization', `Bearer ${mockToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('System Metadata Module', () => {
    test('17. GET /api/banks returns list of supported banks', async () => {
      const res = await request(app)
        .get('/api/banks')
        .set('Authorization', `Bearer ${mockToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('18. GET /api/categories returns expense/income category hierarchy', async () => {
      const res = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${mockToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Public System Connectivity Module', () => {
    test('19. GET / returns API root status payload', async () => {
      const res = await request(app).get('/');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message');
    });

    test('20. GET /api/server-info returns server details & IP metadata', async () => {
      const res = await request(app).get('/api/server-info');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('app', 'BachatGara Backend');
    });
  });

});