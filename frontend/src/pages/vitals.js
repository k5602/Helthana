/**
 * Vitals Page Module
 * Handles vital signs tracking and visualization
 */

import { apiGetVitals, apiCreateVital, apiDeleteVital, apiGetVitalsTrends } from '../api.js';
import { uiShowToast, uiShowLoading, uiHideLoading, uiShowModal, uiHideModal } from '../ui.js';
import { getTranslation } from '../localization.js';

class VitalsPage {
    constructor() {
        this.vitals = [];
        this.trends = null;
        this.currentChart = null;
    }

    /**
     * Initialize vitals page
     */
    async init() {
        console.log('Initializing Vitals Page');
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Load vitals data
        await this.loadVitals();
        
        // Load trends data
        await this.loadTrends();
    }

    /**
     * Set up event listeners for vitals interactions
     */
    setupEventListeners() {
        // Add vital button
        const addVitalBtn = document.getElementById('add-vital-btn');
        if (addVitalBtn) {
            addVitalBtn.addEventListener('click', () => this.openAddVitalModal());
        }

        // Vital form submission
        const vitalForm = document.getElementById('vital-form');
        if (vitalForm) {
            vitalForm.addEventListener('submit', (e) => this.handleVitalSubmit(e));
        }

        // Refresh vitals
        const refreshBtn = document.getElementById('refresh-vitals');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadVitals());
        }

        // Chart type selector
        const chartTypeSelect = document.getElementById('chart-type-select');
        if (chartTypeSelect) {
            chartTypeSelect.addEventListener('change', (e) => this.updateChart(e.target.value));
        }

        // Date range selector
        const dateRangeSelect = document.getElementById('date-range-select');
        if (dateRangeSelect) {
            dateRangeSelect.addEventListener('change', () => this.loadTrends());
        }
    }

    /**
     * Load vitals from API
     */
    async loadVitals() {
        try {
            uiShowLoading('vitals-list');
            
            this.vitals = await apiGetVitals();
            this.renderVitals();
            
        } catch (error) {
            console.error('Failed to load vitals:', error);
            uiShowToast(getTranslation('vitals.loadError'), 'error');
        } finally {
            uiHideLoading('vitals-list');
        }
    }

    /**
     * Load vitals trends for charts
     */
    async loadTrends() {
        try {
            const dateRange = document.getElementById('date-range-select')?.value || '30';
            this.trends = await apiGetVitalsTrends(dateRange);
            this.renderChart();
            
        } catch (error) {
            console.error('Failed to load vitals trends:', error);
            uiShowToast(getTranslation('vitals.trendsError'), 'error');
        }
    }

    /**
     * Render vitals list
     */
    renderVitals() {
        const container = document.getElementById('vitals-list');
        if (!container) return;

        if (this.vitals.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-6xl mb-4">📊</div>
                    <h3 class="text-lg font-semibold mb-2" data-i18n="vitals.noVitals">
                        ${getTranslation('vitals.noVitals')}
                    </h3>
                    <p class="text-base-content/60 mb-4" data-i18n="vitals.addFirst">
                        ${getTranslation('vitals.addFirst')}
                    </p>
                    <button class="btn btn-primary" onclick="document.getElementById('add-vital-btn').click()">
                        <span data-i18n="vitals.addNow">${getTranslation('vitals.addNow')}</span>
                    </button>
                </div>
            `;
            return;
        }

        const vitalsHTML = this.vitals.map(vital => `
            <div class="card bg-base-100 shadow-md">
                <div class="card-body">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <h3 class="card-title text-lg">${this.getVitalTypeLabel(vital.vital_type)}</h3>
                            <p class="text-2xl font-bold text-primary">${vital.value} ${this.getVitalUnit(vital.vital_type)}</p>
                            <p class="text-sm text-base-content/60">${vital.recorded_at || ''}</p>
                            ${vital.notes ? `<p class="text-sm text-base-content/70 mt-1">${vital.notes}</p>` : ''}
                        </div>
                        <div class="dropdown dropdown-end">
                            <div tabindex="0" role="button" class="btn btn-ghost btn-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
                                </svg>
                            </div>
                            <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
                                <li><a onclick="vitalsPage.editVital(${vital.id})">
                                    <span data-i18n="common.edit">${getTranslation('common.edit')}</span>
                                </a></li>
                                <li><a onclick="vitalsPage.deleteVital(${vital.id})" class="text-error">
                                    <span data-i18n="common.delete">${getTranslation('common.delete')}</span>
                                </a></li>
                            </ul>
                        </div>
                    </div>
                    <div class="card-actions justify-end mt-3">
                        <div class="badge ${this.getVitalStatusBadge(vital.value, vital.vital_type)}">
                            ${this.getVitalStatus(vital.value, vital.vital_type)}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = vitalsHTML;
    }

    /**
     * Render vitals chart
     */
    renderChart() {
        const chartContainer = document.getElementById('vitals-chart');
        if (!chartContainer || !this.trends) return;

        // Simple chart implementation (placeholder for now)
        // In a real implementation, you'd use a charting library like Chart.js
        const chartType = document.getElementById('chart-type-select')?.value || 'blood_pressure';
        const chartData = this.trends[chartType] || [];

        if (chartData.length === 0) {
            chartContainer.innerHTML = `
                <div class="text-center py-8 text-base-content/60">
                    <p data-i18n="vitals.noChartData">${getTranslation('vitals.noChartData')}</p>
                </div>
            `;
            return;
        }

        // Simple bar chart representation
        const maxValue = Math.max(...chartData.map(d => d.value));
        const chartHTML = chartData.map(data => {
            const height = (data.value / maxValue) * 100;
            return `
                <div class="flex flex-col items-center">
                    <div class="bg-primary rounded-t" style="height: ${height}px; width: 20px; min-height: 10px;"></div>
                    <span class="text-xs mt-1">${data.date}</span>
                    <span class="text-xs font-semibold">${data.value}</span>
                </div>
            `;
        }).join('');

        chartContainer.innerHTML = `
            <div class="flex items-end justify-center gap-2 h-40">
                ${chartHTML}
            </div>
        `;
    }

    /**
     * Open add vital modal
     */
    openAddVitalModal() {
        // Reset form
        const form = document.getElementById('vital-form');
        if (form) {
            form.reset();
        }

        uiShowModal('add-vital-modal');
    }

    /**
     * Handle vital form submission
     */
    async handleVitalSubmit(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const vitalData = {
            vital_type: formData.get('vital_type'),
            value: parseFloat(formData.get('value')),
            notes: formData.get('notes') || '',
            recorded_at: formData.get('recorded_at') || new Date().toISOString()
        };

        try {
            await apiCreateVital(vitalData);
            uiShowToast(getTranslation('vitals.addSuccess'), 'success');
            uiHideModal('add-vital-modal');
            
            // Reload vitals and trends
            await this.loadVitals();
            await this.loadTrends();
            
        } catch (error) {
            console.error('Failed to add vital:', error);
            uiShowToast(getTranslation('vitals.addError'), 'error');
        }
    }

    /**
     * Edit vital
     */
    editVital(id) {
        const vital = this.vitals.find(v => v.id === id);
        if (vital) {
            // Populate form with vital data
            const form = document.getElementById('vital-form');
            if (form) {
                form.vital_type.value = vital.vital_type;
                form.value.value = vital.value;
                form.notes.value = vital.notes || '';
                form.recorded_at.value = vital.recorded_at;
            }
            
            uiShowModal('add-vital-modal');
        }
    }

    /**
     * Delete vital
     */
    async deleteVital(id) {
        if (!confirm(getTranslation('vitals.confirmDelete'))) {
            return;
        }

        try {
            await apiDeleteVital(id);
            uiShowToast(getTranslation('vitals.deleteSuccess'), 'success');
            await this.loadVitals();
            await this.loadTrends();
        } catch (error) {
            console.error('Failed to delete vital:', error);
            uiShowToast(getTranslation('vitals.deleteError'), 'error');
        }
    }

    /**
     * Update chart display
     */
    updateChart(chartType) {
        this.renderChart();
    }

    /**
     * Get vital type label
     */
    getVitalTypeLabel(type) {
        const labels = {
            'blood_pressure': getTranslation('vitals.bloodPressure'),
            'heart_rate': getTranslation('vitals.heartRate'),
            'temperature': getTranslation('vitals.temperature'),
            'weight': getTranslation('vitals.weight'),
            'blood_sugar': getTranslation('vitals.bloodSugar')
        };
        return labels[type] || type;
    }

    /**
     * Get vital unit
     */
    getVitalUnit(type) {
        const units = {
            'blood_pressure': 'mmHg',
            'heart_rate': 'bpm',
            'temperature': '°C',
            'weight': 'kg',
            'blood_sugar': 'mg/dL'
        };
        return units[type] || '';
    }

    /**
     * Get vital status
     */
    getVitalStatus(value, type) {
        // Simple status logic (should be more sophisticated in real app)
        if (type === 'blood_pressure') {
            const [systolic] = value.toString().split('/').map(Number);
            if (systolic < 120) return getTranslation('vitals.normal');
            if (systolic < 140) return getTranslation('vitals.elevated');
            return getTranslation('vitals.high');
        }
        return getTranslation('vitals.normal');
    }

    /**
     * Get vital status badge class
     */
    getVitalStatusBadge(value, type) {
        const status = this.getVitalStatus(value, type);
        if (status === getTranslation('vitals.high')) return 'badge-error';
        if (status === getTranslation('vitals.elevated')) return 'badge-warning';
        return 'badge-success';
    }

    /**
     * Cleanup vitals page
     */
    destroy() {
        // Cleanup any chart instances or intervals
    }
}

// Export for use in main.js
export { VitalsPage };