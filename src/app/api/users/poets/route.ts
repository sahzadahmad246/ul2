import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  try {
    await dbConnect();

    const poets = await User.find({ role: "poet" })
      .select("_id name profilePicture")
      .lean();

    return NextResponse.json({ poets });
  } catch (error) {
    console.error("[GET_POETS_ERROR]", error);
    return NextResponse.json(
      { message: "Server error", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}