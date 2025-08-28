"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useLanguage } from "../contexts/LanguageContext"
import Toast from "../components/Toast"

const LoginPage = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [toast, setToast] = useState(null)
  const [searchParams] = useSearchParams()

  const { login, requestPasswordReset, verifyEmail } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  // Handle URL parameters for email verification
  useEffect(() => {
    const token = searchParams.get("token")
    const action = searchParams.get("action")

    if (token && action === "verify-email") {
      handleEmailVerification(token)
    } else if (token && action === "reset-password") {
      navigate(`/password-reset?token=${token}`)
    }
  }, [searchParams, navigate])

  const handleEmailVerification = async (token) => {
    try {
      const result = await verifyEmail(token)
      if (result.success) {
        showToast(result.message, "success")
      } else {
        showToast(result.error, "error")
      }
    } catch (error) {
      console.error("Email verification error:", error)
  showToast(t("auth.error.verifyEmail"), "error")
    }
  }

  const showToast = (message, type) => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 5000)
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const validateForm = () => {
    if (!formData.username.trim()) {
  showToast(t("auth.error.username.required"), "error")
      return false
    }
    if (!formData.password) {
  showToast(t("auth.error.password.required"), "error")
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    try {
      const result = await login(formData.username, formData.password, formData.rememberMe)

      if (result.success) {
  showToast(t("auth.success.login.redirect"), "success")

        if (!result.emailVerified) {
          showToast(t("auth.warning.verifyEmail"), "warning")
        }

        setTimeout(() => {
          navigate("/dashboard")
        }, 1000)
      } else {
        showToast(result.error, "error")
      }
    } catch (error) {
      console.error("Login error:", error)
  showToast(t("auth.error.login.generic"), "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordReset = async (e) => {
    e.preventDefault()

    if (!resetEmail || !resetEmail.includes("@")) {
  showToast(t("auth.error.reset.invalidEmail"), "error")
      return
    }

    setIsLoading(true)

    try {
      const result = await requestPasswordReset(resetEmail)

      if (result.success) {
        showToast(result.message, "success")
        setShowPasswordReset(false)
        setResetEmail("")
      } else {
        showToast(result.error, "error")
      }
    } catch (error) {
      console.error("Password reset error:", error)
  showToast(t("auth.error.reset.generic"), "error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center px-4 py-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-8 h-8 text-primary"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-base-content mb-2">{t("auth.welcome", "Welcome Back")}</h1>
          <p className="text-base-content/70">
            {t("auth.welcome.desc", "Sign in to access your Health Guide account")}
          </p>
        </div>

        {/* Login Card */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">{t("auth.username", "Username")}</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder={t("auth.placeholder.username")}
                    className="input input-bordered w-full pr-10"
                    required
                  />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/50"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                    />
                  </svg>
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">{t("auth.password", "Password")}</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder={t("auth.placeholder.password")}
                    className="input input-bordered w-full pr-20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="btn btn-ghost btn-xs absolute right-2 top-1/2 -translate-y-1/2 text-xs"
                    aria-label={showPassword ? t("auth.hide") : t("auth.show")}
                    title={showPassword ? t("auth.hide") : t("auth.show")}
                  >
                    {showPassword ? t("auth.hide") : t("auth.show")}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="cursor-pointer label">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    className="checkbox checkbox-primary checkbox-sm"
                  />
                  <span className="label-text ml-2">{t("auth.remember", "Remember me")}</span>
                </label>
                <button type="button" onClick={() => setShowPasswordReset(true)} className="link link-primary text-sm">
                  {t("auth.forgot", "Forgot password?")}
                </button>
              </div>

              <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
                {isLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
                    />
                  </svg>
                )}
                <span>{isLoading ? t("auth.signingIn") : t("auth.signin", "Sign In")}</span>
              </button>
            </form>

            <div className="text-center mt-6">
              <p className="text-base-content/70">
                <span>{t("auth.no.account", "Don't have an account?")}</span>{" "}
                <Link to="/signup" className="link link-primary font-medium">
                  {t("auth.signup.here", "Sign up here")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showPasswordReset && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">{t("auth.reset.title")}</h3>
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">{t("auth.email")}</span>
                </label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder={t("auth.placeholder.resetEmail")}
                  className="input input-bordered w-full"
                  required
                />
              </div>
              <div className="modal-action">
                <button type="button" className="btn" onClick={() => setShowPasswordReset(false)}>
                  {t("auth.reset.cancel")}
                </button>
                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                  {isLoading ? <span className="loading loading-spinner loading-sm"></span> : t("auth.reset.send")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default LoginPage
