export const authConfig = {
  trustHost: true,
  pages: { signIn: '/login' },
  callbacks: {
    jwt: ({ token, user }: { token: any; user: any }) => {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.unitId = user.unitId
        token.unitName = user.unitName
      }
      return token
    },
    session: ({ session, token }: { session: any; token: any }) => {
      session.user.id = token.id
      session.user.role = token.role
      session.user.unitId = token.unitId
      session.user.unitName = token.unitName
      return session
    },
  },
}
