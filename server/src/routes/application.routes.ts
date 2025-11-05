import { Router } from 'express';
import {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
} from '../controllers/application.controller';
import { validate } from '../middleware/validation.middleware';
import { JobCreateSchema, JobUpdateSchema } from '../validations/application.validation';

const router = Router();

// Routes for /api/jobs
router
  .route('/')
  .post(validate(JobCreateSchema), createJob) // Validate on create
  .get(getAllJobs);

// Routes for /api/jobs/:jobId
router
  .route('/:jobId')
  .get(getJobById)
  .put(validate(JobUpdateSchema), updateJob) // Validate on update
  .delete(deleteJob);

export default router;