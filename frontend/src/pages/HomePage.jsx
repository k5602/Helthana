"use client"

import { Link } from "react-router-dom"
import { useLanguage } from "../contexts/LanguageContext"
import { useAuth } from "../contexts/AuthContext"
import { useEmergency } from "../hooks/useApi"

const HomePage = () => {
  const { t } = useLanguage()
  const { isAuthenticated } = useAuth()
  const { sendEmergencyAlert } = useEmergency()

  const handleEmergencyAlert = async () => {
    if (!confirm(t("msg.emergency.confirm", "Send emergency alert to your contacts?"))) {
      return
    }

    try {
      let location = {}
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 10000,
              maximumAge: 300000,
              enableHighAccuracy: false,
            })
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
    <div className="hero min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 px-4">
      <div className="hero-content text-center w-full">
        <div className="max-w-4xl w-full">
          <div className="mb-6 sm:mb-8">
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-primary"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15.75a9.065 9.065 0 0 1-6.23-.957L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.611L5 14.5"
                    />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-success rounded-full flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    className="w-3 h-3 sm:w-4 sm:h-4 text-white"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent leading-tight">
            {t("hero.title")}
          </h1>

          <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 text-base-content/80 max-w-3xl mx-auto leading-relaxed px-2">
            {t("hero.subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-8 sm:mb-12 px-4">
            <Link
              to={isAuthenticated ? "/dashboard" : "/signup"}
              className="btn btn-primary btn-md sm:btn-lg text-sm sm:text-lg px-6 sm:px-8 w-full sm:w-auto"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-5 h-5 sm:w-6 sm:h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5a2.25 2.25 0 0 0 2.25-2.25m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5m-18 0h18"
                />
              </svg>
              <span>{t("hero.cta.primary")}</span>
            </Link>
            <button
              onClick={handleEmergencyAlert}
              className="btn btn-outline btn-md sm:btn-lg text-sm sm:text-lg px-6 sm:px-8 w-full sm:w-auto"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-5 h-5 sm:w-6 sm:h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
                />
              </svg>
              <span>{t("hero.cta.secondary")}</span>
            </button>
          </div>

          {/* Stats */}
          <div className="stats stats-vertical sm:stats-horizontal shadow-lg bg-base-100 w-full max-w-4xl mx-auto">
            <div className="stat text-center p-4 sm:p-6">
              <div className="stat-figure text-primary mb-2 sm:mb-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="w-6 h-6 sm:w-8 sm:h-8 mx-auto sm:mx-0"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15.75a9.065 9.065 0 0 1-6.23-.957L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.611L5 14.5"
                  />
                </svg>
              </div>
              <div className="stat-title text-xs sm:text-sm">{t("stats.scanner.title")}</div>
              <div className="stat-value text-primary text-2xl sm:text-3xl lg:text-4xl">{t("stats.scanner.value")}</div>
              <div className="stat-desc text-xs sm:text-sm">{t("stats.scanner.desc")}</div>
            </div>

            <div className="stat text-center p-4 sm:p-6">
              <div className="stat-figure text-secondary mb-2 sm:mb-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="w-6 h-6 sm:w-8 sm:h-8 mx-auto sm:mx-0"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
                  />
                </svg>
              </div>
              <div className="stat-title text-xs sm:text-sm">{t("stats.vitals.title")}</div>
              <div className="stat-value text-secondary text-2xl sm:text-3xl lg:text-4xl">
                {t("stats.vitals.value")}
              </div>
              <div className="stat-desc text-xs sm:text-sm">{t("stats.vitals.desc")}</div>
            </div>

            <div className="stat text-center p-4 sm:p-6">
              <div className="stat-figure text-accent mb-2 sm:mb-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="w-6 h-6 sm:w-8 sm:h-8 mx-auto sm:mx-0"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.59-.79-1.59-1.78V9.99c0-.97.71-1.77 1.59-1.77h2.24Z"
                  />
                </svg>
              </div>
              <div className="stat-title text-xs sm:text-sm">{t("stats.voice.title")}</div>
              <div className="stat-value text-accent text-2xl sm:text-3xl lg:text-4xl">{t("stats.voice.value")}</div>
              <div className="stat-desc text-xs sm:text-sm">{t("stats.voice.desc")}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
