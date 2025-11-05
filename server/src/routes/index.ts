import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';

import authRoutes from './auth.routes';
import applicationRoutes from './application.routes'
import resumeRoutes from './resume.routes'


const router = Router();

// --- Public Routes ---
// Auth has its own public routes (register, login)
router.use('/auth', authRoutes);

// --- Private Routes ---
// All routes below this require a valid token
router.use(authMiddleware);
router.use('/application', applicationRoutes)
router.use('/resumes', resumeRoutes)


export default router;