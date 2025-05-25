import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import dbConnect from "@/lib/mongodb";
import Poem from "@/models/Poem";
import User from "@/models/User";
import { authOptions } from "@/lib/auth";
import { createPoemSchema } from "@/validators/poemValidator";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import { slugify } from "@/lib/slugify";

// Define the structure for the body object
interface PoemFormData {
  title?: { en: string; hi: string; ur: string };
  summary?: { en: string; hi: string; ur: string };
  didYouKnow?: { en: string; hi: string; ur: string };
  content?: { en: string; hi: string; ur: string };
  topics?: string[];
  faqs?: Array<{
    question: { en: string; hi: string; ur: string };
    answer: { en: string; hi: string; ur: string };
  }>;
  poet?: string;
  coverImage?: File | null;
  slug?: { en: string; hi: string; ur: string }; // Explicitly define slug
  [key: string]: unknown; // Allow other fields
}

// Define the FAQ structure
interface FAQ {
  question: { en: string; hi: string; ur: string };
  answer: { en: string; hi: string; ur: string };
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// GET: Retrieve all poems with pagination
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const poems = await Poem.find({ status: "published" })
      .skip(skip)
      .limit(limit)
      .populate("poet", "name")
      .lean();

    const total = await Poem.countDocuments({ status: "published" });

