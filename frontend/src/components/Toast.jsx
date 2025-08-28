"use client"

import { useEffect } from "react"

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 5000)

    return () => clearTimeout(timer)
  }, [onClose])

  const getAlertClass = () => {
    switch (type) {
      case "success":
        return "alert-success"
      case "error":
        return "alert-error"
      case "warning":
        return "alert-warning"
      default:
        return "alert-info"
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`alert ${getAlertClass()} shadow-lg mb-2`}>
        <span>{message}</span>
        <button onClick={onClose} className="btn btn-sm btn-ghost">
          ×
        </button>
      </div>
    </div>
  )
}

export default Toast
