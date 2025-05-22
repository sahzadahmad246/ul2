// src/app/validators/userValidator.ts
import { z } from "zod";

// Allowed interests (expand as needed)
const ALLOWED_INTERESTS = ["love", "nature", "history", "philosophy"] as const;

// Schema for profile picture
const profilePictureSchema = z
  .object({
    publicId: z.string().optional(),
    url: z.string().url().optional(),
  })
  .optional();

// Schema for Google OAuth signup
export const signupSchema = z.object({
  googleId: z.string().min(1, "Google ID is required"),
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required").max(100, "Name cannot exceed 100 characters"),
  profilePicture: profilePictureSchema,
});



export const updateProfileSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100, "Name cannot exceed 100 characters").optional(),
    bio: z.string().max(500, "Bio cannot exceed 500 characters").optional(),
    dob: z
      .string()
      .refine((val) => !val || !isNaN(Date.parse(val)), { message: "Invalid date of birth" })
      .transform((val) => (val ? new Date(val) : undefined))
      .optional(),
    dateOfDeath: z
      .string()
      .refine((val) => !val || !isNaN(Date.parse(val)), { message: "Invalid date of death" })
      .transform((val) => (val ? new Date(val) : undefined))
      .optional(),
    location: z.string().max(100, "Location cannot exceed 100 characters").optional(),
    interests: z.array(z.enum(ALLOWED_INTERESTS)).max(10, "Cannot have more than 10 interests").optional(),
  })
  .refine(
    (data) => {
      if (data.dob && data.dateOfDeath) {
        return data.dateOfDeath > data.dob;
      }
      return true;
    },
    { message: "Date of death must be after date of birth", path: ["dateOfDeath"] }
  );


// Types for TypeScript
export type SignupInput = z.infer<typeof signupSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;