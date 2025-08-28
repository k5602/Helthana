// Determine API base URL based on environment
function getApiBaseUrl() {
  const hostname = window.location.hostname
  const protocol = window.location.protocol

  // Development environments - use port 8000 for Django backend
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    hostname.startsWith("172.") ||
    /^\d+\.\d+\.\d+\.\d+$/.test(hostname)
  ) {
    return `${protocol}//${hostname}:8000/api/v1`
  }

  // Production environment - same host as frontend
  return `${protocol}//${window.location.host}/api/v1`
}

const API_BASE_URL = getApiBaseUrl()

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL
    this.token = localStorage.getItem("access_token")
  }

  // Set authentication token
  setToken(token) {
    this.token = token
    localStorage.setItem("access_token", token)
  }

  // Remove authentication token
  clearToken() {
    this.token = null
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      credentials: "include", // Include cookies for CORS
      ...options,
    }

    // Add auth token if available
    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, config)

      if (response.status === 401) {
        // Token expired, try to refresh
        const refreshed = await this.refreshToken()
        if (refreshed) {
          config.headers.Authorization = `Bearer ${this.token}`
          return fetch(url, config)
        } else {
          this.clearToken()
          // Don't redirect if we're already on login page
          if (!window.location.pathname.includes("login") && !window.location.pathname.includes("index")) {
            window.location.href = "/"
          }
        }
      }

      return response
    } catch (error) {
      console.error("API request failed:", error)

      // Fallback error handling
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        throw new Error("Unable to connect to server. Please check your connection.")
      }
      throw error
    }
  }

  // Safe JSON parsing with error handling
  async safeJsonParse(response) {
    try {
      const text = await response.text()
      return text ? JSON.parse(text) : {}
    } catch (error) {
      console.error("JSON parsing error:", error)
      return { error: "Invalid response format" }
    }
  }

  // Authentication methods
  async login(username, password) {
    const response = await this.request("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    })

    if (!response.ok) {
      const errorData = await this.safeJsonParse(response)
      return errorData
    }

    return this.safeJsonParse(response)
  }

  async register(userData) {
    console.log("ApiClient register called with:", userData)
    
    const response = await this.request("/auth/register/", {
      method: "POST",
      body: JSON.stringify(userData),
    })

    console.log("API response status:", response.status, "ok:", response.ok)

    if (!response.ok) {
      const errorData = await this.safeJsonParse(response)
      console.log("API error data:", errorData)
      return errorData
    }

    const result = await this.safeJsonParse(response)
    console.log("API success data:", result)
    return result
  }

  async refreshToken(refreshToken) {
    if (!refreshToken) {
      refreshToken = localStorage.getItem("refresh_token") || sessionStorage.getItem("refresh_token")
    }
    if (!refreshToken) return false

    try {
      const response = await this.request("/auth/token/refresh/", {
        method: "POST",
        body: JSON.stringify({ refresh: refreshToken }),
      })

      if (response.ok) {
        const data = await this.safeJsonParse(response)
        if (data.access) {
          this.setToken(data.access)
          return data
        }
      }
    } catch (error) {
      console.error("Token refresh failed:", error)
    }
    return false
  }

  // Password reset request
  async requestPasswordReset(email) {
    const response = await this.request("/auth/password-reset/", {
      method: "POST",
      body: JSON.stringify({ email }),
    })

    if (!response.ok) {
      const errorData = await this.safeJsonParse(response)
      return errorData
    }

    return this.safeJsonParse(response)
  }

  // Email verification
  async verifyEmail(token) {
    const response = await this.request("/auth/verify-email/", {
      method: "POST",
      body: JSON.stringify({ token }),
    })

    if (!response.ok) {
      const errorData = await this.safeJsonParse(response)
      return errorData
    }

    return this.safeJsonParse(response)
  }

  // Profile management
  async updateProfile(profileData) {
    const response = await this.request("/auth/profile/", {
      method: "PATCH",
      body: JSON.stringify(profileData),
    })

    if (!response.ok) {
      const errorData = await this.safeJsonParse(response)
      return errorData
    }

    return this.safeJsonParse(response)
  }

  // Logout
  async logout(refreshToken) {
    const response = await this.request("/auth/logout/", {
      method: "POST",
      body: JSON.stringify({ refresh: refreshToken }),
    })

    if (!response.ok) {
      const errorData = await this.safeJsonParse(response)
      return errorData
    }

    return this.safeJsonParse(response)
  }

  // Prescription management
  async uploadPrescription(formData) {
    const response = await this.request("/prescriptions/", {
      method: "POST",
      body: formData,
      headers: {}, // Remove Content-Type to let browser set it for FormData
    })

    if (!response.ok) {
      const errorData = await this.safeJsonParse(response)
      return errorData
    }

    return this.safeJsonParse(response)
  }

  // Vitals management
  async getVitals(filters = {}) {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value)
    })
    const queryString = params.toString()
    const endpoint = queryString ? `/vitals/?${queryString}` : "/vitals/"

    const response = await this.request(endpoint)

    if (!response.ok) {
      const errorData = await this.safeJsonParse(response)
      return errorData
    }

    return this.safeJsonParse(response)
  }

  async addVital(vitalData) {
    const response = await this.request("/vitals/", {
      method: "POST",
      body: JSON.stringify(vitalData),
    })

    if (!response.ok) {
      const errorData = await this.safeJsonParse(response)
      return errorData
    }

    return this.safeJsonParse(response)
  }

  // Emergency management
  async sendEmergencyAlert(alertData) {
    const response = await this.request("/emergency/alert/", {
      method: "POST",
      body: JSON.stringify(alertData),
    })

    if (!response.ok) {
      const errorData = await this.safeJsonParse(response)
      return errorData
    }

    return this.safeJsonParse(response)
  }
}

// Global API client instance
export const apiClient = new ApiClient()

// Enhanced error handling with retry logic
export const withRetry = async (apiCall, maxRetries = 3, delay = 1000) => {
  let lastError

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall()
    } catch (error) {
      lastError = error

      // Don't retry on authentication errors or client errors (4xx)
      if (error.status >= 400 && error.status < 500) {
        throw error
      }

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        throw error
      }

      // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, attempt - 1)))
    }
  }

  throw lastError
}

// Enhanced API response handler
export const handleApiResponse = async (response) => {
  if (!response.ok) {
    const errorData = await apiClient.safeJsonParse(response)
    const error = new Error(errorData.error?.message || `HTTP ${response.status}`)
    error.status = response.status
    error.data = errorData
    throw error
  }
  return apiClient.safeJsonParse(response)
}
