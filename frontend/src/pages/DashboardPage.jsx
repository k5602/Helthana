"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useLanguage } from "../contexts/LanguageContext"
import { usePrescriptions, useVitals, useEmergency } from "../hooks/useApi"

const DashboardPage = () => {
  const { user } = useAuth()
  const { t } = useLanguage()
  const { getPrescriptions } = usePrescriptions()
  const { getVitals } = useVitals()
  const { sendEmergencyAlert } = useEmergency()

  const [dashboardData, setDashboardData] = useState({
    prescriptions: 0,
    vitals: 0,
    reports: 0,
    lastRefresh: new Date(),
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      // Load prescriptions count
      const prescriptionsResult = await getPrescriptions()
      const vitalsResult = await getVitals()

      setDashboardData({
        prescriptions: prescriptionsResult.success ? prescriptionsResult.data?.length || 0 : 0,
        vitals: vitalsResult.success ? vitalsResult.data?.length || 0 : 0,
        reports: 3, // Mock data
        lastRefresh: new Date(),
      })

      // Mock recent activity
      setRecentActivity([
        {
          id: 1,
          type: "prescription",
          message: "New prescription scanned",
          time: "2 hours ago",
          icon: "📱",
        },
        {
          id: 2,
          type: "vitals",
          message: "Blood pressure logged",
          time: "5 hours ago",
          icon: "📊",
        },
        {
          id: 3,
          type: "report",
          message: "Monthly report generated",
          time: "1 day ago",
          icon: "📄",
        },
      ])
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmergencyAlert = async () => {
    if (!confirm(t("msg.emergency.confirm", "Send emergency alert to your contacts?"))) {
      return
    }

    try {
      let location = {}
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject)
          })
          location = {
            location_lat: position.coords.latitude,
            location_lng: position.coords.longitude,
          }
        } catch (locationError) {
          console.warn("Failed to get location for emergency alert:", locationError)
        }
      }

      const result = await sendEmergencyAlert({
        message: "Emergency alert sent from Health Guide app",
        ...location,
      })

      if (result.success) {
        alert(t("msg.emergency.sent", "Emergency alert sent to your contacts!"))
      } else {
        alert(t("msg.emergency.failed", "Failed to send emergency alert"))
      }
    } catch (error) {
      console.error("Emergency alert failed:", error)
      alert(t("msg.emergency.failed", "Failed to send emergency alert"))
    }
  }

  return (
    <div className="flex h-screen bg-base-200">
      {/* Compact Sidebar */}
      <aside className="flex flex-col items-center w-16 h-screen py-8 overflow-y-auto bg-base-100 border-r border-base-300 shadow-lg">
        <nav className="flex flex-col flex-1 space-y-6">
          <Link
            to="/"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white font-bold text-lg"
            title="Your Health Guide"
          >
            YHG
          </Link>

          <Link
            to="/dashboard"
            className="p-1.5 text-primary bg-primary/10 focus:outline-none transition-colors duration-200 rounded-lg"
            title="Dashboard"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
              />
            </svg>
          </Link>

          <Link
            to="/vitals"
            className="p-1.5 text-base-content/70 hover:text-secondary hover:bg-secondary/10 focus:outline-none transition-colors duration-200 rounded-lg"
            title="Vitals"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
              />
            </svg>
          </Link>

          <Link
            to="/reports"
            className="p-1.5 text-base-content/70 hover:text-accent hover:bg-accent/10 focus:outline-none transition-colors duration-200 rounded-lg"
            title="Reports"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75"
              />
            </svg>
          </Link>

          <Link
            to="/prescriptions"
            className="p-1.5 text-info bg-info/10 focus:outline-none transition-colors duration-200 rounded-lg"
            title="Prescriptions"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5"
              />
            </svg>
          </Link>

          <Link
            to="/emergency"
            className="p-1.5 text-error hover:bg-error/10 focus:outline-none transition-colors duration-200 rounded-lg animate-pulse border border-error/20"
            title="Emergency"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0z"
              />
            </svg>
          </Link>
        </nav>

        <div className="flex flex-col space-y-6">
          <Link to="/profile">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center text-sm font-medium">
              {user?.first_name?.charAt(0) || user?.username?.charAt(0) || "U"}
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-base-content mb-2">
                {t("dashboard.welcome", "Welcome to Your Health Dashboard")}
              </h2>
              <p className="text-base-content/70">
                {t("dashboard.subtitle", "Manage your health with AI-powered tools and smart tracking")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-base-content/50">
                Last updated: {dashboardData.lastRefresh.toLocaleTimeString()}
              </span>
              <button onClick={loadDashboardData} className="btn btn-ghost btn-sm" title="Refresh Dashboard">
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
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{t("dashboard.prescriptions", "Prescriptions")}</h3>
                  <p className="text-3xl font-bold text-primary">{dashboardData.prescriptions}</p>
                  <p className="text-sm text-base-content/60">{t("dashboard.prescriptions.desc", "Total scanned")}</p>
                </div>
                <div className="text-4xl">📱</div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{t("dashboard.vitals", "Vitals Logged")}</h3>
                  <p className="text-3xl font-bold text-secondary">{dashboardData.vitals}</p>
                  <p className="text-sm text-base-content/60">{t("dashboard.vitals.desc", "This month")}</p>
                </div>
                <div className="text-4xl">📊</div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{t("dashboard.reports", "Reports")}</h3>
                  <p className="text-3xl font-bold text-accent">{dashboardData.reports}</p>
                  <p className="text-sm text-base-content/60">{t("dashboard.reports.desc", "Generated")}</p>
                </div>
                <div className="text-4xl">📄</div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{t("dashboard.checkup", "Next Checkup")}</h3>
                  <p className="text-lg font-bold text-info">{t("dashboard.checkup.date", "Jan 15")}</p>
                  <p className="text-sm text-base-content/60">{t("dashboard.checkup.doctor", "Dr. Ahmed")}</p>
                </div>
                <div className="text-4xl">🩺</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold mb-4">{t("actions.title", "Quick Actions")}</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/prescriptions" className="btn btn-primary btn-lg w-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15.75a9.065 9.065 0 0 1-6.23-.957L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.611L5 14.5"
                />
              </svg>
              <span>{t("actions.scan", "Scan Prescription")}</span>
            </Link>

            <Link to="/vitals" className="btn btn-secondary btn-lg w-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
                />
              </svg>
              <span>{t("actions.vitals", "Log Vitals")}</span>
            </Link>

            <Link to="/reports" className="btn btn-accent btn-lg w-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                />
              </svg>
              <span>{t("actions.report", "Generate Report")}</span>
            </Link>

            <button
              onClick={handleEmergencyAlert}
              className="btn btn-error btn-lg w-full animate-pulse shadow-lg border-2 border-error"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
                />
              </svg>
              <span>{t("actions.emergency", "Emergency")}</span>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card bg-base-100 shadow-lg">
          <div className="card-body">
            <h3 className="text-xl font-semibold mb-4">{t("activity.title", "Recent Activity")}</h3>
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <span className="loading loading-spinner loading-lg text-primary"></span>
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-base-200">
                    <div className="text-2xl">{activity.icon}</div>
                    <div className="flex-1">
                      <p className="font-medium">{activity.message}</p>
                      <p className="text-sm text-base-content/60">{activity.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default DashboardPage
