"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { UserResponse, AuthResponse, RegisterRequest } from "@/src/types/api"
import { authApi } from "@/src/services/api"
import { tokenStorage } from "@/src/lib/auth"

interface AuthContextType {
  user: UserResponse | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  oauthLogin: (provider: 'google' | 'kakao' | 'naver') => Promise<void>
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

  const oauthLogin = async (provider: 'google' | 'kakao' | 'naver') => {
    try {
      // OAuth 로그인 URL 가져오기
      const redirectUrl = await authApi.oauthLogin(provider)
      
      // 백엔드 OAuth 엔드포인트로 리다이렉트
      // 백엔드에서 OAuth 제공자 페이지로 리다이렉트하고,
      // 인증 후 콜백 URL로 돌아옴
      window.location.href = redirectUrl
    } catch (error) {
      console.error("OAuth 로그인 실패:", error)
      throw error
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
    oauthLogin,
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
