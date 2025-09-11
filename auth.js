import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import User from '@/api/models/user';
import { mongoConnect } from './utils/connectDb';

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        await mongoConnect();
        try {
          const user = await User.findOne({ email: credentials.email });

          if (!user) {
            throw new Error('User not found. Please sign up for an account.');
          }

          const isMatch = await bcrypt.compare(credentials.password, user.password);
          if (!isMatch) {
            throw new Error('Incorrect email or password.');
          }

          return {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            integrator: user.integrator.toString(),
            first_name: user.first_name,
            last_name: user.last_name
          };
        } catch (error) {
          console.error('Authentication error:', error.message);
          return null; 
        }
      }
    })
  ],
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET?.trim(),
  useSecureCookies: false,
  trustHost: true,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = user.role;
        token.integrator = user.integrator;
        token.first_name = user.first_name;
        token.last_name = user.last_name;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.id,
        email: token.email,
        role: token.role,
        integrator: token.integrator,
        first_name: token.first_name,
        last_name: token.last_name
      };
      return session;
    }
  },
  events: {
    signOut(message) {
      console.log("User signed out:", message);
    },
  },
  pages: {
    signIn: '/login'
  }
});
