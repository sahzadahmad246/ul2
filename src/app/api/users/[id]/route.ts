// src/app/api/users/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import mongoose from "mongoose";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();

    const { id } = await params; // Await params to access id
    console.log("[GET_USER] Received id:", id);

    let user;

    if (mongoose.Types.ObjectId.isValid(id)) {
      user = await User.findById(id).select("name role slug").lean();
    } else {
      user = await User.findOne({ slug: id }).select("name role slug").lean();
    }

    if (!user) {
      console.log("[GET_USER] User not found for id:", id);
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    console.log("[GET_USER] Found user:", user.name);
    return NextResponse.json(user);
  } catch (error) {
    console.error("[GET_USER] Server error:", error);
    return NextResponse.json(
      { message: "Server error", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check admin authorization
    const session = await getServerSession();
    if (!session || !session.user || session.user.role !== "admin") {
      console.log("[PUT_USER] Unauthorized access attempt");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { id } = await params; // Await params to access id
    console.log("[PUT_USER] Received id:", id);

    let user;

    // Find user by ObjectId or slug
    if (mongoose.Types.ObjectId.isValid(id)) {
      user = await User.findById(id);
    } else {
      user = await User.findOne({ slug: id });
    }

    if (!user) {
      console.log("[PUT_USER] User not found for id:", id);
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Parse request body
    const data = await req.json();
    console.log("[PUT_USER] Update data:", data);

    // Validate input
    if (data.name && typeof data.name !== "string") {
      return NextResponse.json({ message: "Invalid name" }, { status: 400 });
    }
    if (data.slug && typeof data.slug !== "string") {
      return NextResponse.json({ message: "Invalid slug" }, { status: 400 });
    }
    if (data.role && !["user", "poet", "admin"].includes(data.role)) {
      return NextResponse.json({ message: "Invalid role" }, { status: 400 });
    }
    if (data.profilePicture && (typeof data.profilePicture !== "object" || !data.profilePicture.url)) {
      return NextResponse.json({ message: "Invalid profile picture" }, { status: 400 });
    }
    if (data.bio && typeof data.bio !== "string") {
      return NextResponse.json({ message: "Invalid bio" }, { status: 400 });
    }
    if (data.location && typeof data.location !== "string") {
      return NextResponse.json({ message: "Invalid location" }, { status: 400 });
    }
    if (data.interests && !Array.isArray(data.interests)) {
      return NextResponse.json({ message: "Invalid interests" }, { status: 400 });
    }

    // Update allowed fields
    if (data.name) user.name = data.name;
    if (data.slug) user.slug = data.slug;
    if (data.role) user.role = data.role;
    if (data.profilePicture) user.profilePicture = data.profilePicture;
    if (data.bio) user.bio = data.bio;
    if (data.location) user.location = data.location;
    if (data.interests) user.interests = data.interests;

    // Save updated user
    await user.save();

    console.log("[PUT_USER] User updated:", user.name);
    return NextResponse.json({
      message: "User updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        slug: user.slug,
        role: user.role,
        profilePicture: user.profilePicture,
        bio: user.bio,
        location: user.location,
        interests: user.interests,
      },
    });
  } catch (error) {
    console.error("[PUT_USER] Server error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check admin authorization
    const session = await getServerSession();
    if (!session || !session.user || session.user.role !== "admin") {
      console.log("[DELETE_USER] Unauthorized access attempt");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { id } = await params; // Await params to access id
    console.log("[DELETE_USER] Received id:", id);

    let user;

    // Find and delete user by ObjectId or slug
    if (mongoose.Types.ObjectId.isValid(id)) {
      user = await User.findByIdAndDelete(id);
    } else {
      user = await User.findOneAndDelete({ slug: id });
    }

    if (!user) {
      console.log("[DELETE_USER] User not found for id:", id);
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    console.log("[DELETE_USER] User deleted:", user.name);
    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("[DELETE_USER] Server error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}