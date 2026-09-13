import { z } from "zod";
import { roleSchema } from "./common";

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72), // argon2/bcrypt-friendly upper bound
});
export type SignupPayload = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginPayload = z.infer<typeof loginSchema>;

export const authUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: roleSchema,
  preferredLocale: z.string().min(2).max(10),
  displayName: z.string().min(1).max(80).optional(),
  avatarUrl: z.string().url().optional(),
  createdAt: z.string().datetime(),
});
export type AuthUser = z.infer<typeof authUserSchema>;

export const authResponseSchema = z.object({
  accessToken: z.string(),
  user: authUserSchema,
});
export type AuthResponse = z.infer<typeof authResponseSchema>;

// One endpoint for "edit profile" rather than one PATCH per field.
export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(80).optional(),
  preferredLocale: z.string().min(2).max(10).optional(),
  avatarKey: z.string().min(1).optional(),
});
export type UpdateProfilePayload = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(72),
});
export type ChangePasswordPayload = z.infer<typeof changePasswordSchema>;
