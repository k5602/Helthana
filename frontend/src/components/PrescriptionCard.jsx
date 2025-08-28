"use client"
import { useLanguage } from "../contexts/LanguageContext"

export function PrescriptionCard({ prescription, onDelete, onEdit, onView }) {
  const { t } = useLanguage()

  return (
    <div className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
      <div className="card-body">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="card-title text-lg">
              {prescription.medication_name || t("prescriptions.unknownMedication")}
            </h3>
            <p className="text-base-content/70">{prescription.dosage || ""}</p>
            <p className="text-sm text-base-content/60">{prescription.doctor_name || ""}</p>
            <p className="text-xs text-base-content/50">
              {prescription.date_prescribed ? new Date(prescription.date_prescribed).toLocaleDateString() : ""}
            </p>
          </div>

          <div className="dropdown dropdown-end">
            <div tabIndex="0" role="button" className="btn btn-ghost btn-sm">
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
                  d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"
                />
              </svg>
            </div>
            <ul tabIndex="0" className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
              <li>
                <button onClick={() => onView(prescription.id)}>{t("common.view")}</button>
              </li>
              <li>
                <button onClick={() => onEdit(prescription.id)}>{t("common.edit")}</button>
              </li>
              <li>
                <button onClick={() => onDelete(prescription.id)} className="text-error hover:bg-error/10">
                  {t("common.delete")}
                </button>
              </li>
            </ul>
          </div>
        </div>

        {prescription.image_url && (
          <div className="mt-3">
            <img
              src={prescription.image_url || "/placeholder.svg"}
              alt={t("prescriptions.prescriptionImage")}
              className="w-full h-32 object-cover rounded-lg"
            />
          </div>
        )}

        <div className="card-actions justify-end mt-3">
          <div className="badge badge-outline">{prescription.status || t("prescriptions.status.active")}</div>
        </div>
      </div>
    </div>
  )
}
