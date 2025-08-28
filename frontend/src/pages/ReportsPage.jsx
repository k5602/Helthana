"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { useLanguage } from "../contexts/LanguageContext"
import { useApi } from "../hooks/useApi"
import Toast from "../components/Toast"

export function ReportsPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const { apiCall, loading } = useApi()
  
  const [reports, setReports] = useState([])
  const [toast, setToast] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    try {
      const response = await apiCall('/reports')
      if (response.success) {
        setReports(response.data || [])
      }
    } catch (error) {
      setToast({ message: t('error.loadReports'), type: 'error' })
    }
  }

  const generateReport = async (type) => {
    setIsGenerating(true)
    try {
      const response = await apiCall('/reports/generate', {
        method: 'POST',
        data: { type, userId: user.id }
      })
      
      if (response.success) {
        setToast({ message: t('reports.generated'), type: 'success' })
        await loadReports()
      }
    } catch (error) {
      setToast({ message: t('error.generateReport'), type: 'error' })
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadReport = async (reportId) => {
    try {
      const response = await apiCall(`/reports/${reportId}/download`)
      if (response.success && response.url) {
        window.open(response.url, '_blank')
      }
    } catch (error) {
      setToast({ message: t('error.downloadReport'), type: 'error' })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('reports.title')}
        </h1>
        <p className="text-gray-600">
          {t('reports.description')}
        </p>
      </div>

      {/* Generate Reports Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">{t('reports.generate')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => generateReport('vitals')}
            disabled={isGenerating}
            className="btn btn-primary"
          >
            {isGenerating ? 
              <span className="loading loading-spinner"></span> : 
              t('reports.vitalsReport')
            }
          </button>
          <button
            onClick={() => generateReport('prescriptions')}
            disabled={isGenerating}
            className="btn btn-primary"
          >
            {isGenerating ? 
              <span className="loading loading-spinner"></span> : 
              t('reports.prescriptionsReport')
            }
          </button>
          <button
            onClick={() => generateReport('comprehensive')}
            disabled={isGenerating}
            className="btn btn-primary"
          >
            {isGenerating ? 
              <span className="loading loading-spinner"></span> : 
              t('reports.comprehensiveReport')
            }
          </button>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">{t('reports.myReports')}</h2>
        
        {loading ? (
          <div className="flex justify-center p-8">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">{t('reports.noReports')}</h3>
            <p className="text-gray-600">{t('reports.generateFirst')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{report.title}</h3>
                    <p className="text-sm text-gray-600">
                      {t('reports.generatedOn')}: {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      {t('reports.type')}: {report.type}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => downloadReport(report.id)}
                      className="btn btn-sm btn-outline"
                    >
                      {t('reports.download')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

export default ReportsPage
