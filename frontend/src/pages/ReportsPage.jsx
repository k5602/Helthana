"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import AuthenticatedLayout from "../components/AuthenticatedLayout"
import { useAuth } from "../contexts/AuthContext"
import { useLanguage } from "../contexts/LanguageContext"
import { useReports } from "../hooks/useApi"
import Toast from "../components/Toast"

export function ReportsPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const { listReports, generate, downloadUrl, loading } = useReports()
  
  const [reports, setReports] = useState([])
  const [toast, setToast] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    try {
  const response = await listReports()
      if (response.success) {
        const data = response.data || []
        const items = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : []
        setReports(items)
      }
    } catch (error) {
      setToast({ message: t('error.loadReports'), type: 'error' })
    }
  }

  const generateReport = async (type) => {
    setIsGenerating(true)
    try {
      const today = new Date()
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(today.getDate() - 30)
      const payload = {
        report_type: type,
        date_from: thirtyDaysAgo.toISOString().slice(0, 10),
        date_to: today.toISOString().slice(0, 10),
        include_charts: true,
        include_summary: true,
        language: 'en',
      }
      const response = await generate(payload)
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
      const url = downloadUrl(reportId)
      window.open(url, '_blank')
    } catch (error) {
      setToast({ message: t('error.downloadReport'), type: 'error' })
    }
  }

  return (
    <AuthenticatedLayout>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-base-content mb-2">{t('reports.title')}</h1>
          <p className="text-base-content/70">{t('reports.description')}</p>
        </div>

        {/* Generate Reports Section */}
        <div className="card bg-base-100 shadow-md mb-8">
          <div className="card-body">
            <h2 className="text-xl font-semibold mb-4">{t('reports.generate')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button onClick={() => generateReport('vitals')} disabled={isGenerating} className="btn btn-primary">
                {isGenerating ? <span className="loading loading-spinner"></span> : t('reports.vitalsReport')}
              </button>
              <button onClick={() => generateReport('prescriptions')} disabled={isGenerating} className="btn btn-primary">
                {isGenerating ? <span className="loading loading-spinner"></span> : t('reports.prescriptionsReport')}
              </button>
              <button onClick={() => generateReport('comprehensive')} disabled={isGenerating} className="btn btn-primary">
                {isGenerating ? <span className="loading loading-spinner"></span> : t('reports.comprehensiveReport')}
              </button>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="text-xl font-semibold mb-4">{t('reports.myReports')}</h2>
            {loading ? (
              <div className="flex justify-center p-8">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold mb-2">{t('reports.noReports')}</h3>
                <p className="text-base-content/70">{t('reports.generateFirst')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="border border-base-300 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">{report.title}</h3>
                        <p className="text-sm text-base-content/60">
                          {t('reports.generatedOn')}: {new Date(report.created_at || report.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-base-content/60">
                          {t('reports.type')}: {report.report_type || report.type}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => downloadReport(report.id)} className="btn btn-sm btn-outline">
                          {t('reports.download')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

    {/* Toast Notifications */}
    {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
  </AuthenticatedLayout>
  )
}

export default ReportsPage
