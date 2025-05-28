// src/lib/validators/poemValidators.ts
import { z } from "zod";
import { Types } from "mongoose";

const ALLOWED_CATEGORIES = [
  "poem",
  "ghazal",
  "sher",
  "nazm",
  "rubai",
  "marsiya",
  "qataa",
  "other",
] as const;

const multilingualStringSchema = z.object({
  en: z.string().min(1, "English text is required").max(500, "English text cannot exceed 500 characters"),
  hi: z.string().min(1, "Hindi text is required").max(500, "Hindi text cannot exceed 500 characters"),
  ur: z.string().min(1, "Urdu text is required").max(500, "Urdu text cannot exceed 500 characters"),
});

const multilingualOptionalStringSchema = z.object({
  en: z.string().max(500, "English text cannot exceed 500 characters").optional(),
  hi: z.string().max(500, "Hindi text cannot exceed 500 characters").optional(),
  ur: z.string().max(500, "Urdu text cannot exceed 500 characters").optional(),
});

const contentSchema = z.object({
  couplet: z.string().min(1, "Couplet is required").max(1000, "Couplet cannot exceed 1000 characters"),
  meaning: z.string().max(1000, "Meaning cannot exceed 1000 characters").optional(),
});

const faqSchema = z.object({
  question: multilingualOptionalStringSchema,
  answer: multilingualOptionalStringSchema,
});

export const createPoemSchema = z.object({
  title: multilingualStringSchema,
  content: z.object({
    en: z.array(contentSchema).min(1, "At least one English couplet is required"),
    hi: z.array(contentSchema).min(1, "At least one Hindi couplet is required"),
    ur: z.array(contentSchema).min(1, "At least one Urdu couplet is required"),
  }),
  poet: z.string().refine((val) => Types.ObjectId.isValid(val), { message: "Invalid poet ID" }),
  coverImage: z
    .instanceof(File)
    .refine((file) => !file || file.size <= 5 * 1024 * 1024, { message: "Image must be less than 5MB" })
    .refine((file) => !file || ["image/jpeg", "image/png"].includes(file.type), {
      message: "Only JPEG or PNG images are allowed",
    })
    .optional()
    .nullable(),
  topics: z
    .array(z.string().min(1, "Topic cannot be empty").max(50, "Topic cannot exceed 50 characters"))
    .max(10, "Cannot have more than 10 topics")
    .optional(),
  category: z.enum(ALLOWED_CATEGORIES).default("poem"),
  status: z.enum(["draft", "published"]).default("published"),
  slug: multilingualStringSchema.refine(
    (data) => {
      const slugs = [data.en, data.hi, data.ur];
      const uniqueSlugs = new Set(slugs);
      return uniqueSlugs.size === slugs.length;
    },
    { message: "Slugs must be unique across languages" }
  ),
  summary: multilingualOptionalStringSchema.optional(),
  didYouKnow: multilingualOptionalStringSchema.optional(),
  faqs: z.array(faqSchema).optional(),
});

export const updatePoemSchema = z.object({
  title: multilingualStringSchema.optional(),
  content: z
    .object({
      en: z.array(contentSchema).min(1, "At least one English couplet is required").optional(),
      hi: z.array(contentSchema).min(1, "At least one Hindi couplet is required").optional(),
      ur: z.array(contentSchema).min(1, "At least one Urdu couplet is required").optional(),
    })
    .optional(),
  coverImage: z
    .instanceof(File)
    .refine((file) => !file || file.size <= 5 * 1024 * 1024, { message: "Image must be less than 5MB" })
    .refine((file) => !file || ["image/jpeg", "image/png"].includes(file.type), {
      message: "Only JPEG or PNG images are allowed",
    })
    .optional()
    .nullable(),
  topics: z
    .array(z.string().min(1, "Topic cannot be empty").max(50, "Topic cannot exceed 50 characters"))
    .max(10, "Cannot have more than 10 topics")
    .optional(),
  category: z.enum(ALLOWED_CATEGORIES).optional(),
  status: z.enum(["draft", "published"]).optional(),
  slug: multilingualStringSchema
    .refine(
      (data) => {
        const slugs = [data.en, data.hi, data.ur];
        const uniqueSlugs = new Set(slugs);
        return uniqueSlugs.size === slugs.length;
      },
      { message: "Slugs must be unique across languages" }
    )
    .optional(),
  summary: multilingualOptionalStringSchema.optional(),
  didYouKnow: multilingualOptionalStringSchema.optional(),
  faqs: z.array(faqSchema).optional(),
  addBookmark: z.string().refine((val) => Types.ObjectId.isValid(val), { message: "Invalid user ID" }).optional(),
  removeBookmark: z.string().refine((val) => Types.ObjectId.isValid(val), { message: "Invalid user ID" }).optional(),
});

export const bookmarkPoemSchema = z.object({
  poemId: z.string().refine((val) => Types.ObjectId.isValid(val), { message: "Invalid poem ID" }),
  userId: z.string().refine((val) => Types.ObjectId.isValid(val), { message: "Invalid user ID" }),
  action: z.enum(["add", "remove"]),
});

export type CreatePoemInput = z.infer<typeof createPoemSchema>;
export type UpdatePoemInput = z.infer<typeof updatePoemSchema>;
export type BookmarkPoemInput = z.infer<typeof bookmarkPoemSchema>;