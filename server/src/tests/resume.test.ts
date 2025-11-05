import { describe, test, expect, beforeAll, afterAll, afterEach } from 'bun:test';
import request from 'supertest';
import { app } from '../app';
// --- FIX: Using your correct prisma path ---
import prisma from '../lib/prisma'; 

describe('Resume Builder Routes E2E (JSON Workflow)', () => {
  let token: string;
  let userId: string;
  
  // --- Use unique emails for this test file to prevent collisions ---
  const userEmail = 'resumeuser@test.com';
  const badUserEmail = 'badresume@user.com';

  // --- Mock Data ---
  const resumeData = {
    name: "My Tech Resume V1",
    data: {
      name: "Test User",
      email: "test@user.com",
      summary: "A skilled engineer.",
      workExperience: [
        { title: "Engineer", company: "Acmé Inc.", description: "Did stuff." }
      ],
      education: [
        { 
          institution: "Test University", 
          degree: "B.S. CompSci",
          fieldOfStudy: "Computer Science" // Added to match parser
        }
      ],
      skills: ["TypeScript", "Prisma", "Bun"]
    }
  };

  const updatedResumeData = {
    name: "My Updated Resume V2",
    data: {
      ...resumeData.data,
      name: "Test User (Updated)",
      skills: ["TypeScript", "Prisma", "Bun", "Docker"]
    }
  };

  // --- Test Setup ---
  beforeAll(async () => {
    // --- FIX: Isolated cleanup ---
    // Clean up *only* the users this file will create
    await prisma.user.deleteMany({
      where: { email: { in: [userEmail, badUserEmail] } },
    });
    
    // Register
    const userRes = await request(app).post('/api/auth/register').send({
      email: userEmail,
      password: 'password123',
    });
    userId = userRes.body.id;

    // Login
    const loginRes = await request(app).post('/api/auth/login').send({
      email: userEmail,
      password: 'password123',
    });
    // Assuming token is just the string, as in your application.test.ts
    token = loginRes.body.token; 
  });

  // Clean up all resumes after *each* test to keep tests isolated
  afterEach(async () => {
    await prisma.resume.deleteMany();
  });

  // --- FIX: Isolated cleanup ---
  // Clean up *only* the users this file created
  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: [userEmail, badUserEmail] } },
    });
  });

  // --- The Tests ---

  describe('POST /api/resumes', () => {
    test('should create a new resume from the JSON builder', async () => {
      const res = await request(app)
        .post('/api/resumes')
        .set('Authorization', `Bearer ${token}`)
        .send(resumeData);

      expect(res.status).toBe(201);

      expect(res.body.name).toBe("My Tech Resume V1");
      expect(res.body.data.skills).toEqual(["TypeScript", "Prisma", "Bun"]);

      expect(res.body.context).toBeString();
      expect(res.body.context).toContain("--- WORK EXPERIENCE ---");
      expect(res.body.context).toContain("A skilled engineer.");
      expect(res.body.context).toContain(
        "B.S. CompSci in Computer Science from Test University"
      );
    });

    test('should fail validation if resume name is missing', async () => {
      const { name, ...invalidData } = resumeData; // Send without 'name'
      
      const res = await request(app)
        .post('/api/resumes')
        .set('Authorization', `Bearer ${token}`)
        .send(invalidData);
      
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Validation failed.");
    });

    test('should fail without an auth token', async () => {
      const res = await request(app)
        .post('/api/resumes')
        .send(resumeData);
      
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/resumes', () => {
    test('should get a lightweight summary list of all resumes', async () => {
      await request(app)
        .post('/api/resumes')
        .set('Authorization', `Bearer ${token}`)
        .send(resumeData);

      const res = await request(app)
        .get('/api/resumes')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toBeArray();
      expect(res.body.length).toBe(1);
      expect(res.body[0].name).toBe("My Tech Resume V1");
      
      expect(res.body[0].data).toBeUndefined();
      expect(res.body[0].context).toBeUndefined();
    });
  });

  describe('GET /api/resumes/:resumeId', () => {
    test('should get a single resume by ID with its full JSON data', async () => {
      const createRes = await request(app)
        .post('/api/resumes')
        .set('Authorization', `Bearer ${token}`)
        .send(resumeData);
      const resumeId = createRes.body.id;

      const res = await request(app)
        .get(`/api/resumes/${resumeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("My Tech Resume V1");
      expect(res.body.data.email).toBe("test@user.com");
    });

    test('should return 404 when getting a resume owned by another user', async () => {
      const badUser = await prisma.user.create({
        data: { email: badUserEmail, password: '...' },
      });
      const badResume = await prisma.resume.create({
        data: {
          name: "Bad Resume",
          data: {},
          context: "...",
          userId: badUser.id,
        },
      });

      const res = await request(app)
        .get(`/api/resumes/${badResume.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Resume not found.");
    });
  });
  
  describe('PUT /api/resumes/:resumeId', () => {
    test('should update a resume and its context', async () => {
      const createRes = await request(app)
        .post('/api/resumes')
        .set('Authorization', `Bearer ${token}`)
        .send(resumeData);
      const resumeId = createRes.body.id;
      
      const res = await request(app)
        .put(`/api/resumes/${resumeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updatedResumeData); 

      expect(res.status).toBe(200);
      expect(res.body.data.skills).toEqual(["TypeScript", "Prisma", "Bun", "Docker"]);

      const dbCheck = await prisma.resume.findUnique({
        where: { id: resumeId },
      });
      expect(dbCheck?.context).toContain("Docker");
    });
  });

  describe('DELETE /api/resumes/:resumeId', () => {
    test('should delete a resume', async () => {
      const createRes = await request(app)
        .post('/api/resumes')
        .set('Authorization', `Bearer ${token}`)
        .send(resumeData);
      const resumeId = createRes.body.id;

      const deleteRes = await request(app)
        .delete(`/api/resumes/${resumeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(deleteRes.status).toBe(204);

      // 3. Verify it's gone
      const getRes = await request(app)
        .get(`/api/resumes/${resumeId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(getRes.status).toBe(404);
    });
  });
});