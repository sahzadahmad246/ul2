import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { authOptions } from "@/lib/auth";
import { IUser } from "@/types/userTypes";
import { z } from "zod";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_INTERESTS = ["love", "nature", "history", "philosophy"] as const;

// Validation schema for profile updates including image
const profileUpdateSchema = z
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
    image: z
      .instanceof(File)
      .refine((file) => file.size <= 5 * 1024 * 1024, { message: "Image must be less than 5MB" })
      .refine((file) => ["image/jpeg", "image/png"].includes(file.type), { message: "Only JPEG or PNG images are allowed" })
      .optional(),
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

interface FormDataObject {
  [key: string]: string | string[] | File | null;
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const body: FormDataObject = {};
    formData.forEach((value, key) => {
      if (key === "interests") {
        body[key] = typeof value === "string" ? JSON.parse(value) : value;
      } else if (key !== "image") {
        body[key] = value;
      }
    });
    const image = formData.get("image") as File | null;

    const validatedData = profileUpdateSchema.parse({ ...body, image });

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const updates: Partial<IUser> = {};
    if (validatedData.name) updates.name = validatedData.name;
    if (validatedData.bio) updates.bio = validatedData.bio;
    if (validatedData.dob) updates.dob = validatedData.dob;
    if (validatedData.dateOfDeath) updates.dateOfDeath = validatedData.dateOfDeath;
    if (validatedData.location) updates.location = validatedData.location;
    if (validatedData.interests) updates.interests = validatedData.interests;

    // Handle image upload
    if (validatedData.image) {
      // Delete old image from Cloudinary if it exists
      if (user.profilePicture?.publicId) {
        await cloudinary.uploader.destroy(user.profilePicture.publicId);
      }

      // Upload new image to Cloudinary
      const buffer = Buffer.from(await validatedData.image.arrayBuffer());
      const stream = Readable.from(buffer);
      const uploadResult = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "unmatchedlines/profiles", resource_type: "image" },
          (error, result) => {
            if (error || !result) reject(error || new Error("Upload failed"));
            else resolve({ secure_url: result.secure_url, public_id: result.public_id });
          }
        );
        stream.pipe(uploadStream);
      });

      updates.profilePicture = {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      };
    }

    await User.updateOne({ _id: session.user.id }, { $set: updates });

    const updatedUser = await User.findById(session.user.id);
    return NextResponse.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Validation error", errors: error.errors }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message: "Server error", error: message }, { status: 500 });
  }
}