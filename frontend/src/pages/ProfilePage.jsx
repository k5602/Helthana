"use client"

import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import { useLanguage } from "../contexts/LanguageContext"
import Toast from "../components/Toast"

const ProfilePage = () => {
  const { user, updateProfile } = useAuth()
  const { t } = useLanguage()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [formData, setFormData] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
    phone_number: user?.phone_number || "",
    date_of_birth: user?.date_of_birth || "",
  })

  const showToast = (message, type) => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 5000)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await updateProfile(formData)

      if (result.success) {
        showToast(result.message, "success")
        setIsEditing(false)
      } else {
        showToast(result.error, "error")
      }
    } catch (error) {
      console.error("Profile update error:", error)
      showToast("Failed to update profile. Please try again.", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      email: user?.email || "",
      phone_number: user?.phone_number || "",
      date_of_birth: user?.date_of_birth || "",
    })
    setIsEditing(false)
  }

  return (
    <div className="min-h-screen bg-base-200 py-8 px-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="max-w-2xl mx-auto">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-content flex items-center justify-center text-2xl font-bold">
                  {user?.first_name?.charAt(0) || user?.username?.charAt(0) || "U"}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {user?.first_name} {user?.last_name}
                  </h2>
                  <p className="text-base-content/70">@{user?.username}</p>
                </div>
              </div>
              <button onClick={() => setIsEditing(!isEditing)} className="btn btn-primary btn-sm" disabled={isLoading}>
                {isEditing ? "Cancel" : "Edit Profile"}
              </button>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">First Name</span>
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="input input-bordered w-full"
                    disabled={!isEditing}
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Last Name</span>
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="input input-bordered w-full"
                    disabled={!isEditing}
                    required
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Email Address</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input input-bordered w-full"
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Phone Number</span>
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  className="input input-bordered w-full"
                  disabled={!isEditing}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Date of Birth</span>
                </label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleInputChange}
                  className="input input-bordered w-full"
                  disabled={!isEditing}
                />
              </div>

              {isEditing && (
                <div className="flex space-x-4">
                  <button type="submit" className="btn btn-primary flex-1" disabled={isLoading}>
                    {isLoading ? <span className="loading loading-spinner loading-sm"></span> : "Save Changes"}
                  </button>
                  <button type="button" onClick={handleCancel} className="btn btn-ghost flex-1">
                    Cancel
                  </button>
                </div>
              )}
            </form>

            {/* Account Stats */}
            <div className="divider"></div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">12</div>
                <div className="text-sm text-base-content/70">Prescriptions</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-secondary">45</div>
                <div className="text-sm text-base-content/70">Vitals Logged</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-accent">3</div>
                <div className="text-sm text-base-content/70">Reports</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
