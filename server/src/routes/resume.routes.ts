import { Router } from 'express';
import {
  createResume,
  getAllResumes,
  getResumeById,
  updateResume,
  deleteResume,
} from '../controllers/resume.controller';
import { validate } from '../middleware/validation.middleware';
import { ResumeSchema } from '../validations/resume.validation';

const router = Router();

// Routes for /api/resumes
router
  .route('/')
  // Create a new resume (from the builder)
  .post(validate(ResumeSchema), createResume)
  // Get a lightweight list of all resumes
  .get(getAllResumes);

// Routes for a specific resume
router
  .route('/:resumeId')
  // Get the full JSON for the builder to edit
  .get(getResumeById)
  // Update the resume (from the builder)
  .put(validate(ResumeSchema), updateResume)
  // Delete the resume
  .delete(deleteResume);

export default router;