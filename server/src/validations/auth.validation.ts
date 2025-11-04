import * as v from "valibot";

// ✅ Register schema
export const RegisterSchema = v.object({
  name: v.optional(v.string()), // optional field
  email: v.pipe(
    v.string("Email is required."),
    v.email("Invalid email format.")
  ),
  password: v.pipe(
    v.string("Password is required."),
    v.minLength(8, "Password must be at least 8 characters long.")
  ),
});

// ✅ Login schema
export const LoginSchema = v.object({
  email: v.pipe(
    v.string("Email is required."),
    v.email("Invalid email format.")
  ),
  password: v.pipe(
    v.string("Password is required."),
    v.minLength(1, "Password cannot be empty.")
  ),
});

// 🔍 Type inference
export type RegisterInput = v.InferOutput<typeof RegisterSchema>;
export type LoginInput = v.InferOutput<typeof LoginSchema>;
