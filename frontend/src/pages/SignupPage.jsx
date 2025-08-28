"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useLanguage } from "../contexts/LanguageContext"
import Toast from "../components/Toast"

const SignupPage = () => {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    phone_number: "",
    date_of_birth: "",
    password: "",
    password_confirm: "",
    terms: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [toast, setToast] = useState(null)

  const { register } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

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
    if (!formData.first_name.trim()) {
  showToast(t("auth.error.first.required"), "error")
      return false
    }
    if (!formData.last_name.trim()) {
  showToast(t("auth.error.last.required"), "error")
      return false
    }
    if (!formData.username.trim()) {
  showToast(t("auth.error.username.required"), "error")
      return false
    }
    if (formData.username.length < 3) {
  showToast(t("auth.error.username.min"), "error")
      return false
    }
    if (!formData.email.trim()) {
  showToast(t("auth.error.email.required"), "error")
      return false
    }
    if (!formData.email.includes("@")) {
  showToast(t("auth.error.email.invalid"), "error")
      return false
    }
    if (!formData.password) {
  showToast(t("auth.error.password.required"), "error")
      return false
    }
    if (formData.password.length < 8) {
  showToast(t("auth.error.password.min"), "error")
      return false
    }
    
    // Enhanced password validation to match backend requirements
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_+=\-\[\]\\;'\/~`])/
    if (!passwordRegex.test(formData.password)) {
  showToast(t("auth.error.password.complex"), "error")
      return false
    }
    
    // Check for common patterns
    const commonPatterns = ['123456', 'password', 'qwerty', 'abc123', 'admin', 'letmein', 'welcome', 'monkey', 'dragon']
    const lowercasePassword = formData.password.toLowerCase()
    if (commonPatterns.some(pattern => lowercasePassword.includes(pattern))) {
      showToast(t("auth.error.password.common"), "error")
      return false
    }
    
    // Check for sequential characters
    const hasSequential = /123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(formData.password)
    if (hasSequential) {
      showToast(t("auth.error.password.sequential"), "error")
      return false
    }
    
    if (formData.password !== formData.password_confirm) {
  showToast(t("auth.error.password.mismatch"), "error")
      return false
    }
    if (!formData.terms) {
  showToast(t("auth.error.terms"), "error")
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log("Form submitted with data:", formData)

    if (!validateForm()) {
      console.log("Form validation failed")
      return
    }

    setIsLoading(true)
    console.log("Calling register function...")

    try {
      // Avoid sending frontend-only fields like `terms`
      const { terms, ...dataForApi } = formData
      const result = await register(dataForApi)
      console.log("Register result:", result)

      if (result.success) {
        console.log("Registration successful")
        if (result.emailVerificationSent) {
          showToast(t("auth.success.register.verify"), "success")
          setTimeout(() => {
            navigate("/login")
          }, 3000)
        } else {
          showToast(t("auth.success.register.redirect"), "success")
          setTimeout(() => {
            navigate("/dashboard")
          }, 2000)
        }
      } else {
        console.log("Registration failed:", result.error)
        showToast(result.error || t("auth.error.register.generic"), "error")
      }
    } catch (error) {
      console.error("Registration error:", error)
      showToast(t("auth.error.register.generic"), "error")
    } finally {
      console.log("Setting loading to false")
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
                  d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-base-content mb-2">{t("auth.join", "Join Your Health Guide")}</h1>
          <p className="text-base-content/70">
            {t("auth.join.desc", "Create your account to access intelligent healthcare management")}
          </p>
        </div>

        {/* Sign Up Card */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">{t("auth.firstname", "First Name")}</span>
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="input input-bordered w-full"
                    placeholder={t("auth.placeholder.first")}
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">{t("auth.lastname", "Last Name")}</span>
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="input input-bordered w-full"
                    placeholder={t("auth.placeholder.last")}
                    required
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">{t("auth.username", "Username")}</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="input input-bordered w-full"
                  placeholder={t("auth.placeholder.username")}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">{t("auth.email", "Email Address")}</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input input-bordered w-full pr-10"
                    placeholder={t("auth.placeholder.email")}
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
                      d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                    />
                  </svg>
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">{t("auth.phone", "Phone Number")}</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    className="input input-bordered w-full pr-10"
                    placeholder={t("auth.placeholder.phone")}
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
                      d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
                    />
                  </svg>
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">{t("auth.dob", "Date of Birth")}</span>
                </label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleInputChange}
                  className="input input-bordered w-full"
                />
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
                    className="input input-bordered w-full pr-20"
                    placeholder={t("auth.placeholder.password.create")}
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
                <div className="text-xs text-base-content/60 mt-1">
                  <p>{t("auth.password.hint.title")}</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>{t("auth.password.hint.8chars")}</li>
                    <li>{t("auth.password.hint.upper")}</li>
                    <li>{t("auth.password.hint.lower")}</li>
                    <li>{t("auth.password.hint.number")}</li>
                    <li>{t("auth.password.hint.special")}</li>
                    <li>{t("auth.password.hint.common")}</li>
                    <li>{t("auth.password.hint.sequential")}</li>
                  </ul>
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">{t("auth.password.confirm", "Confirm Password")}</span>
                </label>
                <div className="relative">
                  <input
                    type={showPasswordConfirm ? "text" : "password"}
                    name="password_confirm"
                    value={formData.password_confirm}
                    onChange={handleInputChange}
                    className="input input-bordered w-full pr-20"
                    placeholder={t("auth.placeholder.password.confirm")}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm((v) => !v)}
                    className="btn btn-ghost btn-xs absolute right-2 top-1/2 -translate-y-1/2 text-xs"
                    aria-label={showPasswordConfirm ? t("auth.hide") : t("auth.show")}
                    title={showPasswordConfirm ? t("auth.hide") : t("auth.show")}
                  >
                    {showPasswordConfirm ? t("auth.hide") : t("auth.show")}
                  </button>
                </div>
              </div>

              <div className="form-control">
                <label className="cursor-pointer label">
                  <input
                    type="checkbox"
                    name="terms"
                    checked={formData.terms}
                    onChange={handleInputChange}
                    className="checkbox checkbox-primary checkbox-sm"
                    required
                  />
                  <span className="label-text ml-2">
                    {t("auth.terms", "I agree to the Terms of Service and Privacy Policy")}
                  </span>
                </label>
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
                      d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
                    />
                  </svg>
                )}
                <span>{isLoading ? t("auth.creatingAccount") : t("auth.signup", "Create Account")}</span>
              </button>
            </form>

            <div className="text-center mt-6">
              <p className="text-base-content/70">
                <span>{t("auth.have.account", "Already have an account?")}</span>{" "}
                <Link to="/login" className="link link-primary font-medium">
                  {t("auth.signin.here", "Sign in here")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignupPage
