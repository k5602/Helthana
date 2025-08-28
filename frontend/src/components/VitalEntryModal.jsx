"use client"

import { useState } from "react"
import { useLanguage } from "../contexts/LanguageContext"

export function VitalEntryModal({ onClose, onSubmit, validateVitalValue }) {
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    vital_type: "",
    value: "",
    notes: "",
    recorded_at: new Date().toISOString().slice(0, 16),
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!formData.vital_type || !formData.value) {
      alert(t("vitals.requiredFields"))
      return
    }

    if (!validateVitalValue(formData.vital_type, formData.value)) {
      alert(t("vitals.invalidValue"))
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-2xl">
        <h3 className="font-bold text-lg mb-4">{t("vitals.add.detailed.title")}</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">{t("vitals.type")}</span>
              </label>
              <select
                value={formData.vital_type}
                onChange={(e) => handleChange("vital_type", e.target.value)}
                className="select select-bordered"
                required
              >
                <option value="" disabled>
                  {t("vitals.select.type")}
                </option>
                <option value="blood_pressure">{t("vitals.blood_pressure")}</option>
                <option value="heart_rate">{t("vitals.heart_rate")}</option>
                <option value="temperature">{t("vitals.temperature")}</option>
                <option value="weight">{t("vitals.weight")}</option>
                <option value="blood_sugar">{t("vitals.blood_sugar")}</option>
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">{t("vitals.value")}</span>
              </label>
              <input
                type="text"
                value={formData.value}
                onChange={(e) => handleChange("value", e.target.value)}
                className="input input-bordered"
                placeholder={t("vitals.placeholder.value")}
                required
              />
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">{t("vitals.date.time")}</span>
            </label>
            <input
              type="datetime-local"
              value={formData.recorded_at}
              onChange={(e) => handleChange("recorded_at", e.target.value)}
              className="input input-bordered"
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">{t("vitals.notes")}</span>
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              className="textarea textarea-bordered"
              rows="3"
              placeholder={t("vitals.placeholder.notes")}
            />
          </div>

          <div className="modal-action">
            <button type="button" onClick={onClose} className="btn">
              {t("common.cancel")}
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? <span className="loading loading-spinner loading-sm"></span> : null}
              {t("vitals.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
