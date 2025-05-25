// src/app/api/auth/[...nextauth]/route.ts
import { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { JWT } from "next-auth/jwt";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { slugifyUser } from "@/lib/slugify";

// Define session and JWT types
export interface SessionUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: "user" | "poet" | "admin";
  profilePicture?: { url: string; publicId?: string | null } | null;
  slug?: string;
}

export interface ExtendedJWT extends JWT {
  id?: string;
  role?: "user" | "poet" | "admin";
  profilePicture?: { url: string; publicId?: string | null } | null;
  slug?: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }): Promise<ExtendedJWT> {
      if (account && user) {
        await dbConnect();

        const existingUser = await User.findOne({ email: user.email });

        if (existingUser) {
          await User.updateOne(
            { email: user.email },
            {
              $set: {
                googleId: account.providerAccountId,
              },
            }
          );

          return {
            ...token,
            id: existingUser._id.toString(),
            role: existingUser.role,
            name: existingUser.name,
            slug: existingUser.slug,
            profilePicture: existingUser.profilePicture
              ? {
                  url: existingUser.profilePicture.url ?? "",
                  publicId: existingUser.profilePicture.publicId ?? null,
                }
              : null,
          };
        } else {
          const baseSlug = slugifyUser(user.name || "unknown");
          let slug = baseSlug;
          let counter = 1;

          while (await User.findOne({ slug })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
          }

          const newUserData = {
            googleId: account.providerAccountId,
            email: user.email || "unknown@example.com",
            name: user.name || "Unknown",
            slug,
            profilePicture: user.image
              ? { url: user.image, publicId: null }
              : undefined,
            role: "user", // Explicitly set role as string
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          console.log("[Auth] Creating new user with data:", newUserData); // Debug log

          const newUser = new User(newUserData);
          await newUser.save();

          console.log("[Auth] Saved user:", await User.findById(newUser._id)); // Debug log

          return {
            ...token,
            id: newUser._id.toString(),
            role: newUser.role,
            name: newUser.name,
            slug: newUser.slug,
            profilePicture: newUser.profilePicture
              ? {
                  url: newUser.profilePicture.url ?? "",
                  publicId: newUser.profilePicture.publicId ?? null,
                }
              : null,
          };
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        await dbConnect();
        const dbUser = await User.findOne({ email: token.email }).lean();

        if (dbUser) {
          (session.user as SessionUser) = {
            id: dbUser._id.toString(),
            email: dbUser.email,
            name: dbUser.name,
            slug: dbUser.slug,
            profilePicture: dbUser.profilePicture
              ? {
                  url: dbUser.profilePicture.url ?? "",
                  publicId: dbUser.profilePicture.publicId ?? null,
                }
              : null,
            role: dbUser.role,
          };
          
        }
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.includes("callbackUrl")) {
        return `${baseUrl}/profile`;
      }
      return url;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

import NextAuth from "next-auth";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };