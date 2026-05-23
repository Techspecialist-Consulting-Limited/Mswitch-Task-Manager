import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { authConfig } from './auth.config'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (credentials) => {
        const email = (credentials.email as string).toLowerCase().trim()
        const user = await prisma.user.findUnique({
          where: { email },
          include: { unit: true },
        })
        if (!user || !user.passwordHash) return null
        const valid = await bcrypt.compare(credentials.password as string, user.passwordHash)
        if (!valid || !user.isActive) return null
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          unitId: user.unitId,
          unitName: user.unit?.name ?? null,
        }
      },
    }),
  ],
})
