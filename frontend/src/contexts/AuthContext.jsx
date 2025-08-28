"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { apiClient } from "../services/apiClient"

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [rememberMe, setRememberMe] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [refreshTokenJti, setRefreshTokenJti] = useState(null)
  const navigate = useNavigate()

  // Check if token is expired
  const isTokenExpired = useCallback((token) => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]))
      const currentTime = Math.floor(Date.now() / 1000)
      return payload.exp < currentTime
    } catch (error) {
      return true
    }
  }, [])

  // Get stored token
  const getStoredToken = useCallback(() => {
    return localStorage.getItem("access_token") || sessionStorage.getItem("access_token")
  }, [])

  // Get refresh token
  const getRefreshToken = useCallback(() => {
    return localStorage.getItem("refresh_token") || sessionStorage.getItem("refresh_token")
  }, [])

  // Store tokens
  const storeTokens = useCallback((accessToken, refreshToken, remember) => {
    const storage = remember ? localStorage : sessionStorage

    // Clear tokens from both storages first
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    sessionStorage.removeItem("access_token")
    sessionStorage.removeItem("refresh_token")

    // Store in appropriate storage
    storage.setItem("access_token", accessToken)
    storage.setItem("refresh_token", refreshToken)

    // Always store remember me preference in localStorage
    localStorage.setItem("remember_me", remember.toString())

    apiClient.setToken(accessToken)
  }, [])

  // Extract JWT ID from refresh token
  const extractRefreshTokenJti = useCallback((refreshToken) => {
    try {
      const payload = JSON.parse(atob(refreshToken.split(".")[1]))
      setRefreshTokenJti(payload.jti)
    } catch (error) {
      console.error("Error extracting refresh token JTI:", error)
    }
  }, [])

  // Refresh access token
  const refreshAccessToken = useCallback(async () => {
    try {
      const refreshToken = getRefreshToken()
      if (!refreshToken) {
        logout()
        return false
      }

      const response = await apiClient.request("/auth/token/refresh/", {
        method: "POST",
        body: JSON.stringify({ refresh: refreshToken }),
      })

      if (!response.ok) {
        logout()
        return false
      }

      const data = await response.json()

      if (data.access) {
        const newRefreshToken = data.refresh || refreshToken
        storeTokens(data.access, newRefreshToken, rememberMe)

        if (data.session_id) {
          setSessionId(data.session_id)
        }

        if (data.refresh) {
          extractRefreshTokenJti(data.refresh)
        }

        return true
      } else {
        logout()
        return false
      }
    } catch (error) {
      console.error("Token refresh error:", error)
      logout()
      return false
    }
  }, [getRefreshToken, storeTokens, rememberMe, extractRefreshTokenJti])

  // Load user profile
  const loadUserProfile = useCallback(async () => {
    try {
      const response = await apiClient.request("/auth/profile/")
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        setIsAuthenticated(true)
      }
    } catch (error) {
      console.error("Failed to load user profile:", error)
    }
  }, [])

  // Login function
  const login = useCallback(
    async (username, password, remember = false) => {
      try {
        setRememberMe(remember)

        const loginData = { username, password, remember_me: remember }
        const response = await apiClient.request("/auth/login/", {
          method: "POST",
          body: JSON.stringify(loginData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          return { success: false, error: errorData.detail || "Login failed" }
        }

        const data = await response.json()

        if (data.access) {
          storeTokens(data.access, data.refresh, remember)
          setUser(data.user)
          setIsAuthenticated(true)
          setSessionId(data.session_id)
          extractRefreshTokenJti(data.refresh)

          return {
            success: true,
            user: data.user,
            emailVerified: data.user.email_verified,
            sessionId: data.session_id,
          }
        } else {
          return { success: false, error: "Invalid credentials" }
        }
      } catch (error) {
        console.error("Login error:", error)
        return { success: false, error: "Login failed. Please try again." }
      }
    },
    [storeTokens, extractRefreshTokenJti],
  )

  // Register function
  const register = useCallback(async (userData) => {
    try {
      if (userData.password !== userData.password_confirm) {
        return { success: false, error: "Passwords don't match" }
      }

      const response = await apiClient.register(userData)

      if (response.user || response.message) {
        return {
          success: true,
          user: response.user,
          message: response.message || "Registration successful! Please check your email to verify your account.",
          emailVerificationSent: response.email_verification_sent,
        }
      } else {
        return { success: false, error: response.error || "Registration failed" }
      }
    } catch (error) {
      console.error("Registration error:", error)
      return { success: false, error: "Registration failed. Please try again." }
    }
  }, [])

  // Logout function
  const logout = useCallback(async () => {
    try {
      const refreshToken = getRefreshToken()

      if (refreshToken) {
        await apiClient.logout(refreshToken)
      }
    } catch (error) {
      console.error("Logout API call failed:", error)
    }

    // Clear auth data
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("remember_me")
    sessionStorage.removeItem("access_token")
    sessionStorage.removeItem("refresh_token")

    apiClient.clearToken()
    setUser(null)
    setIsAuthenticated(false)
    setSessionId(null)
    setRefreshTokenJti(null)

    navigate("/")
  }, [getRefreshToken, navigate])

  // Password reset request
  const requestPasswordReset = useCallback(async (email) => {
    try {
      const response = await apiClient.requestPasswordReset(email)

      if (response.message) {
        return { success: true, message: response.message }
      } else {
        return { success: false, error: response.error || "Failed to send reset email" }
      }
    } catch (error) {
      console.error("Password reset request error:", error)
      return { success: false, error: "Failed to send password reset email." }
    }
  }, [])

  // Email verification
  const verifyEmail = useCallback(
    async (token) => {
      try {
        const response = await apiClient.verifyEmail(token)

        if (response.message) {
          if (user) {
            setUser({ ...user, email_verified: true })
          }

          return {
            success: true,
            message: response.message,
            user: response.user,
          }
        } else {
          return { success: false, error: response.error || "Email verification failed" }
        }
      } catch (error) {
        console.error("Email verification error:", error)
        return { success: false, error: "Failed to verify email." }
      }
    },
    [user],
  )

  // Update profile
  const updateProfile = useCallback(
    async (profileData) => {
      try {
        const response = await apiClient.updateProfile(profileData)

        if (response.id) {
          setUser({ ...user, ...response })
          return {
            success: true,
            user: response,
            message: "Profile updated successfully!",
          }
        } else {
          return { success: false, error: response.error || "Profile update failed" }
        }
      } catch (error) {
        console.error("Profile update error:", error)
        return { success: false, error: "Failed to update profile." }
      }
    },
    [user],
  )

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = getStoredToken()
      const remember = localStorage.getItem("remember_me") === "true"
      setRememberMe(remember)

      if (token && !isTokenExpired(token)) {
        apiClient.setToken(token)
        await loadUserProfile()
      } else {
        const refreshToken = getRefreshToken()
        if (refreshToken) {
          const refreshed = await refreshAccessToken()
          if (refreshed) {
            await loadUserProfile()
          }
        }
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [getStoredToken, isTokenExpired, getRefreshToken, refreshAccessToken, loadUserProfile])

  // Setup token refresh timer
  useEffect(() => {
    if (!isAuthenticated) return

    const token = getStoredToken()
    if (!token) return

    try {
      const payload = JSON.parse(atob(token.split(".")[1]))
      const expiryTime = payload.exp * 1000
      const refreshTime = expiryTime - 5 * 60 * 1000 // 5 minutes before expiry
      const timeUntilRefresh = refreshTime - Date.now()

      if (timeUntilRefresh > 0) {
        const timer = setTimeout(() => {
          refreshAccessToken()
        }, timeUntilRefresh)

        return () => clearTimeout(timer)
      }
    } catch (error) {
      console.error("Error setting up token refresh:", error)
    }
  }, [isAuthenticated, getStoredToken, refreshAccessToken])

  const value = {
    user,
    isAuthenticated,
    isLoading,
    sessionId,
    refreshTokenJti,
    login,
    register,
    logout,
    requestPasswordReset,
    verifyEmail,
    updateProfile,
    refreshAccessToken,
    requiresEmailVerification: user && !user.email_verified,
    getUserEmail: () => user?.email || null,
    getCurrentUser: () => user,
    isRememberMeEnabled: () => localStorage.getItem("remember_me") === "true",
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
