import * as v from 'valibot';

// --- Sub-Schemas (for the 'data' object) ---

const WorkExperienceSchema = v.object({
  title: v.pipe(v.string(), v.minLength(1, "Job title is required.")),
  company: v.pipe(v.string(), v.minLength(1, "Company name is required.")),
  description: v.optional(v.string(), ""),
});

const EducationSchema = v.object({
  institution: v.pipe(v.string(), v.minLength(1, "Institution name is required.")),
  degree: v.pipe(v.string(), v.minLength(1, "Degree is required.")),
  fieldOfStudy: v.optional(v.string(), ""),
  graduationYear: v.optional(v.string(), ""), 
});

const ResumeDataSchema = v.object({
  name: v.optional(v.string(), ""),
  email: v.optional(v.pipe(v.string(), v.email("Invalid email address."))),
  phone: v.optional(v.string(), ""),
  summary: v.optional(v.string(), ""),
  workExperience: v.optional(v.array(WorkExperienceSchema), []),
  
  education: v.optional(v.array(EducationSchema), []),
  
  skills: v.optional(v.array(v.string()), []),
});


export const ResumeSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1, "Resume name is required.")),
  data: ResumeDataSchema,
});

export type ResumeInput = v.InferOutput<typeof ResumeSchema>;