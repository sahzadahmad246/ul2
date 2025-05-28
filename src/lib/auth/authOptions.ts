// src/lib/auth/authOptions.ts
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { slugifyUser } from "@/lib/slugify";
import { SessionUser, ExtendedJWT } from "@/types/authTypes";

// Validate environment variables
const requiredEnvVars = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
];
requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Environment variable ${envVar} is missing`);
  }
});

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }): Promise<ExtendedJWT> {
      try {
        if (account && user) {
          await dbConnect();
          const existingUser = await User.findOne({ email: user.email });

          if (existingUser) {
            await User.updateOne(
              { email: user.email },
              { $set: { googleId: account.providerAccountId } }
            );
            return {
              ...token,
              id: existingUser._id.toString(),
              role: existingUser.role,
              name: existingUser.name,
              slug: existingUser.slug,
              profilePicture: existingUser.profilePicture
                ? {
                    url: existingUser.profilePicture.url,
                    publicId: existingUser.profilePicture.publicId ?? null,
                  }
                : null,
            };
          }

          const baseSlug = slugifyUser(user.name || "unknown");
          let slug = baseSlug;
          let counter = 1;
          while (await User.findOne({ slug })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
          }

          const newUser = new User({
            googleId: account.providerAccountId,
            email: user.email || `unknown-${Date.now()}@example.com`,
            name: user.name || "Unknown",
            slug,
            profilePicture: user.image ? { url: user.image, publicId: null } : undefined,
            role: "user",
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          await newUser.save();
          return {
            ...token,
            id: newUser._id.toString(),
            role: newUser.role,
            name: newUser.name,
            slug: newUser.slug,
            profilePicture: newUser.profilePicture
              ? {
                  url: newUser.profilePicture.url,
                  publicId: newUser.profilePicture.publicId ?? null,
                }
              : null,
          };
        }
        return token;
      } catch {
        return token;
      }
    },
    async session({ session, token }) {
      try {
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
                    url: dbUser.profilePicture.url,
                    publicId: dbUser.profilePicture.publicId ?? null,
                  }
                : null,
              role: dbUser.role,
            };
          }
        }
        return session;
      } catch {
        return session;
      }
    },
    async redirect({ url, baseUrl }) {
      return url.includes("callbackUrl") ? `${baseUrl}/profile` : url;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};