/**
 * Reports Page Module
 * Handles health report generation and management
 */

import { apiGetReports, apiGenerateReport, apiDownloadReport, apiDeleteReport } from '../api.js';
import { uiShowToast, uiShowLoading, uiHideLoading, uiShowModal, uiHideModal } from '../ui.js';
import { getTranslation } from '../localization.js';

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
    renderReports() {
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

        const reportsHTML = this.reports.map(report => `
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
                                <li><a onclick="reportsPage.shareReport(${report.id})">
                                    <span data-i18n="reports.share">${getTranslation('reports.share')}</span>
                                </a></li>
                                <li><a onclick="reportsPage.deleteReport(${report.id})" class="text-error">
                                    <span data-i18n="common.delete">${getTranslation('common.delete')}</span>
                                </a></li>
                            </ul>
                        </div>
                    </div>
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