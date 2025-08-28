"use client"

import { useLanguage } from "../contexts/LanguageContext"

export function VitalCard({ vital, onDelete, onEdit, getVitalTypeLabel, getVitalUnit }) {
  const { t } = useLanguage()

  const getVitalStatus = (value, type) => {
    if (type === "blood_pressure") {
      const [systolic] = value.toString().split("/").map(Number)
      if (systolic < 120) return t("vitals.normal")
      if (systolic < 140) return t("vitals.elevated")
      return t("vitals.high")
    }
    return t("vitals.normal")
  }

  const getVitalStatusBadge = (value, type) => {
    const status = getVitalStatus(value, type)
    if (status === t("vitals.high")) return "badge-error"
    if (status === t("vitals.elevated")) return "badge-warning"
    return "badge-success"
  }

  return (
    <div className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
      <div className="card-body">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="card-title text-lg">{getVitalTypeLabel(vital.vital_type)}</h3>
            <p className="text-2xl font-bold text-primary">
              {vital.value} {getVitalUnit(vital.vital_type)}
            </p>
            <p className="text-sm text-base-content/60">
              {vital.recorded_at ? new Date(vital.recorded_at).toLocaleString() : ""}
            </p>
            {vital.notes && <p className="text-sm text-base-content/70 mt-1">{vital.notes}</p>}
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
                <button onClick={() => onEdit(vital.id)}>{t("common.edit")}</button>
              </li>
              <li>
                <button onClick={() => onDelete(vital.id)} className="text-error hover:bg-error/10">
                  {t("common.delete")}
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="card-actions justify-end mt-3">
          <div className={`badge ${getVitalStatusBadge(vital.value, vital.vital_type)}`}>
            {getVitalStatus(vital.value, vital.vital_type)}
          </div>
        </div>
      </div>
    </div>
  )
}
