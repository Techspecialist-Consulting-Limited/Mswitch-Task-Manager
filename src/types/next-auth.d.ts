import NextAuth, { type DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface User {
    role: string
    unitId: string | null
    unitName: string | null
  }
  interface Session {
    user: {
      id: string
      role: string
      unitId: string | null
      unitName: string | null
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    unitId: string | null
    unitName: string | null
  }
}