    return NextResponse.json({
      poems,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[GET_POEMS_ERROR]", error);
    return NextResponse.json(
      { message: "Server error", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// POST: Create a new poem
export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log("[POST_POEM] Unauthorized: No session or user ID");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Verify current user’s role
    const currentUser = await User.findById(session.user.id);
    if (!currentUser || (currentUser.role !== "poet" && currentUser.role !== "admin")) {
      console.log("[POST_POEM] Forbidden: User lacks permission", { userId: session.user.id, role: currentUser?.role });
      return NextResponse.json(
        { message: "You do not have permission to create poems" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    console.log("[POST_POEM] FormData entries:", [...formData.entries()]);

    const body: PoemFormData = {};
    formData.forEach((value, key) => {
      if (key === "content" || key === "topics") {
        try {
          body[key] = typeof value === "string" ? JSON.parse(value) : value;
          console.log(`[POST_POEM] Parsed ${key}:`, body[key]);
        } catch (error) {
          console.error(`[POST_POEM] Failed to parse ${key}:`, error);
        }
      } else {
        body[key] = value;
      }
    });

    // Explicitly construct title, summary, didYouKnow, and faqs
    body.title = {
      en: formData.get("title[en]") as string,
      hi: formData.get("title[hi]") as string,
      ur: formData.get("title[ur]") as string,
    };
    body.summary = {
      en: formData.get("summary[en]") as string || "",
      hi: formData.get("summary[hi]") as string || "",
      ur: formData.get("summary[ur]") as string || "",
    };
    body.didYouKnow = {
      en: formData.get("didYouKnow[en]") as string || "",
      hi: formData.get("didYouKnow[hi]") as string || "",
      ur: formData.get("didYouKnow[ur]") as string || "",
    };
    body.faqs = [];
    const faqsRaw = formData.get("faqs") as string;
    if (faqsRaw) {
      try {
        const faqsArray: FAQ[] = JSON.parse(faqsRaw);
        body.faqs = faqsArray.map((faq: FAQ) => ({
          question: {
            en: faq.question?.en || "",
            hi: faq.question?.hi || "",
            ur: faq.question?.ur || "",
          },
          answer: {
            en: faq.answer?.en || "",
            hi: faq.answer?.hi || "",
            ur: faq.answer?.ur || "",
          },
        }));
      } catch (error) {
        console.error("[POST_POEM] Failed to parse faqs:", error);
      }
    }

    // Determine poet based on user role
    let poetId: string;
    if (currentUser.role === "admin") {
      poetId = formData.get("poet") as string;
      if (!poetId) {
        console.log("[POST_POEM] Error: Poet ID is required for admin");
        return NextResponse.json(
          { message: "Poet ID is required" },
          { status: 400 }
        );
      }
      const poet = await User.findById(poetId);
      if (!poet) {
        console.log("[POST_POEM] Error: Poet not found", { poetId });
        return NextResponse.json(
          { message: "Selected poet not found" },
          { status: 400 }
        );
      }
      if (poet.role !== "poet") {
        console.log("[POST_POEM] Error: Selected user is not a poet", { poetId, role: poet.role });
        return NextResponse.json(
          { message: "Selected user must have poet role" },
          { status: 400 }
        );
      }
      console.log("[POST_POEM] Admin selected poet:", { poetId, name: poet.name });
    } else {
      poetId = session.user.id; // Poet role uses current user
      console.log("[POST_POEM] Using current poet:", { poetId, name: currentUser.name });
    }

    // Generate slugs based on English title
    const englishTitle = body.title?.en;
    if (!englishTitle) {
      console.log("[POST_POEM] Error: English title is missing");
      return NextResponse.json(
        { message: "English title is required for slug generation" },
        { status: 400 }
      );
    }
    body.slug = {
      en: slugify(englishTitle, "en"),
      hi: slugify(englishTitle, "hi"),
      ur: slugify(englishTitle, "ur"),
    };

    // Check slug uniqueness
    if (!body.slug) {
      console.log("[POST_POEM] Error: Slug is undefined");
      return NextResponse.json(
        { message: "Slug generation failed" },
        { status: 400 }
      );
    }
    const existingSlugs = await Poem.find({
      $or: [
        { "slug.en": body.slug.en },
        { "slug.hi": body.slug.hi },
        { "slug.ur": body.slug.ur },
      ],
    }).select("slug");
    if (existingSlugs.length > 0) {
      console.log("[POST_POEM] Slug conflict detected:", existingSlugs);
      return NextResponse.json(
        { message: "Slug already exists", errors: [{ message: `Slug conflict: ${JSON.stringify(body.slug)}` }] },
        { status: 400 }
      );
    }

    // Validate input
    console.log("[POST_POEM] Validating data:", { ...body, poet: poetId });
    const validatedData = createPoemSchema.parse({
      ...body,
      poet: poetId,
      coverImage: formData.get("coverImage") as File | null,
    });

    // Handle Cloudinary image upload
    let coverImageUrl = "";
    if (validatedData.coverImage) {
      console.log("[POST_POEM] Uploading cover image to Cloudinary");
      try {
        const buffer = Buffer.from(await validatedData.coverImage.arrayBuffer());
        const stream = Readable.from(buffer);
        const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "unmatchedlines/poems", resource_type: "image" },
            (error, result) => {
              if (error || !result) {
                console.error("[POST_POEM] Cloudinary upload failed:", error);
                reject(error || new Error("Upload failed"));
              } else {
                console.log("[POST_POEM] Cloudinary upload successful:", result.secure_url);
                resolve({ secure_url: result.secure_url });
              }
            }
          );
          stream.pipe(uploadStream);
        });
        coverImageUrl = uploadResult.secure_url;
      } catch (error) {
        console.error("[POST_POEM] Image upload error:", error);
        return NextResponse.json(
          { message: "Image upload error", error: error instanceof Error ? error.message : "Unknown error" },
          { status: 500 }
        );
      }
    }

    // Create poem
    console.log("[POST_POEM] Creating poem with data:", { ...validatedData, coverImage: coverImageUrl });
    const poem = await Poem.create({
      ...validatedData,
      poet: validatedData.poet,
      coverImage: coverImageUrl,
    });

    // Update selected poet's poems array and poemCount
    console.log("[POST_POEM] Updating poet poem count for user:", poetId);
    await User.findByIdAndUpdate(
      poetId,
      {
        $push: { poems: { poemId: poem._id } },
        $inc: { poemCount: 1 },
      },
      { new: true }
    );

    return NextResponse.json({ message: "Poem created successfully", poem }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("[POST_POEM] Validation error:", error.errors);
      return NextResponse.json({ message: "Validation error", errors: error.errors }, { status: 400 });
    }
    console.error("[POST_POEM] Server error:", error);
    return NextResponse.json(
      { message: "Server error", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}