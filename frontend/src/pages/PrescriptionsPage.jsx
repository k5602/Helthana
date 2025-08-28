"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { useLanguage } from "../contexts/LanguageContext"
import { useApi } from "../hooks/useApi"
import Toast from "../components/Toast"
import { PrescriptionScanner } from "../components/PrescriptionScanner"
import { PrescriptionCard } from "../components/PrescriptionCard"

export function PrescriptionsPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const { apiCall, loading } = useApi()

  const [prescriptions, setPrescriptions] = useState([])
  const [showScanner, setShowScanner] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    loadPrescriptions()
  }, [])

  const loadPrescriptions = async () => {
    try {
      const response = await apiCall("/api/prescriptions", "GET")
      setPrescriptions(response.data || [])
    } catch (error) {
      console.error("Failed to load prescriptions:", error)
      showToast(t("prescriptions.loadError"), "error")
    }
  }

  const showToast = (message, type = "info") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 5000)
  }

  const handleScanSuccess = async (ocrResult) => {
    try {
      await loadPrescriptions()
      setShowScanner(false)
      showToast(t("prescriptions.scanSuccess"), "success")
    } catch (error) {
      console.error("Failed to handle scan success:", error)
      showToast(t("prescriptions.scanError"), "error")
    }
  }

  const handleDeletePrescription = async (id) => {
    if (!confirm(t("prescriptions.confirmDelete"))) return

    try {
      await apiCall(`/api/prescriptions/${id}`, "DELETE")
      setPrescriptions((prev) => prev.filter((p) => p.id !== id))
      showToast(t("prescriptions.deleteSuccess"), "success")
    } catch (error) {
      console.error("Failed to delete prescription:", error)
      showToast(t("prescriptions.deleteError"), "error")
    }
  }

  return (
    <div className="min-h-screen bg-base-200">
      {/* Header */}
      <div className="bg-base-100 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="breadcrumbs text-sm mb-2">
            <ul>
              <li>
                <a href="/dashboard" className="text-primary hover:text-primary-focus">
                  {t("sidebar.dashboard")}
                </a>
              </li>
              <li className="text-base-content/70">{t("sidebar.prescriptions")}</li>
            </ul>
          </div>
          <h1 className="text-3xl font-bold text-base-content mb-2">{t("prescriptions.title")}</h1>
          <p className="text-base-content/70">{t("prescriptions.subtitle")}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button onClick={() => setShowScanner(true)} className="btn btn-primary">
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
                d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
              />
            </svg>
            {t("prescriptions.scan.new")}
          </button>

          <button
            onClick={() => showToast(t("prescriptions.manualEntry.comingSoon"), "info")}
            className="btn btn-outline btn-secondary"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {t("prescriptions.add.manual")}
          </button>
        </div>

        {/* Prescriptions Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💊</div>
            <h3 className="text-2xl font-semibold mb-2">{t("prescriptions.empty.title")}</h3>
            <p className="text-base-content/60 mb-6">{t("prescriptions.empty.desc")}</p>
            <button onClick={() => setShowScanner(true)} className="btn btn-primary">
              {t("prescriptions.scan.first")}
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {prescriptions.map((prescription) => (
              <PrescriptionCard
                key={prescription.id}
                prescription={prescription}
                onDelete={handleDeletePrescription}
                onEdit={(id) => showToast(t("prescriptions.editFeature.comingSoon"), "info")}
                onView={(id) => showToast(t("prescriptions.viewFeature.comingSoon"), "info")}
              />
            ))}
          </div>
        )}
      </div>

      {/* Prescription Scanner Modal */}
      {showScanner && (
        <PrescriptionScanner
          onClose={() => setShowScanner(false)}
          onSuccess={handleScanSuccess}
          onError={(error) => showToast(error, "error")}
        />
      )}

      {/* Toast Notifications */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

export default PrescriptionsPage
