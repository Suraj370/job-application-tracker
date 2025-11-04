import { test, expect, describe, beforeAll, afterAll, afterEach, beforeEach } from 'bun:test';
import request from 'supertest';
import { app } from '../app'; // Make sure you export 'app' from src/app.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs'; // <-- 1. IMPORT BCRYPTJS

// Get the app instance for supertest
const supertestApp = request(app);
const prisma = new PrismaClient();

// --- Test Suite Setup ---
beforeAll(async () => {
  // Connect to the test database
  await prisma.$connect();
});

afterAll(async () => {
  // Disconnect from the test database
  await prisma.$disconnect();
});

afterEach(async () => {
  // --- THIS IS THE MOST IMPORTANT PART ---
  // Clean up the database after each test to ensure isolation.
  await prisma.user.deleteMany({});
});

// --- Test Suites ---
describe('Authentication Routes', () => {

  // --- Registration ---
  describe('POST /api/auth/register', () => {
    test('should register a new user successfully', async () => {
      const response = await supertestApp
        .post('/api/auth/register') // <-- FIX: Added /api prefix
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User'
        });

      expect(response.status).toBe(201); // 201 Created
      // --- CHANGE: Removed token check as per your request ---
      
      // Verify the user was actually created in the DB
      const user = await prisma.user.findUnique({ where: { email: 'test@example.com' } });
      expect(user).not.toBeNull();
      expect(user?.name).toBe('Test User');
    });

    test('should fail to register with a duplicate email', async () => {
      // Create a user first
      await supertestApp
        .post('/api/auth/register') // <-- FIX: Added /api prefix
        .send({ email: 'duplicate@example.com', password: 'password123', name: 'User 1' });

      // Try to register with the same email
      const response = await supertestApp
        .post('/api/auth/register') // <-- FIX: Added /api prefix
        .send({ email: 'duplicate@example.com', password: 'password456', name: 'User 2' });

      expect(response.status).toBe(400); // Or 409 Conflict
    });
  });

  // --- Login ---
  describe('POST /api/auth/login', () => {
    
    beforeEach(async () => {
      // We must create a user to log in with
      
      // --- 2. USE BCRYPTJS TO HASH ---
      const hashedPassword = await bcrypt.hash('password123', 10); // Use bcrypt, 10 salt rounds

      await prisma.user.create({
        data: {
          email: 'login@example.com',
          password: hashedPassword,
          name: 'Login User'
        }
      });
    });

    test('should log in a user successfully', async () => {
      const response = await supertestApp
        .post('/api/auth/login') // <-- FIX: Added /api prefix
        .send({
          email: 'login@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });

    test('should fail to log in with the wrong password', async () => {
      const response = await supertestApp
        .post('/api/auth/login') // <-- FIX: Added /api prefix
        .send({
          email: 'login@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401); // Unauthorized
    });
  });

  // --- Protected Route Example ---
  describe('GET /api/auth/me', () => {
    test('should fail without an authentication token', async () => {
      const response = await supertestApp.get('/api/auth/me'); // <-- FIX: Added /api prefix
      expect(response.status).toBe(401);
    });

    test('should return the user profile with a valid token', async () => {
      // --- CHANGE: This test now requires registration AND login ---
      
      // 1. Register the user
      await supertestApp
        .post('/api/auth/register') // <-- FIX: Added /api prefix
        .send({
          email: 'me@example.com',
          password: 'password123',
          name: 'Me User'
        });
      
      // 2. Log in to get the token
      const loginResponse = await supertestApp
        .post('/api/auth/login')
        .send({
          email: 'me@example.com',
          password: 'password123'
        });

      const token = loginResponse.body.token; // Get token from login response

      // 3. Use the token to access the protected route
      const response = await supertestApp
        .get('/api/auth/me') // <-- FIX: Added /api prefix
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('email', 'me@example.com');
      expect(response.body).toHaveProperty('name', 'Me User');
    });
  });

});

