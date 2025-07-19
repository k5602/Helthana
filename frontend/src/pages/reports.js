/**
 * Reports Page Module
 * Handles health report generation and management
 */

import { apiGetReports, apiGenerateReport, apiDownloadReport, apiDeleteReport } from '../api.js';
import { uiShowToast, uiShowLoading, uiHideLoading, uiShowModal, uiHideModal } from '../ui.js';
import { getTranslation } from '../localization.js';
import { aiInsights } from '../ai-insights.js';

class ReportsPage {
    constructor() {
        this.reports = [];
        this.isGenerating = false;
    }

    /**
     * Initialize reports page
     */
    async init() {
        console.log('Initializing Reports Page');
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Load reports data
        await this.loadReports();
    }

    /**
     * Set up event listeners for reports interactions
     */
    setupEventListeners() {
        // Generate report button
        const generateBtn = document.getElementById('generate-report-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.openGenerateModal());
        }

        // Report form submission
        const reportForm = document.getElementById('report-form');
        if (reportForm) {
            reportForm.addEventListener('submit', (e) => this.handleReportGeneration(e));
        }

        // Refresh reports
        const refreshBtn = document.getElementById('refresh-reports');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadReports());
        }
    }

    /**
     * Load reports from API
     */
    async loadReports() {
        try {
            uiShowLoading('reports-list');
            
            this.reports = await apiGetReports();
            this.renderReports();
            
        } catch (error) {
            console.error('Failed to load reports:', error);
            uiShowToast(getTranslation('reports.loadError'), 'error');
        } finally {
            uiHideLoading('reports-list');
        }
    }

    /**
     * Render reports list
     */
    async renderReports() {
        const container = document.getElementById('reports-list');
        if (!container) return;

        if (this.reports.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-6xl mb-4">📄</div>
                    <h3 class="text-lg font-semibold mb-2" data-i18n="reports.noReports">
                        ${getTranslation('reports.noReports')}
                    </h3>
                    <p class="text-base-content/60 mb-4" data-i18n="reports.generateFirst">
                        ${getTranslation('reports.generateFirst')}
                    </p>
                    <button class="btn btn-primary" onclick="document.getElementById('generate-report-btn').click()">
                        <span data-i18n="reports.generateNow">${getTranslation('reports.generateNow')}</span>
                    </button>
                </div>
            `;
            return;
        }

        // Generate AI summaries for reports
        const reportsWithSummaries = await Promise.all(
            this.reports.map(async (report) => {
                const summary = await this.generateReportSummary(report);
                return { ...report, aiSummary: summary };
            })
        );

        const reportsHTML = reportsWithSummaries.map(report => `
            <div class="card bg-base-100 shadow-md">
                <div class="card-body">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <h3 class="card-title text-lg">${this.getReportTypeLabel(report.report_type)}</h3>
                            <p class="text-base-content/70">${report.date_range_start} - ${report.date_range_end}</p>
                            <p class="text-sm text-base-content/60">${getTranslation('reports.generatedOn')}: ${report.generated_at}</p>
                        </div>
                        <div class="dropdown dropdown-end">
                            <div tabindex="0" role="button" class="btn btn-ghost btn-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
                                </svg>
                            </div>
                            <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
                                <li><a onclick="reportsPage.downloadReport(${report.id})">
                                    <span data-i18n="reports.download">${getTranslation('reports.download')}</span>
                                </a></li>
                                <li><a onclick="reportsPage.viewSummary(${report.id})">
                                    <span>🤖 AI Summary</span>
                                </a></li>
                                <li><a onclick="reportsPage.shareReport(${report.id})">
                                    <span data-i18n="reports.share">${getTranslation('reports.share')}</span>
                                </a></li>
                                <li><a onclick="reportsPage.deleteReport(${report.id})" class="text-error">
                                    <span data-i18n="common.delete">${getTranslation('common.delete')}</span>
                                </a></li>
                            </ul>
                        </div>
                    </div>
                    
                    <!-- AI Summary Preview -->
                    ${report.aiSummary ? `
                        <div class="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                            <div class="flex items-center gap-2 mb-2">
                                <span class="text-lg">🤖</span>
                                <span class="font-medium text-primary">AI Summary</span>
                                <span class="badge badge-primary badge-xs">${Math.round(report.aiSummary.confidence * 100)}%</span>
                            </div>
                            <p class="text-sm text-base-content/80 mb-2">${report.aiSummary.overview}</p>
                            <div class="flex flex-wrap gap-1">
                                ${report.aiSummary.keyFindings.slice(0, 2).map(finding => `
                                    <span class="badge badge-outline badge-sm">${finding.substring(0, 30)}${finding.length > 30 ? '...' : ''}</span>
                                `).join('')}
                            </div>
                            <button class="btn btn-xs btn-primary mt-2" onclick="reportsPage.viewSummary(${report.id})">
                                View Full Summary
                            </button>
                        </div>
                    ` : ''}
                    
                    <div class="card-actions justify-between mt-3">
                        <div class="badge badge-outline">${report.status || 'Ready'}</div>
                        <button class="btn btn-primary btn-sm" onclick="reportsPage.downloadReport(${report.id})">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                            <span data-i18n="reports.download">${getTranslation('reports.download')}</span>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = reportsHTML;
    }

    /**
     * Open generate report modal
     */
    openGenerateModal() {
        // Reset form
        const form = document.getElementById('report-form');
        if (form) {
            form.reset();
            
            // Set default date range (last 30 days)
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);
            
            form.date_range_start.value = startDate.toISOString().split('T')[0];
            form.date_range_end.value = endDate.toISOString().split('T')[0];
        }

        uiShowModal('generate-report-modal');
    }

    /**
     * Handle report generation
     */
    async handleReportGeneration(event) {
        event.preventDefault();
        
        if (this.isGenerating) return;
        
        const formData = new FormData(event.target);
        const reportData = {
            report_type: formData.get('report_type'),
            date_range_start: formData.get('date_range_start'),
            date_range_end: formData.get('date_range_end'),
            include_vitals: formData.get('include_vitals') === 'on',
            include_prescriptions: formData.get('include_prescriptions') === 'on',
            include_charts: formData.get('include_charts') === 'on'
        };

        try {
            this.isGenerating = true;
            uiShowLoading('generate-report-btn');
            uiShowToast(getTranslation('reports.generating'), 'info');

            const result = await apiGenerateReport(reportData);
            
            uiShowToast(getTranslation('reports.generateSuccess'), 'success');
            uiHideModal('generate-report-modal');
            
            // Reload reports to show the new one
            await this.loadReports();

        } catch (error) {
            console.error('Failed to generate report:', error);
            uiShowToast(getTranslation('reports.generateError'), 'error');
        } finally {
            this.isGenerating = false;
            uiHideLoading('generate-report-btn');
        }
    }

    /**
     * Download report
     */
    async downloadReport(id) {
        try {
            uiShowToast(getTranslation('reports.downloading'), 'info');
            
            const blob = await apiDownloadReport(id);
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `health-report-${id}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            uiShowToast(getTranslation('reports.downloadSuccess'), 'success');

        } catch (error) {
            console.error('Failed to download report:', error);
            uiShowToast(getTranslation('reports.downloadError'), 'error');
        }
    }

    /**
     * Share report
     */
    async shareReport(id) {
        const report = this.reports.find(r => r.id === id);
        if (!report) return;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${this.getReportTypeLabel(report.report_type)} - ${getTranslation('app.name')}`,
                    text: getTranslation('reports.shareText'),
                    url: window.location.href
                });
            } catch (error) {
                console.log('Share cancelled or failed:', error);
            }
        } else {
            // Fallback: copy link to clipboard
            try {
                await navigator.clipboard.writeText(window.location.href);
                uiShowToast(getTranslation('reports.linkCopied'), 'success');
            } catch (error) {
                console.error('Failed to copy link:', error);
            }
        }
    }

    /**
     * Delete report
     */
    async deleteReport(id) {
        if (!confirm(getTranslation('reports.confirmDelete'))) {
            return;
        }

        try {
            await apiDeleteReport(id);
            uiShowToast(getTranslation('reports.deleteSuccess'), 'success');
            await this.loadReports();
        } catch (error) {
            console.error('Failed to delete report:', error);
            uiShowToast(getTranslation('reports.deleteError'), 'error');
        }
    }

    /**
     * Generate AI summary for a report
     */
    async generateReportSummary(report) {
        try {
            const reportData = {
                id: report.id,
                type: report.report_type,
                dateRange: {
                    start: report.date_range_start,
                    end: report.date_range_end
                },
                generatedAt: report.generated_at
            };

            return await aiInsights.generateReportSummary(reportData);
        } catch (error) {
            console.warn('Failed to generate AI summary for report:', error);
            return null;
        }
    }

    /**
     * View full AI summary for a report
     */
    async viewSummary(reportId) {
        const report = this.reports.find(r => r.id === reportId);
        if (!report) return;

        try {
            // Generate or get cached summary
            const summary = await this.generateReportSummary(report);
            if (!summary) {
                uiShowToast('Unable to generate AI summary at this time', 'error');
                return;
            }

            // Create and show summary modal
            this.showSummaryModal(report, summary);

        } catch (error) {
            console.error('Failed to view report summary:', error);
            uiShowToast('Failed to load AI summary', 'error');
        }
    }

    /**
     * Show AI summary modal
     */
    showSummaryModal(report, summary) {
        // Create modal if it doesn't exist
        let modal = document.getElementById('ai-summary-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'ai-summary-modal';
            modal.className = 'modal';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="modal-box max-w-4xl">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-lg flex items-center gap-2">
                        <span class="text-2xl">🤖</span>
                        AI Health Report Summary
                    </h3>
                    <button class="btn btn-sm btn-circle btn-ghost" onclick="document.getElementById('ai-summary-modal').close()">✕</button>
                </div>
                
                <div class="space-y-6">
                    <!-- Report Info -->
                    <div class="bg-base-200 p-4 rounded-lg">
                        <h4 class="font-semibold mb-2">${this.getReportTypeLabel(report.report_type)}</h4>
                        <p class="text-sm text-base-content/70">${report.date_range_start} - ${report.date_range_end}</p>
                        <div class="flex items-center gap-2 mt-2">
                            <span class="text-xs text-base-content/60">AI Confidence:</span>
                            <div class="w-20 bg-base-300 rounded-full h-2">
                                <div class="bg-primary h-2 rounded-full" style="width: ${summary.confidence * 100}%"></div>
                            </div>
                            <span class="text-xs text-base-content/60">${Math.round(summary.confidence * 100)}%</span>
                        </div>
                    </div>

                    <!-- Overview -->
                    <div>
                        <h4 class="font-semibold mb-2 flex items-center gap-2">
                            <span>📋</span>
                            Overview
                        </h4>
                        <p class="text-base-content/80">${summary.overview}</p>
                    </div>

                    <!-- Key Findings -->
                    <div>
                        <h4 class="font-semibold mb-3 flex items-center gap-2">
                            <span>🔍</span>
                            Key Findings
                        </h4>
                        <div class="grid gap-2">
                            ${summary.keyFindings.map(finding => `
                                <div class="flex items-start gap-2 p-2 bg-info/10 rounded">
                                    <span class="text-info text-sm">•</span>
                                    <span class="text-sm">${finding}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Recommendations -->
                    <div>
                        <h4 class="font-semibold mb-3 flex items-center gap-2">
                            <span>💡</span>
                            AI Recommendations
                        </h4>
                        <div class="grid gap-2">
                            ${summary.recommendations.map(rec => `
                                <div class="flex items-start gap-2 p-2 bg-success/10 rounded">
                                    <span class="text-success text-sm">✓</span>
                                    <span class="text-sm">${rec}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Risk Factors -->
                    ${summary.riskFactors.length > 0 ? `
                        <div>
                            <h4 class="font-semibold mb-3 flex items-center gap-2">
                                <span>⚠️</span>
                                Risk Factors
                            </h4>
                            <div class="grid gap-2">
                                ${summary.riskFactors.map(risk => `
                                    <div class="p-3 bg-warning/10 rounded border border-warning/20">
                                        <div class="flex items-center justify-between mb-1">
                                            <span class="font-medium">${risk.factor}</span>
                                            <span class="badge ${this.getRiskLevelBadgeClass(risk.level)}">${risk.level}</span>
                                        </div>
                                        <p class="text-sm text-base-content/70">${risk.mitigation}</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <!-- Positive Indicators -->
                    ${summary.positiveIndicators.length > 0 ? `
                        <div>
                            <h4 class="font-semibold mb-3 flex items-center gap-2">
                                <span>✅</span>
                                Positive Indicators
                            </h4>
                            <div class="grid gap-2">
                                ${summary.positiveIndicators.map(indicator => `
                                    <div class="flex items-start gap-2 p-2 bg-success/10 rounded">
                                        <span class="text-success text-sm">✓</span>
                                        <span class="text-sm">${indicator}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <!-- Next Steps -->
                    <div>
                        <h4 class="font-semibold mb-3 flex items-center gap-2">
                            <span>🎯</span>
                            Next Steps
                        </h4>
                        <div class="grid gap-2">
                            ${summary.nextSteps.map((step, index) => `
                                <div class="flex items-start gap-3 p-2 bg-base-200 rounded">
                                    <span class="badge badge-primary badge-sm">${index + 1}</span>
                                    <span class="text-sm">${step}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Generated Info -->
                    <div class="text-xs text-base-content/50 text-center pt-4 border-t">
                        AI Summary generated on ${new Date(summary.generatedAt).toLocaleString()}
                    </div>
                </div>

                <div class="modal-action">
                    <button class="btn btn-primary" onclick="reportsPage.downloadReport(${report.id})">
                        Download Report
                    </button>
                    <button class="btn" onclick="document.getElementById('ai-summary-modal').close()">
                        Close
                    </button>
                </div>
            </div>
        `;

        // Show modal
        modal.showModal();
    }

    /**
     * Get CSS class for risk level badge
     */
    getRiskLevelBadgeClass(level) {
        switch (level) {
            case 'high': return 'badge-error';
            case 'moderate': return 'badge-warning';
            case 'low': return 'badge-info';
            default: return 'badge-neutral';
        }
    }

    /**
     * Get report type label
     */
    getReportTypeLabel(type) {
        const labels = {
            'comprehensive': getTranslation('reports.comprehensive'),
            'vitals_summary': getTranslation('reports.vitalsSummary'),
            'prescription_history': getTranslation('reports.prescriptionHistory'),
            'custom': getTranslation('reports.custom')
        };
        return labels[type] || type;
    }

    /**
     * Cleanup reports page
     */
    destroy() {
        this.isGenerating = false;
    }
}

// Export for use in main.js
export { ReportsPage };