"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { useLanguage } from "../contexts/LanguageContext"
import Toast from "../components/Toast"
import { EmergencyContactModal } from "../components/EmergencyContactModal"
import AuthenticatedLayout from "../components/AuthenticatedLayout"

export function EmergencyPage() {
  const { user } = useAuth()
  const { t } = useLanguage()

  const [emergencyContacts, setEmergencyContacts] = useState([])
  const [showContactModal, setShowContactModal] = useState(false)
  const [toast, setToast] = useState(null)
  const [medicalInfo, setMedicalInfo] = useState({
    conditions: [],
    medications: [],
  })

  useEffect(() => {
    loadEmergencyContacts()
    loadMedicalInfo()
  }, [])

  const loadEmergencyContacts = () => {
    try {
      const contacts = localStorage.getItem("emergency-contacts")
      setEmergencyContacts(contacts ? JSON.parse(contacts) : [])
    } catch (error) {
      console.error("Failed to load emergency contacts:", error)
    }
  }

  const loadMedicalInfo = () => {
    try {
      // Mock medical information - in a real app, this would come from API
      setMedicalInfo({
        conditions: ["No major medical conditions recorded"],
        medications: ["No current medications recorded"],
      })
    } catch (error) {
      console.error("Failed to load medical info:", error)
    }
  }

  const showToast = (message, type = "info") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 5000)
  }

  const callEmergency = () => {
    if (confirm(t("emergency.call.confirm"))) {
      window.location.href = "tel:111"
    }
  }

  const shareLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          const locationUrl = `https://maps.google.com/maps?q=${lat},${lng}`

          const message = `EMERGENCY: I need help! My current location is: ${locationUrl}`

          if (navigator.share) {
            navigator.share({ title: "Emergency Location", text: message, url: locationUrl })
          } else {
            navigator.clipboard.writeText(message).then(() => {
              showToast(t("emergency.location.copied"), "success")
            })
          }
        },
        (error) => {
          showToast(t("emergency.location.error"), "error")
        },
      )
    } else {
      showToast(t("emergency.geo.unsupported"), "error")
    }
  }

  const sendMedicalAlert = () => {
    showToast(t("emergency.medical.sent"), "success")
  }

  const handleAddContact = (contactData) => {
    const newContact = {
      id: Date.now().toString(),
      ...contactData,
    }

    const updatedContacts = [...emergencyContacts, newContact]
    setEmergencyContacts(updatedContacts)
    localStorage.setItem("emergency-contacts", JSON.stringify(updatedContacts))
  setShowContactModal(false)
  showToast(t("emergency.contacts.added"), "success")
  }

  const deleteContact = (id) => {
    if (confirm(t("emergency.contacts.confirmDelete"))) {
      const updatedContacts = emergencyContacts.filter((c) => c.id !== id)
      setEmergencyContacts(updatedContacts)
      localStorage.setItem("emergency-contacts", JSON.stringify(updatedContacts))
      showToast(t("emergency.contacts.deleted"), "success")
    }
  }

  return (
    <AuthenticatedLayout>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-error/10 text-error flex items-center justify-center">
            <span className="text-xl">🚨</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t("emergency.title")}</h1>
            <p className="text-base-content/60">{t("emergency.call.desc")}</p>
          </div>
        </div>
      </div>

      <div>
        {/* Emergency Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Call Emergency Services */}
          <div className="card bg-error text-error-content shadow-xl">
            <div className="card-body text-center">
              <div className="text-6xl mb-4">🚨</div>
              <h2 className="card-title justify-center mb-2">{t("emergency.call.title")}</h2>
              <p className="mb-4">{t("emergency.call.desc")}</p>
              <button onClick={callEmergency} className="btn btn-error-content btn-lg w-full text-error font-bold">
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
                {t("emergency.call.button")}
              </button>
            </div>
          </div>

          {/* Share Location */}
          <div className="card bg-warning text-warning-content shadow-xl">
            <div className="card-body text-center">
              <div className="text-6xl mb-4">📍</div>
              <h2 className="card-title justify-center mb-2">{t("emergency.location.title")}</h2>
              <p className="mb-4">{t("emergency.location.desc")}</p>
              <button onClick={shareLocation} className="btn btn-warning-content btn-lg w-full text-warning font-bold">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                  />
                </svg>
                {t("emergency.location.button")}
              </button>
            </div>
          </div>

          {/* Medical Alert */}
          <div className="card bg-info text-info-content shadow-xl">
            <div className="card-body text-center">
              <div className="text-6xl mb-4">🏥</div>
              <h2 className="card-title justify-center mb-2">{t("emergency.medical.title")}</h2>
              <p className="mb-4">{t("emergency.medical.desc")}</p>
              <button onClick={sendMedicalAlert} className="btn btn-info-content btn-lg w-full text-info font-bold">
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
                    d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                  />
                </svg>
                {t("emergency.medical.button")}
              </button>
            </div>
          </div>
        </div>

        {/* Emergency Contacts */}
  <div className="card bg-base-100 shadow-xl mb-8">
          <div className="card-body">
            <h2 className="card-title mb-4">{t("emergency.contacts.title")}</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {emergencyContacts.length === 0 ? (
                <div className="col-span-full text-center text-base-content/60 py-8">
                  {t("emergency.contacts.empty")}
                </div>
              ) : (
                emergencyContacts.map((contact) => (
                  <div key={contact.id} className="card bg-base-200 compact">
                    <div className="card-body">
                      <h4 className="font-semibold">{contact.name}</h4>
                      <p className="text-sm text-base-content/70 capitalize">{contact.relationship}</p>
                      <div className="flex justify-between items-center mt-2">
                        <a href={`tel:${contact.phone}`} className="btn btn-sm btn-primary">
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
                              d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
                            />
                          </svg>
                          {t("emergency.contacts.call")}
                        </a>
                        <button onClick={() => deleteContact(contact.id)} className="btn btn-sm btn-ghost text-error">
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
                              d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="divider"></div>
            <button onClick={() => setShowContactModal(true)} className="btn btn-primary">
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
              {t("emergency.contacts.add")}
            </button>
          </div>
        </div>

        {/* Medical Information */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title mb-4">{t("emergency.medical.info.title")}</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">{t("emergency.medical.conditions")}</h3>
                <div className="space-y-1 text-sm">
                  {medicalInfo.conditions.map((condition, index) => (
                    <div key={index}>• {condition}</div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">{t("emergency.medical.medications")}</h3>
                <div className="space-y-1 text-sm">
                  {medicalInfo.medications.map((medication, index) => (
                    <div key={index}>• {medication}</div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => showToast("Medical information update feature coming soon!", "info")}
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
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                  />
                </svg>
                {t("emergency.medical.update")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Contact Modal */}
      {showContactModal && (
        <EmergencyContactModal onClose={() => setShowContactModal(false)} onSubmit={handleAddContact} />
      )}

      {/* Toast Notifications */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AuthenticatedLayout>
  )
}

export default EmergencyPage
