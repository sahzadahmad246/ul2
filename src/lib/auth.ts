import { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { JWT } from "next-auth/jwt";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

// Define session and JWT types
export interface SessionUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  roles?: ("user" | "poet" | "admin")[];
  profilePicture?: { url: string; publicId?: string | null } | null;
}

export interface ExtendedJWT extends JWT {
  id?: string;
  roles?: ("user" | "poet" | "admin")[];
  profilePicture?: { url: string; publicId?: string | null } | null;
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

        // Check if user exists in database
        const existingUser = await User.findOne({ email: user.email });

        if (existingUser) {
          // Preserve existing name and profilePicture, only update googleId
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
            roles: existingUser.roles,
            name: existingUser.name,
            profilePicture: existingUser.profilePicture
              ? { url: existingUser.profilePicture.url ?? "", publicId: existingUser.profilePicture.publicId ?? null }
              : null,
          };
        } else {
          // Create new user with Google data as fallback
          const newUser = await User.create({
            googleId: account.providerAccountId,
            email: user.email,
            name: user.name || "Unknown",
            profilePicture: user.image ? { url: user.image, publicId: null } : undefined,
            roles: ["user"],
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          return {
            ...token,
            id: newUser._id.toString(),
            roles: newUser.roles,
            name: newUser.name,
            profilePicture: newUser.profilePicture
              ? { url: newUser.profilePicture.url ?? "", publicId: newUser.profilePicture.publicId ?? null }
              : null,
          };
        }
      }

      // Return token for subsequent calls
      return token;
    },
    async session({ session, token }) {
      // Add user data from MongoDB to session
      if (session.user && token) {
        await dbConnect();
        const dbUser = await User.findOne({ email: token.email }).lean();

        if (dbUser) {
          (session.user as SessionUser) = {
            id: dbUser._id.toString(),
            email: dbUser.email,
            name: dbUser.name,
            profilePicture: dbUser.profilePicture
              ? { url: dbUser.profilePicture.url ?? "", publicId: dbUser.profilePicture.publicId ?? null }
              : null,
            roles: dbUser.roles,
          };
        }
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Redirect to /profile after sign-in
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