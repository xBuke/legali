import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSubscriptionLimits } from '@/lib/subscription'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    const clerkUser = await currentUser()
    
    if (!userId || !clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user already has an organization
    const existingUser = await db.user.findUnique({
      where: { clerkUserId: userId },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User already has an organization' }, { status: 400 })
    }

    const { name, email, phone, address } = await request.json()

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    // Create organization with TRIAL status
    const organization = await db.organization.create({
      data: {
        name,
        email,
        phone: phone || null,
        address: address || null,
        subscriptionTier: 'BASIC',
        subscriptionStatus: 'TRIAL',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        storageLimit: getSubscriptionLimits('BASIC').storage,
      },
    })

    // Create user as ADMIN
    const user = await db.user.create({
      data: {
        clerkUserId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || email,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        role: 'ADMIN',
        organizationId: organization.id,
        hourlyRate: 100, // Default hourly rate in EUR
      },
    })

    return NextResponse.json({ 
      success: true,
      organization, 
      user 
    })
  } catch (error) {
    console.error('Error creating organization:', error)
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    )
  }
}
