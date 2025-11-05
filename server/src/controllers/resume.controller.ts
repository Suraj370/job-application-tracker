import type { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { convertJsonToText } from '../utils/resumeParser';
import type { ResumeInput } from '../validations/resume.validation';

/**
 * @desc    Create a new resume from the JSON builder
 * @route   POST /api/resumes
 */
export const createResume = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id: userId } = req.user!;
  // We get the validated data from 'req.body'
  const { name, data } = req.body as ResumeInput;

  try {
    // 1. Convert the JSON "source of truth" to text
    const context = convertJsonToText(data);

    // 2. Save both in the database
    const resume = await prisma.resume.create({
      data: {
        name,
        data,       // The "source of truth" JSON
        context,    // The "AI-ready" text
        userId,
      },
    });
    res.status(201).json(resume);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all of a user's resumes (lightweight list)
 * @route   GET /api/resumes
 */
export const getAllResumes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id: userId } = req.user!;
  try {
    const resumes = await prisma.resume.findMany({
      where: { userId },
      // Performance: Only select summary data.
      // Do NOT send the giant 'data' or 'context' fields.
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.status(200).json(resumes);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get one resume's JSON (for the builder)
 * @route   GET /api/resumes/:resumeId
 */
export const getResumeById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id: userId } = req.user!;
  const { resumeId } = req.params;

  try {
    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId },
      // This endpoint *only* sends the data needed to
      // populate the frontend builder for editing.
      select: {
        id: true,
        name: true,
        data: true, // Send the JSON 'data'
      },
    });

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found.' });
    }
    
    // We will assume for this controller that if we're fetching
    // by ID, it's for the builder, so we only return if 'data' exists.
    if (resume.data === null) {
        return res.status(404).json({ 
          message: 'This resume was not created with the builder and cannot be edited.' 
        });
    }
    
    res.status(200).json(resume);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a resume from the JSON builder
 * @route   PUT /api/resumes/:resumeId
 */
export const updateResume = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id: userId } = req.user!;
  const { resumeId } = req.params;
  const { name, data } = req.body as ResumeInput;

  try {
    // 1. Re-convert the new JSON to text
    const context = convertJsonToText(data);

    // 2. Update both fields, ensuring user owns the record
    const { count } = await prisma.resume.updateMany({
      where: { id: resumeId, userId },
      data: {
        name,
        data,
        context,
      },
    });

    if (count === 0) {
      return res.status(404).json({ message: 'Resume not found or not authorized.' });
    }

    // Fetch and return the updated data (optional, but good practice)
    const updatedResume = await prisma.resume.findFirst({
      where: { id: resumeId },
      select: { id: true, name: true, data: true }
    });

    res.status(200).json(updatedResume);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a resume
 * @route   DELETE /api/resumes/:resumeId
 */
export const deleteResume = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id: userId } = req.user!;
  const { resumeId } = req.params;

  try {
    const { count } = await prisma.resume.deleteMany({
      where: { id: resumeId, userId },
    });
    if (count === 0) {
      return res.status(404).json({ message: 'Resume not found or not authorized.' });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};