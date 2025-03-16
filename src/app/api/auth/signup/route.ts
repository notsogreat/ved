import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  if (!req.body) {
    return NextResponse.json({ error: 'No data provided' }, { status: 400 })
  }

  try {
    const body = await req.json()
    const { name, email, password } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log('name', name)
    console.log('email', email)
    console.log('password', password)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    console.log('existingUser', existingUser?.email)

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    console.log('hashedPassword', hashedPassword)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        updatedAt: new Date(),
      }
    })

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email
    })
  } catch (error) {
    // Log the full error details
    console.error('Signup error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
      error // Log the raw error object as well
    })
    
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
} 