import { describe, test, expect, beforeAll, afterEach, afterAll } from 'bun:test';
import request from 'supertest';
import { app } from '../app';
import prisma from '../lib/prisma'; // Make sure this path is correct

describe('Application Routes E2E', () => {
  let token: string;
  let userId: string;

  // --- Test Setup ---
  afterEach(async () => {
    await prisma.jobApplication.deleteMany();
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
  });

  beforeAll(async () => {
    // Register
    const userRes = await request(app).post('/api/auth/register').send({
      email: 'jobuser@test.com',
      password: 'password123',
    });
    userId = userRes.body.id;

    // Login
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'jobuser@test.com',
      password: 'password123',
    });
    token = loginRes.body.token;
  });

  // --- Tests ---
  test('POST /api/application - should create a new job', async () => {
    const jobData = {
      title: 'Software Engineer',
      company: 'Google',
      jobDescription: 'Build amazing things.',
      status: 'APPLIED',
    };

    const res = await request(app)
      .post('/api/application')
       .set('Authorization', `Bearer ${token}`)
      .send(jobData);

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Software Engineer');
    expect(res.body.userId).toBe(userId);
  });

  // --- FIX ---
  test('POST /api/application - should fail validation for missing title', async () => {
    const res = await request(app)
      .post('/api/application')
       .set('Authorization', `Bearer ${token}`)
      .send({ company: 'Google', jobDescription: '...' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation failed.');
  });

  test('GET /api/application - should get all jobs for the user', async () => {
    // Create a job first
    await prisma.jobApplication.create({
      data: {
        title: 'Job 1',
        company: 'Company 1',
        jobDescription: '...',
        userId: userId,
      },
    });

    const res = await request(app)
      .get('/api/application')
       .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toBeArray();
    expect(res.body.length).toBe(1);
    expect(res.body[0].title).toBe('Job 1');
  });

  // --- FIX ---
  test('GET /api/application/:jobId - should fail to get a job owned by another user', async () => {
    // 1. Create a "bad" user
    const badUser = await prisma.user.create({
      data: { email: 'bad@user.com', password: '...' },
    });
    // 2. Create a job owned by the "bad" user
    const badJob = await prisma.jobApplication.create({
      data: {
        title: 'Bad Job',
        company: 'Bad Co',
        jobDescription: '...',
        userId: badUser.id,
      },
    });

    // 3. Try to fetch the "bad" job as our *main* user
    const res = await request(app)
      .get(`/api/application/${badJob.id}`)
       .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Job not found.');
  });
});