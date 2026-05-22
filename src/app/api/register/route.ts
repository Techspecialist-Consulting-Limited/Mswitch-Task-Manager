import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    let name: string, email: string, password: string, unitId: string | undefined
    try {
      const body = await request.json()
      name = body.name
      email = body.email
      password = body.password
      unitId = body.unitId
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    if (unitId) {
      const unit = await prisma.unit.findUnique({ where: { id: unitId } })
      if (!unit) {
        return NextResponse.json({ error: 'Unit not found' }, { status: 400 })
      }
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'STAFF',
        unitId: unitId || null,
      },
    })

    return NextResponse.json({ id: user.id, name: user.name, email: user.email })
  } catch (err) {
    console.error('Register error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
