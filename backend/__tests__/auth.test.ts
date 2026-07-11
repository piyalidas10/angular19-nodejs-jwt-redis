import request from 'supertest';
import { app } from '../src/server';
import { redisClient } from '../src/config/redis';

beforeAll(async () => {
  await redisClient.connect();
});

afterAll(async () => {
  await redisClient.quit();
});

describe('POST /api/auth/login', () => {
  it('returns 200 with user on valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'Admin@123' });

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.username).toBe('admin');
    expect(res.body.user.passwordHash).toBeUndefined(); // never expose hash
  }, 10000);

  it('sets HttpOnly cookies on successful login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'Admin@123' });

    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies).toBeDefined();
    const accessCookie  = cookies.find((c: string) => c.startsWith('accessToken='));
    const refreshCookie = cookies.find((c: string) => c.startsWith('refreshToken='));
    expect(accessCookie).toBeDefined();
    expect(refreshCookie).toBeDefined();

    // Both must be HttpOnly
    expect(accessCookie).toMatch(/HttpOnly/i);
    expect(refreshCookie).toMatch(/HttpOnly/i);
  }, 10000);

  it('returns 401 on invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    // Must NOT set any cookie
    expect(res.headers['set-cookie']).toBeUndefined();
  }, 10000);

  it('returns 422 on missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin' });

    expect(res.status).toBe(422);
  }, 10000);
});

describe('GET /api/auth/me', () => {
  it('returns 401 without cookie', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns user with valid access token cookie', async () => {
    // Login to get the cookie
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'manager', password: 'Manager@123' });

    const cookie = (loginRes.headers['set-cookie'] as unknown as string[])
      .find((c: string) => c.startsWith('accessToken='))!;

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookie);

    expect(meRes.status).toBe(200);
    expect(meRes.body.user.username).toBe('manager');
  }, 10000);
});

describe('POST /api/auth/refresh', () => {
  it('returns 401 without refresh cookie', async () => {
    const res = await request(app).post('/api/auth/refresh');
    expect(res.status).toBe(401);
  });

  it('issues new cookies when refresh token is valid', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'employee', password: 'Employee@123' });

    const cookies = loginRes.headers['set-cookie'] as unknown as string[];
    const refreshCookie = cookies.find((c: string) => c.startsWith('refreshToken='))!;

    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', refreshCookie);

    expect(refreshRes.status).toBe(200);
    const newCookies = refreshRes.headers['set-cookie'] as unknown as string[];
    expect(newCookies?.some((c: string) => c.startsWith('accessToken='))).toBe(true);
  }, 10000);
});

describe('POST /api/auth/logout', () => {
  it('clears cookies and returns 200', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'Admin@123' });

    const accessCookie = (loginRes.headers['set-cookie'] as unknown as string[])
      .find((c: string) => c.startsWith('accessToken='))!;

    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', accessCookie);

    expect(logoutRes.status).toBe(200);
    // Cleared cookies have Max-Age=0 or Expires in the past
    const cleared = (logoutRes.headers['set-cookie'] as unknown as string[]);
    const accessCleared = cleared?.find((c: string) => c.startsWith('accessToken='));
    expect(accessCleared).toMatch(/Max-Age=0|expires=Thu, 01 Jan 1970/i);
  }, 10000);
});

describe('RBAC — GET /api/users', () => {
  it('allows ADMIN to list users', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'Admin@123' });
    const cookie = (login.headers['set-cookie'] as unknown as string[])
      .find((c: string) => c.startsWith('accessToken='))!;

    const res = await request(app)
      .get('/api/users')
      .set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  }, 10000);

  it('forbids EMPLOYEE from listing users', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ username: 'employee', password: 'Employee@123' });
    const cookie = (login.headers['set-cookie'] as unknown as string[])
      .find((c: string) => c.startsWith('accessToken='))!;

    const res = await request(app)
      .get('/api/users')
      .set('Cookie', cookie);
    expect(res.status).toBe(403);
  }, 10000);
});
