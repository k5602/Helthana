"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { useLanguage } from "../contexts/LanguageContext"
import { useApi } from "../hooks/useApi"
import Toast from "../components/Toast"
import { VitalsChart } from "../components/VitalsChart"
import { VitalCard } from "../components/VitalCard"
import { VitalEntryModal } from "../components/VitalEntryModal"
import AuthenticatedLayout from "../components/AuthenticatedLayout"

export function VitalsPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const { apiCall, loading } = useApi()

  const [vitals, setVitals] = useState([])
  const [trends, setTrends] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState(null)
  const [chartType, setChartType] = useState("blood_pressure")
  const [dateRange, setDateRange] = useState("30")

  useEffect(() => {
    loadVitals()
    loadTrends()
  }, [dateRange])

  const loadVitals = async () => {
    try {
      const response = await apiCall("/api/vitals", "GET")
      setVitals(response.data || [])
    } catch (error) {
      console.error("Failed to load vitals:", error)
      showToast(t("vitals.loadError"), "error")
    }
  }

  const loadTrends = async () => {
    try {
      const response = await apiCall(`/api/vitals/trends?days=${dateRange}`, "GET")
      setTrends(response.data || {})
    } catch (error) {
      console.error("Failed to load trends:", error)
      showToast(t("vitals.trendsError"), "error")
    }
  }

  const showToast = (message, type = "info") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 5000)
  }

  const handleQuickVitalSubmit = async (event) => {
    event.preventDefault()

    const formData = new FormData(event.target)
    const vitalsToSave = []
    const recordedAt = new Date().toISOString()

    const vitalTypes = ["blood_pressure", "heart_rate", "temperature", "weight"]

    for (const type of vitalTypes) {
      const value = formData.get(type)
      if (value && value.trim()) {
        if (!validateVitalValue(type, value)) {
          showToast(t(`vitals.${type}.invalid`), "error")
          return
        }

        vitalsToSave.push({
          vital_type: type,
          value: value,
          notes: formData.get("notes") || "",
          recorded_at: recordedAt,
        })
      }
    }

    if (vitalsToSave.length === 0) {
      showToast(t("vitals.noDataEntered"), "warning")
      return
    }

    try {
      const savePromises = vitalsToSave.map((vital) => apiCall("/api/vitals", "POST", vital))
      await Promise.all(savePromises)

      showToast(t("vitals.quickSaveSuccess"), "success")
      event.target.reset()

      await loadVitals()
      await loadTrends()
    } catch (error) {
      console.error("Failed to save vitals:", error)
      showToast(t("vitals.saveError"), "error")
    }
  }

  const handleDetailedVitalSubmit = async (vitalData) => {
    try {
      await apiCall("/api/vitals", "POST", vitalData)
      showToast(t("vitals.addSuccess"), "success")
      setShowModal(false)
      await loadVitals()
      await loadTrends()
    } catch (error) {
      console.error("Failed to add vital:", error)
      showToast(t("vitals.addError"), "error")
    }
  }

  const handleDeleteVital = async (id) => {
    if (!confirm(t("vitals.confirmDelete"))) return

    try {
      await apiCall(`/api/vitals/${id}`, "DELETE")
      setVitals((prev) => prev.filter((v) => v.id !== id))
      showToast(t("vitals.deleteSuccess"), "success")
      await loadTrends()
    } catch (error) {
      console.error("Failed to delete vital:", error)
      showToast(t("vitals.deleteError"), "error")
    }
  }

  const validateVitalValue = (type, value) => {
    switch (type) {
      case "blood_pressure":
        return /^\d{2,3}\/\d{2,3}$/.test(value)
      case "heart_rate":
        const hr = Number.parseInt(value)
        return hr >= 40 && hr <= 200
      case "temperature":
        const temp = Number.parseFloat(value)
        return temp >= 30 && temp <= 45
      case "weight":
        const weight = Number.parseFloat(value)
        return weight >= 20 && weight <= 300
      default:
        return true
    }
  }

  const exportChart = () => {
    if (!trends || !trends[chartType]) {
      showToast(t("vitals.noDataToExport"), "warning")
      return
    }

    const data = trends[chartType]
    const csvContent = generateCSV(data, chartType)

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `vitals_${chartType}_${dateRange}days.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    showToast(t("vitals.exportSuccess"), "success")
  }

  const generateCSV = (data, type) => {
    const headers = ["Date", getVitalTypeLabel(type), "Unit"]
    const unit = getVitalUnit(type)

    const rows = data.map((item) => [item.date, item.value, unit])

    return [headers, ...rows].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n")
  }

  const getVitalTypeLabel = (type) => {
    const labels = {
      blood_pressure: t("vitals.bloodPressure"),
      heart_rate: t("vitals.heartRate"),
      temperature: t("vitals.temperature"),
      weight: t("vitals.weight"),
      blood_sugar: t("vitals.bloodSugar"),
    }
    return labels[type] || type
  }

  const getVitalUnit = (type) => {
    const units = {
      blood_pressure: "mmHg",
      heart_rate: "bpm",
      temperature: "°C",
      weight: "kg",
      blood_sugar: "mg/dL",
    }
    return units[type] || ""
  }

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-base-200">
      {/* Header */}
      <div className="bg-base-100 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="breadcrumbs text-sm mb-2">
            <ul>
              <li>
                <a href="/dashboard" className="text-primary hover:text-primary-focus">
                  {t("nav.dashboard")}
                </a>
              </li>
              <li className="text-base-content/70">{t("vitals.title")}</li>
            </ul>
          </div>
          <h1 className="text-3xl font-bold text-base-content mb-2">{t("vitals.title")}</h1>
          <p className="text-base-content/70">{t("vitals.subtitle")}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Quick Log Form */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title">{t("vitals.log.title")}</h2>
              <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                {t("vitals.add.detailed")}
              </button>
            </div>

            <form onSubmit={handleQuickVitalSubmit} className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">{t("vitals.blood_pressure")}</span>
                  <span className="label-text-alt text-info">mmHg</span>
                </label>
                <input
                  type="text"
                  placeholder="120/80"
                  className="input input-bordered"
                  name="blood_pressure"
                  pattern="[0-9]{2,3}/[0-9]{2,3}"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">{t("vitals.heart_rate")}</span>
                  <span className="label-text-alt text-info">BPM</span>
                </label>
                <input
                  type="number"
                  placeholder="75"
                  className="input input-bordered"
                  name="heart_rate"
                  min="40"
                  max="200"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">{t("vitals.temperature")}</span>
                  <span className="label-text-alt text-info">°C</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="36.5"
                  className="input input-bordered"
                  name="temperature"
                  min="30"
                  max="45"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">{t("vitals.weight")}</span>
                  <span className="label-text-alt text-info">kg</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="70.5"
                  className="input input-bordered"
                  name="weight"
                  min="20"
                  max="300"
                />
              </div>

              <div className="form-control md:col-span-2 lg:col-span-4">
                <label className="label">
                  <span className="label-text">{t("vitals.notes")}</span>
                </label>
                <textarea
                  name="notes"
                  className="textarea textarea-bordered"
                  placeholder={t("vitals.placeholder.notes")}
                  rows="2"
                />
              </div>

              <div className="form-control md:col-span-2 lg:col-span-4">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? (
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
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  )}
                  {t("vitals.log.save")}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Chart Controls */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <h3 className="card-title">{t("vitals.trends.title")}</h3>
              <div className="flex gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">{t("vitals.chart.type")}</span>
                  </label>
                  <select
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value)}
                    className="select select-bordered select-sm"
                  >
                    <option value="blood_pressure">{t("vitals.blood_pressure")}</option>
                    <option value="heart_rate">{t("vitals.heart_rate")}</option>
                    <option value="temperature">{t("vitals.temperature")}</option>
                    <option value="weight">{t("vitals.weight")}</option>
                  </select>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">{t("vitals.chart.period")}</span>
                  </label>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="select select-bordered select-sm"
                  >
                    <option value="7">{t("vitals.period.week")}</option>
                    <option value="30">{t("vitals.period.month")}</option>
                    <option value="90">{t("vitals.period.quarter")}</option>
                    <option value="365">{t("vitals.period.year")}</option>
                  </select>
                </div>
                <button onClick={loadTrends} className="btn btn-outline btn-sm self-end">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                    />
                  </svg>
                  {t("common.refresh")}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Vitals Chart */}
        <VitalsChart
          trends={trends}
          chartType={chartType}
          onExport={exportChart}
          getVitalTypeLabel={getVitalTypeLabel}
        />

        {/* Recent Vitals */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h3 className="card-title">{t("vitals.recent.title")}</h3>
              <button onClick={loadVitals} className="btn btn-outline btn-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                  />
                </svg>
                {t("common.refresh")}
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <span className="loading loading-spinner loading-lg text-primary"></span>
              </div>
            ) : vitals.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-2xl font-semibold mb-2">{t("vitals.empty.title")}</h3>
                <p className="text-base-content/60 mb-6">{t("vitals.empty.desc")}</p>
                <button onClick={() => setShowModal(true)} className="btn btn-primary">
                  {t("vitals.addFirst")}
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vitals.map((vital) => (
                  <VitalCard
                    key={vital.id}
                    vital={vital}
                    onDelete={handleDeleteVital}
                    onEdit={(id) => showToast(t("vitals.editFeature.comingSoon"), "info")}
                    getVitalTypeLabel={getVitalTypeLabel}
                    getVitalUnit={getVitalUnit}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Vital Entry Modal */}
      {showModal && (
        <VitalEntryModal
          onClose={() => setShowModal(false)}
          onSubmit={handleDetailedVitalSubmit}
          validateVitalValue={validateVitalValue}
        />
      )}

      {/* Toast Notifications */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </AuthenticatedLayout>
  )
}

export default VitalsPage
