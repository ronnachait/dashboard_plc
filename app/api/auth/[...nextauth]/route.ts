import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { User } from "@prisma/client"; // ✅ ใช้ตรงนี้แทน Prisma.User

const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user) return null;

        const isValid = await compare(credentials.password, user.password);
        if (!isValid) return null;

        return user as User;
      },
    }),
  ],

  pages: {
    signIn: "/auth/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },
  jwt: {
    maxAge: 8 * 60 * 60,
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as User;
        token.id = u.id;
        token.role = u.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      const appUrl = process.env.NEXTAUTH_URL || baseUrl;

      try {
        const target = new URL(url, appUrl); // ใช้ appUrl เป็น base เผื่อ url เป็นแค่ path

        // ใช้ host/domain จาก NEXTAUTH_URL เสมอ
        const safeBase = new URL(appUrl);

        // replace host + protocol ให้ตรงกับ NEXTAUTH_URL
        target.protocol = safeBase.protocol;
        target.host = safeBase.host;

        return target.toString();
      } catch {
        return appUrl;
      }
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
