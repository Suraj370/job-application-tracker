import * as v from "valibot";


// 🔢 Job Status Enum (must match Prisma schema)
export enum JobStatus {
  WISHLIST = "WISHLIST",
  APPLIED = "APPLIED",
  INTERVIEW = "INTERVIEW",
  OFFER = "OFFER",
  REJECTED = "REJECTED",
}

// ✅ Valibot enum schema
export const JobStatusSchema = v.enum(JobStatus);

// ✅ Create Job Schema
export const JobCreateSchema = v.object({
  title: v.pipe(
    v.string("Title is required."),
    v.minLength(1, "Title is required.")
  ),
  company: v.pipe(
    v.string("Company is required."),
    v.minLength(1, "Company is required.")
  ),
  jobDescription: v.pipe(
    v.string("Job description is required."),
    v.minLength(1, "Job description is required.")
  ),
  status: v.optional(JobStatusSchema),
  jobUrl: v.optional(
    v.pipe(v.string("Must be a valid URL."), v.url("Must be a valid URL."))
  ),
  notes: v.optional(v.string()),
});

// ✅ Update Job Schema (all fields optional)
export const JobUpdateSchema = v.object({
  title: v.optional(
    v.pipe(v.string("Invalid title."), v.minLength(1, "Title is required."))
  ),
  company: v.optional(
    v.pipe(v.string("Invalid company."), v.minLength(1, "Company is required."))
  ),
  jobDescription: v.optional(
    v.pipe(
      v.string("Invalid job description."),
      v.minLength(1, "Job description is required.")
    )
  ),
  status: v.optional(JobStatusSchema),
  jobUrl: v.optional(
    v.pipe(v.string("Must be a valid URL."), v.url("Must be a valid URL."))
  ),
  notes: v.optional(v.string()),
});

// 🔍 Type inference
export type JobCreateInput = v.InferOutput<typeof JobCreateSchema>;
export type JobUpdateInput = v.InferOutput<typeof JobUpdateSchema>;
