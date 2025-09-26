import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import AzureADProvider from 'next-auth/providers/azure-ad'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // For demo purposes, accept any email/password and create/find user
        if (credentials?.email && credentials?.password) {
          try {
            // Find or create user in database
            const user = await prisma.user.upsert({
              where: { email: credentials.email },
              create: {
                email: credentials.email,
                name: credentials.email.split('@')[0] || 'User',
              },
              update: {
                name: credentials.email.split('@')[0] || 'User',
              }
            })
            
            return {
              id: user.id,
              email: user.email,
              name: user.name,
            }
          } catch (error) {
            console.error('Error creating/finding user:', error)
            // Fallback to static user for development
            return {
              id: 'dev-user-1',
              email: credentials.email,
              name: credentials.email.split('@')[0] || 'User',
            }
          }
        }
        return null
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // Ensure user exists in database for all providers
        if (user.email) {
          await prisma.user.upsert({
            where: { email: user.email },
            create: {
              email: user.email,
              name: user.name || user.email.split('@')[0] || 'User',
              image: user.image || null,
            },
            update: {
              name: user.name || user.email.split('@')[0] || 'User',
              image: user.image || null,
            }
          })
        }
        return true
      } catch (error) {
        console.error('Error in signIn callback:', error)
        return true // Allow signin even if database operation fails
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user?.email) {
        try {
          // Get user ID from database
          const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email }
          })
          if (dbUser) {
            session.user.id = dbUser.id
          }
        } catch (error) {
          console.error('Error fetching user ID:', error)
          session.user.id = token.id as string || 'fallback-id'
        }
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  debug: process.env.NODE_ENV === 'development',
}
