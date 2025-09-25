import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: ChangePasswordRequest = await request.json()
    const { currentPassword, newPassword, confirmPassword } = body

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: 'All password fields are required' }, { status: 400 })
    }

    // Check if new passwords match
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'New passwords do not match' }, { status: 400 })
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long' },
        { status: 400 },
      )
    }

    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.isValid) {
      return NextResponse.json({ error: passwordValidation.message }, { status: 400 })
    }

    // For demo purposes, we'll simulate password verification
    // In a real app, you would:
    // 1. Fetch user from database
    // 2. Verify current password with bcrypt.compare()
    // 3. Hash new password with bcrypt.hash()
    // 4. Update password in database

    // Simulate current password verification
    const isCurrentPasswordValid = await verifyCurrentPassword(session.user.email, currentPassword)
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    }

    // Simulate password update
    await updateUserPassword(session.user.email, newPassword)

    return NextResponse.json(
      {
        success: true,
        message: 'Password updated successfully',
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('Password change error:', error)
    return NextResponse.json(
      { error: 'Failed to change password. Please try again.' },
      { status: 500 },
    )
  }
}

// Demo function - In real app, this would verify against database
async function verifyCurrentPassword(email: string, currentPassword: string): Promise<boolean> {
  // For demo purposes, we'll accept any current password
  // In a real app, you would:
  // 1. Fetch user's hashed password from database
  // 2. Use bcrypt.compare(currentPassword, hashedPassword)

  // Simulate some async work
  await new Promise((resolve) => setTimeout(resolve, 100))

  // For demo, accept any password that's not empty
  return currentPassword.length > 0
}

// Demo function - In real app, this would update the database
async function updateUserPassword(email: string, _newPassword: string): Promise<void> {
  // For demo purposes, we'll just log the password change
  // In a real app, you would:
  // 1. Hash the new password with bcrypt.hash()
  // 2. Update the user's password in the database

  console.log(`Password updated for user: ${email}`)

  // Simulate some async work
  await new Promise((resolve) => setTimeout(resolve, 200))
}

function validatePassword(password: string): { isValid: boolean; message: string } {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' }
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' }
  }

  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' }
  }

  if (!/\d/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' }
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one special character' }
  }

  return { isValid: true, message: 'Password is valid' }
}
