import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { addToBlacklist } from "C:/Users/HP/Desktop/oio/AMstores/backend/tokenBlacklist.js";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Simple placeholder: forward credentials to existing backend login endpoint
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: credentials.email, password: credentials.password }),
        });
        const data = await res.json();
        if (res.ok && data.token) {
          return { email: credentials.email, token: data.token };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.accessToken = user.token;
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/signin",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

// Optional logout route (can be called from /api/auth/logout)
export async function POSTLogout(req) {
  const { token } = await req.json();
  if (token) await addToBlacklist(token);
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
