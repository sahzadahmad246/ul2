// src/lib/validators.ts
import { z } from "zod";
import { Types } from "mongoose";

const ALLOWED_INTERESTS = ["love", "nature", "history", "philosophy", "spirituality", "life"] as const;

const profilePictureSchema = z
  .object({
    publicId: z.string().optional(),
    url: z.string().url().optional(),
  })
  .optional();

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
      .refine((val) => !val || new Date(val) <= new Date(), { message: "Date of birth cannot be in the future" })
      .transform((val) => (val ? new Date(val) : undefined))
      .optional(),
    dateOfDeath: z
      .string()
      .refine((val) => !val || !isNaN(Date.parse(val)), { message: "Invalid date of death" })
      .transform((val) => (val ? new Date(val) : undefined))
      .optional(),
    location: z.string().max(100, "Location cannot exceed 100 characters").optional(),
    interests: z.array(z.enum(ALLOWED_INTERESTS)).max(10, "Cannot have more than 10 interests").optional(),
    image: z
      .instanceof(File)
      .refine((file) => file.size <= 5 * 1024 * 1024, { message: "Image must be less than 5MB" })
      .refine((file) => ["image/jpeg", "image/png"].includes(file.type), { message: "Only JPEG or PNG images are allowed" })
      .optional()
      .nullable(),
    addBookmark: z.string().refine((val) => Types.ObjectId.isValid(val), { message: "Invalid poem ID" }).optional(),
    removeBookmark: z.string().refine((val) => Types.ObjectId.isValid(val), { message: "Invalid poem ID" }).optional(),
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

export const bookmarkSchema = z.object({
  poemId: z.string().refine((val) => Types.ObjectId.isValid(val), { message: "Invalid poem ID" }),
});

export const collectionSchema = z.object({
  name: z.string().min(1, "Collection name is required").max(100, "Collection name cannot exceed 100 characters"),
  description: z.string().max(500, "Collection description cannot exceed 500 characters").optional(),
  poems: z
    .array(z.string().refine((val) => Types.ObjectId.isValid(val), { message: "Invalid poem ID" }))
    .optional(),
});

export const addPoemToCollectionSchema = z.object({
  collectionId: z.string().refine((val) => Types.ObjectId.isValid(val), { message: "Invalid collection ID" }),
  poemId: z.string().refine((val) => Types.ObjectId.isValid(val), { message: "Invalid poem ID" }),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type BookmarkInput = z.infer<typeof bookmarkSchema>;
export type CollectionInput = z.infer<typeof collectionSchema>;
export type AddPoemToCollectionInput = z.infer<typeof addPoemToCollectionSchema>;