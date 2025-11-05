import type { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import type { JobCreateInput, JobUpdateInput } from '../validations/application.validation';

/**
 * @desc    Create a new job application
 * @route   POST /api/jobs
 */
export const createJob = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id: userId } = req.user!; // Get user ID from authMiddleware
  const input = req.body as JobCreateInput;

  try {
    const job = await prisma.jobApplication.create({
      data: {
        ...input,
        userId: userId, // Link this job to the logged-in user
      },
    });
    res.status(201).json(job);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all jobs for the logged-in user
 * @route   GET /api/jobs
 */
export const getAllJobs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id: userId } = req.user!;

  try {
    const jobs = await prisma.jobApplication.findMany({
      where: { userId: userId }, // SECURITY: Only find jobs for this user
      orderBy: { applicationDate: 'desc' },
    });
    res.status(200).json(jobs);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single job by ID
 * @route   GET /api/jobs/:jobId
 */
export const getJobById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id: userId } = req.user!;
  const { jobId } = req.params;

  try {
    // SECURITY: We use findFirst with a compound 'where' to ensure
    // the user owns this job. This prevents an IDOR attack.
    const job = await prisma.jobApplication.findFirst({
      where: {
        id: jobId,
        userId: userId,
      },
    });

    if (!job) {
      return res.status(404).json({ message: 'Job not found.' });
    }
    res.status(200).json(job);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a job
 * @route   PUT /api/jobs/:jobId
 */
export const updateJob = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id: userId } = req.user!;
  const { jobId } = req.params;
  const input = req.body as JobUpdateInput;

  try {
    // SECURITY: Use updateMany with a compound 'where' to ensure
    // the user can only update their own job.
    const { count } = await prisma.jobApplication.updateMany({
      where: {
        id: jobId,
        userId: userId,
      },
      data: input,
    });

    if (count === 0) {
      return res.status(404).json({ message: 'Job not found or not authorized.' });
    }

    // Fetch the updated job to return it to the user
    const updatedJob = await prisma.jobApplication.findUnique({
      where: { id: jobId },
    });
    res.status(200).json(updatedJob);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a job
 * @route   DELETE /api/jobs/:jobId
 */
export const deleteJob = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id: userId } = req.user!;
  const { jobId } = req.params;

  try {
    // SECURITY: Use deleteMany with a compound 'where'.
    const { count } = await prisma.jobApplication.deleteMany({
      where: {
        id: jobId,
        userId: userId,
      },
    });

    if (count === 0) {
      return res.status(404).json({ message: 'Job not found or not authorized.' });
    }

    res.status(204).send(); // 204 No Content is standard for delete
  } catch (error) {
    next(error);
  }
};