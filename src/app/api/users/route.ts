import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  try {
    await dbConnect();
    console.log("[GET_ALL_USERS] Fetching all users");

    // Fetch all users with selected fields
    const users = await User.find()
      .select("name slug roles profilePicture followerCount poemCount createdAt updatedAt")
      .lean();

    console.log("[GET_ALL_USERS] Found", users.length, "users");

    return NextResponse.json({ users });
  } catch (error) {
    console.error("[GET_ALL_USERS] Server error:", error);
    return NextResponse.json(
      {
        message: "Server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}