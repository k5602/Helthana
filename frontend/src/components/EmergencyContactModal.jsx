"use client"

import { useState } from "react"
import { useLanguage } from "../contexts/LanguageContext"

export function EmergencyContactModal({ onClose, onSubmit }) {
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    relationship: "family",
  })

  const handleSubmit = (event) => {
    event.preventDefault()
    if (formData.name && formData.phone) {
      onSubmit(formData)
    }
  }

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">{t("emergency.contacts.add.title")}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">{t("emergency.contacts.name")}</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="input input-bordered"
              required
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">{t("emergency.contacts.phone")}</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className="input input-bordered"
              required
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">{t("emergency.contacts.relationship")}</span>
            </label>
            <select
              value={formData.relationship}
              onChange={(e) => handleChange("relationship", e.target.value)}
              className="select select-bordered"
            >
              <option value="family">{t("emergency.contacts.family")}</option>
              <option value="friend">{t("emergency.contacts.friend")}</option>
              <option value="doctor">{t("emergency.contacts.doctor")}</option>
              <option value="other">{t("emergency.contacts.other")}</option>
            </select>
          </div>
        </form>
        <div className="modal-action">
          <button type="submit" form="contact-form" onClick={handleSubmit} className="btn btn-primary">
            {t("common.save")}
          </button>
          <button onClick={onClose} className="btn">
            {t("common.cancel")}
          </button>
        </div>
      </div>
    </div>
  )
}
