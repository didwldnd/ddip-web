"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { UserResponse, AuthResponse } from "@/src/types/api"
import { authApi } from "@/src/services/api"
import { tokenStorage } from "@/src/lib/auth"

interface AuthContextType {
  user: UserResponse | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: {
    email: string
    password: string
    name: string
    nickname: string
    phone?: string
  }) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 초기 로드 시 저장된 사용자 정보 확인
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = tokenStorage.getAccessToken()
        const savedUser = tokenStorage.getUser()

        if (token && savedUser) {
          // 토큰이 있으면 사용자 정보 갱신 시도
          try {
            const currentUser = await authApi.getCurrentUser()
            setUser(currentUser)
            tokenStorage.setUser(currentUser)
          } catch (error) {
            // 토큰이 만료되었거나 유효하지 않으면 로그아웃 처리
            tokenStorage.clearAll()
            setUser(null)
          }
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error("인증 초기화 실패:", error)
        tokenStorage.clearAll()
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response: AuthResponse = await authApi.login({ email, password })
      
      tokenStorage.setAccessToken(response.accessToken)
      if (response.refreshToken) {
        tokenStorage.setRefreshToken(response.refreshToken)
      }
      tokenStorage.setUser(response.user)
      
      setUser(response.user)
    } catch (error) {
      throw error
    }
  }

  const register = async (data: {
    email: string
    password: string
    name: string
    nickname: string
    phone?: string
  }) => {
    try {
      const response: AuthResponse = await authApi.register(data)
      
      tokenStorage.setAccessToken(response.accessToken)
      if (response.refreshToken) {
        tokenStorage.setRefreshToken(response.refreshToken)
      }
      tokenStorage.setUser(response.user)
      
      setUser(response.user)
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error("로그아웃 실패:", error)
    } finally {
      tokenStorage.clearAll()
      setUser(null)
    }
  }

  const refreshUser = async () => {
    try {
      const currentUser = await authApi.getCurrentUser()
      setUser(currentUser)
      tokenStorage.setUser(currentUser)
    } catch (error) {
      console.error("사용자 정보 갱신 실패:", error)
      // 토큰이 만료되었으면 로그아웃 처리
      tokenStorage.clearAll()
      setUser(null)
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
