import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";

import User from "@/models/user";
import { generateUserAesKey } from "@/lib/crypto/keys";
import connectDB from "@/lib/db";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    // Runs when user signs in
    async signIn({ user, account }) {
      await connectDB();

      let existingUser = await User.findOne({ email: user.email });

      if (!existingUser) {
        existingUser = new User({
          name: user.name,
          email: user.email,
          image: user.image,
          provider: account.provider,
          role: null, // user must select role later
          encryptionKey: generateUserAesKey(),
        });
        await existingUser.save();
      } else {
        if (!existingUser.encryptionKey) {
          existingUser.encryptionKey = generateUserAesKey();
          await existingUser.save();
        }
      }

      return true;
    },

    // Add user info to JWT token
    async jwt({ token, user }) {
      // On first sign-in, 'user' exists
      if (user?.email) {
        await connectDB();
        const dbUser = await User.findOne({ email: user.email });
        if (dbUser) {
          token.id = dbUser._id.toString(); // store user id in token
          token.role = dbUser.role;
        }
      }
      return token;
    },

    // Make id & role available in session
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id; // now session.user.id exists
        session.user.role = token.role;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
