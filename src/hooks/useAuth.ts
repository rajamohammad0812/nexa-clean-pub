'use client'
import { useState } from 'react'

export interface User {
  id: string
  email: string
  name: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const login = async (email: string, _password: string): Promise<boolean> => {
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // For demo purposes, accept any email/password
      const mockUser: User = {
        id: '1',
        email: email,
        name: email.split('@')[0] || 'User',
      }

      setUser(mockUser)
      setIsLoading(false)
      return true
    } catch (error) {
      setIsLoading(false)
      return false
    }
  }

  const logout = () => {
    setUser(null)
  }

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  }
}
