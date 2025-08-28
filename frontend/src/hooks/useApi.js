"use client"

import { useState, useCallback } from "react"
import { apiClient, withRetry, handleApiResponse } from "../services/apiClient"

export const useApi = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const request = useCallback(async (apiCall) => {
    setLoading(true)
    setError(null)

    try {
      const result = await withRetry(apiCall)
      setLoading(false)
      return { success: true, data: result }
    } catch (err) {
      setError(err.message)
      setLoading(false)
      return { success: false, error: err.message }
    }
  }, [])

  return { loading, error, request }
}

// Prescription API hooks
export const usePrescriptions = () => {
  const { loading, error, request } = useApi()

  const getPrescriptions = useCallback(
    (filters = {}) => {
      return request(async () => {
        const params = new URLSearchParams()
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value)
        })
        const queryString = params.toString()
        const endpoint = queryString ? `/prescriptions/?${queryString}` : "/prescriptions/"
        return apiClient.request(endpoint).then(handleApiResponse)
      })
    },
    [request],
  )

  const uploadPrescription = useCallback(
    (formData) => {
      return request(async () => {
        return apiClient.uploadPrescription(formData)
      })
    },
    [request],
  )

  return { loading, error, getPrescriptions, uploadPrescription }
}

// Vitals API hooks
export const useVitals = () => {
  const { loading, error, request } = useApi()

  const getVitals = useCallback(
    (filters = {}) => {
      return request(async () => {
        return apiClient.getVitals(filters)
      })
    },
    [request],
  )

  const addVital = useCallback(
    (vitalData) => {
      return request(async () => {
        return apiClient.addVital(vitalData)
      })
    },
    [request],
  )

  return { loading, error, getVitals, addVital }
}

// Emergency API hooks
export const useEmergency = () => {
  const { loading, error, request } = useApi()

  const sendEmergencyAlert = useCallback(
    (alertData) => {
      return request(async () => {
        return apiClient.sendEmergencyAlert(alertData)
      })
    },
    [request],
  )

  return { loading, error, sendEmergencyAlert }
}
