import { NextAuthOptions, User as NextAuthUser, Account, Session } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { connectToDatabase } from "@/lib/mongodb";
import User from "../models/User";
import { z } from "zod";

// Schema for Google OAuth data
const signupSchema = z.object({
  googleId: z.string().min(1, "Google ID is required"),
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required").max(100, "Name cannot exceed 100 characters"),
  profilePicture: z
    .object({
      publicId: z.string().optional(),
      url: z.string().url().optional(),
    })
    .optional(),
});

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }: { user: NextAuthUser; account: Account | null }) {
      if (!account) return false; // Guard against null account

      await connectToDatabase();

      const signupData = {
        googleId: account.providerAccountId,
        email: user.email || "", // Fallback to empty string
        name: user.name || "Unknown", // Fallback to default name
        profilePicture: user.image ? { url: user.image } : undefined,
      };

      try {
        signupSchema.parse(signupData);

        let dbUser = await User.findOne({ $or: [{ googleId: signupData.googleId }, { email: signupData.email }] });
        if (!dbUser) {
          dbUser = new User(signupData);
          await dbUser.save();
        }

        return true;
      } catch (error) {
        console.error("Sign-in error:", error);
        return false;
      }
    },
    async session({ session }: { session: Session }) {
      if (session.user.email) {
        const dbUser = await User.findOne({ email: session.user.email });
        if (dbUser) {
          session.user.id = dbUser._id.toString();
        }
      }
      return session;
    },
  },
};