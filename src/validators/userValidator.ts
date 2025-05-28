// src/lib/validators/userValidators.ts
import { z } from "zod";


export const profilePictureSchema = z.object({
  publicId: z.string().optional(),
  url: z.string().url().optional(),
}).optional();

export const signupSchema = z.object({
  googleId: z.string().min(1, "Google ID is required"),
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required").max(100, "Name cannot exceed 100 characters"),
  slug: z.string().min(1, "Slug is required").max(100).regex(/^[a-z0-9-]+$/),
  profilePicture: profilePictureSchema,
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  bio: z.string().max(500).optional(),
  dob: z.string().refine((val) => !val || !isNaN(Date.parse(val)), { message: "Invalid date of birth" })
    .refine((val) => !val || new Date(val) <= new Date(), { message: "Date of birth cannot be in the future" })
    .transform((val) => (val ? new Date(val) : undefined)).optional(),
  location: z.string().max(100).optional(),
  image: z.instanceof(File).refine((file) => file.size <= 5 * 1024 * 1024, { message: "Image must be less than 5MB" })
    .refine((file) => ["image/jpeg", "image/png"].includes(file.type), { message: "Only JPEG or PNG images are allowed" })
    .optional().nullable(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;