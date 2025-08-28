"use client"

import { useLanguage } from "../contexts/LanguageContext"

export function VitalsChart({ trends, chartType, onExport, getVitalTypeLabel }) {
  const { t } = useLanguage()

  const chartData = trends?.[chartType] || []

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-80 text-base-content/50">
          <div className="text-center">
            <div className="text-4xl mb-4">📈</div>
            <p>{t("vitals.noChartData")}</p>
          </div>
        </div>
      )
    }

    // Simple bar chart representation
    const maxValue = Math.max(...chartData.map((d) => Number.parseFloat(d.value) || 0))
    const minValue = Math.min(...chartData.map((d) => Number.parseFloat(d.value) || 0))
    const range = maxValue - minValue || 1

    return (
      <div className="flex items-end justify-center gap-2 h-80 px-4">
        {chartData.map((data, index) => {
          const value = Number.parseFloat(data.value) || 0
          const height = ((value - minValue) / range) * 200 + 20 // Min height of 20px

          return (
            <div key={index} className="flex flex-col items-center group">
              <div className="tooltip tooltip-top" data-tip={`${data.value} on ${data.date}`}>
                <div
                  className="bg-primary rounded-t hover:bg-primary-focus transition-colors cursor-pointer"
                  style={{ height: `${height}px`, width: "20px", minHeight: "10px" }}
                />
              </div>
              <span className="text-xs mt-1 text-center max-w-[40px] truncate">
                {new Date(data.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
              <span className="text-xs font-semibold">{data.value}</span>
            </div>
          )
        })}
      </div>
    )
  }

  const calculateStats = () => {
    if (chartData.length === 0) {
      return { average: "--", highest: "--", lowest: "--", count: "--" }
    }

    const values = chartData.map((d) => Number.parseFloat(d.value) || 0)
    const average = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
    const highest = Math.max(...values).toString()
    const lowest = Math.min(...values).toString()

    return {
      average,
      highest,
      lowest,
      count: chartData.length.toString(),
    }
  }

  const stats = calculateStats()

  return (
    <div className="card bg-base-100 shadow-lg">
      <div className="card-body">
        <div className="flex justify-between items-center mb-4">
          <h3 className="card-title">
            {getVitalTypeLabel(chartType)} {t("vitals.chart.trend")}
          </h3>
          <button onClick={onExport} className="btn btn-outline btn-sm">
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
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            {t("vitals.export")}
          </button>
        </div>

        <div className="h-80 relative">{renderChart()}</div>

        {/* Chart Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-base-300">
          <div className="stat">
            <div className="stat-title">{t("vitals.stats.average")}</div>
            <div className="stat-value text-primary">{stats.average}</div>
          </div>
          <div className="stat">
            <div className="stat-title">{t("vitals.stats.highest")}</div>
            <div className="stat-value text-secondary">{stats.highest}</div>
          </div>
          <div className="stat">
            <div className="stat-title">{t("vitals.stats.lowest")}</div>
            <div className="stat-value text-accent">{stats.lowest}</div>
          </div>
          <div className="stat">
            <div className="stat-title">{t("vitals.stats.readings")}</div>
            <div className="stat-value text-info">{stats.count}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
