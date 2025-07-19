/**
 * Vitals Page Module
 * Handles vital signs tracking and visualization
 */

import { apiGetVitals, apiCreateVital, apiDeleteVital, apiGetVitalsTrends } from '../api.js';
import { uiShowToast, uiShowLoading, uiHideLoading, uiShowModal, uiHideModal } from '../ui.js';
import { getTranslation } from '../localization.js';
import { aiInsights } from '../ai-insights.js';

class VitalsPage {
    constructor() {
        this.vitals = [];
        this.trends = null;
        this.currentChart = null;
        this.aiInsights = null;
        this.healthGoals = [];
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
        // Add vital button (detailed modal)
        const addVitalBtn = document.getElementById('add-vital-btn');
        if (addVitalBtn) {
            addVitalBtn.addEventListener('click', () => this.openAddVitalModal());
        }

        // Quick vitals form submission
        const vitalsForm = document.getElementById('vitals-form');
        if (vitalsForm) {
            vitalsForm.addEventListener('submit', (e) => this.handleQuickVitalSubmit(e));
        }

        // Detailed vital form submission
        const detailedVitalForm = document.getElementById('detailed-vital-form');
        if (detailedVitalForm) {
            detailedVitalForm.addEventListener('submit', (e) => this.handleDetailedVitalSubmit(e));
        }

        // Chart controls
        const chartTypeSelect = document.getElementById('chart-type-select');
        if (chartTypeSelect) {
            chartTypeSelect.addEventListener('change', (e) => this.updateChart(e.target.value));
        }

        const dateRangeSelect = document.getElementById('date-range-select');
        if (dateRangeSelect) {
            dateRangeSelect.addEventListener('change', () => this.loadTrends());
        }

        const refreshChartBtn = document.getElementById('refresh-chart-btn');
        if (refreshChartBtn) {
            refreshChartBtn.addEventListener('click', () => this.loadTrends());
        }

        const exportChartBtn = document.getElementById('export-chart-btn');
        if (exportChartBtn) {
            exportChartBtn.addEventListener('click', () => this.exportChart());
        }

        // Form validation
        this.setupFormValidation();
    }

    /**
     * Set up form validation for vitals inputs
     */
    setupFormValidation() {
        const bpInput = document.querySelector('input[name="blood_pressure"]');
        if (bpInput) {
            bpInput.addEventListener('input', (e) => this.validateBloodPressure(e.target));
        }

        const hrInput = document.querySelector('input[name="heart_rate"]');
        if (hrInput) {
            hrInput.addEventListener('input', (e) => this.validateHeartRate(e.target));
        }

        const tempInput = document.querySelector('input[name="temperature"]');
        if (tempInput) {
            tempInput.addEventListener('input', (e) => this.validateTemperature(e.target));
        }

        const weightInput = document.querySelector('input[name="weight"]');
        if (weightInput) {
            weightInput.addEventListener('input', (e) => this.validateWeight(e.target));
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
            
            // Load AI insights based on vitals data
            await this.loadAIInsights();
            
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
     * Handle quick vitals form submission (multiple vitals at once)
     */
    async handleQuickVitalSubmit(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const vitalsToSave = [];
        const recordedAt = new Date().toISOString();
        
        // Process each vital type
        const vitalTypes = ['blood_pressure', 'heart_rate', 'temperature', 'weight'];
        
        for (const type of vitalTypes) {
            const value = formData.get(type);
            if (value && value.trim()) {
                // Validate the value
                if (!this.validateVitalValue(type, value)) {
                    uiShowToast(getTranslation(`vitals.${type}.invalid`), 'error');
                    return;
                }
                
                vitalsToSave.push({
                    vital_type: type,
                    value: value,
                    notes: formData.get('notes') || '',
                    recorded_at: recordedAt
                });
            }
        }
        
        if (vitalsToSave.length === 0) {
            uiShowToast(getTranslation('vitals.noDataEntered'), 'warning');
            return;
        }

        try {
            // Save all vitals
            const savePromises = vitalsToSave.map(vital => apiCreateVital(vital));
            await Promise.all(savePromises);
            
            uiShowToast(getTranslation('vitals.quickSaveSuccess'), 'success');
            event.target.reset();
            
            // Reload vitals and trends
            await this.loadVitals();
            await this.loadTrends();
            
        } catch (error) {
            console.error('Failed to save vitals:', error);
            uiShowToast(getTranslation('vitals.saveError'), 'error');
        }
    }

    /**
     * Handle detailed vital form submission (single vital with more details)
     */
    async handleDetailedVitalSubmit(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const vitalData = {
            vital_type: formData.get('vital_type'),
            value: formData.get('value'),
            notes: formData.get('notes') || '',
            recorded_at: formData.get('recorded_at') || new Date().toISOString()
        };

        // Validate the data
        if (!vitalData.vital_type || !vitalData.value) {
            uiShowToast(getTranslation('vitals.requiredFields'), 'error');
            return;
        }

        if (!this.validateVitalValue(vitalData.vital_type, vitalData.value)) {
            uiShowToast(getTranslation('vitals.invalidValue'), 'error');
            return;
        }

        try {
            await apiCreateVital(vitalData);
            uiShowToast(getTranslation('vitals.addSuccess'), 'success');
            
            // Close modal and reset form
            document.getElementById('add-vital-modal').classList.remove('modal-open');
            event.target.reset();
            
            // Reload vitals and trends
            await this.loadVitals();
            await this.loadTrends();
            
        } catch (error) {
            console.error('Failed to add vital:', error);
            uiShowToast(getTranslation('vitals.addError'), 'error');
        }
    }

    /**
     * Validate vital value based on type
     */
    validateVitalValue(type, value) {
        switch (type) {
            case 'blood_pressure':
                return /^\d{2,3}\/\d{2,3}$/.test(value);
            case 'heart_rate':
                const hr = parseInt(value);
                return hr >= 40 && hr <= 200;
            case 'temperature':
                const temp = parseFloat(value);
                return temp >= 30 && temp <= 45;
            case 'weight':
                const weight = parseFloat(value);
                return weight >= 20 && weight <= 300;
            case 'blood_sugar':
                const bs = parseInt(value);
                return bs >= 50 && bs <= 500;
            default:
                return true;
        }
    }

    /**
     * Validate blood pressure input
     */
    validateBloodPressure(input) {
        const value = input.value;
        const errorElement = document.getElementById('bp-error');
        
        if (value && !/^\d{2,3}\/\d{2,3}$/.test(value)) {
            input.classList.add('input-error');
            if (errorElement) errorElement.classList.remove('hidden');
        } else {
            input.classList.remove('input-error');
            if (errorElement) errorElement.classList.add('hidden');
        }
    }

    /**
     * Validate heart rate input
     */
    validateHeartRate(input) {
        const value = parseInt(input.value);
        const errorElement = document.getElementById('hr-error');
        
        if (input.value && (isNaN(value) || value < 40 || value > 200)) {
            input.classList.add('input-error');
            if (errorElement) errorElement.classList.remove('hidden');
        } else {
            input.classList.remove('input-error');
            if (errorElement) errorElement.classList.add('hidden');
        }
    }

    /**
     * Validate temperature input
     */
    validateTemperature(input) {
        const value = parseFloat(input.value);
        const errorElement = document.getElementById('temp-error');
        
        if (input.value && (isNaN(value) || value < 30 || value > 45)) {
            input.classList.add('input-error');
            if (errorElement) errorElement.classList.remove('hidden');
        } else {
            input.classList.remove('input-error');
            if (errorElement) errorElement.classList.add('hidden');
        }
    }

    /**
     * Validate weight input
     */
    validateWeight(input) {
        const value = parseFloat(input.value);
        const errorElement = document.getElementById('weight-error');
        
        if (input.value && (isNaN(value) || value < 20 || value > 300)) {
            input.classList.add('input-error');
            if (errorElement) errorElement.classList.remove('hidden');
        } else {
            input.classList.remove('input-error');
            if (errorElement) errorElement.classList.add('hidden');
        }
    }

    /**
     * Export chart data
     */
    exportChart() {
        const chartType = document.getElementById('chart-type-select')?.value || 'blood_pressure';
        const dateRange = document.getElementById('date-range-select')?.value || '30';
        
        if (!this.trends || !this.trends[chartType]) {
            uiShowToast(getTranslation('vitals.noDataToExport'), 'warning');
            return;
        }

        const data = this.trends[chartType];
        const csvContent = this.generateCSV(data, chartType);
        
        // Create and download CSV file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vitals_${chartType}_${dateRange}days.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        uiShowToast(getTranslation('vitals.exportSuccess'), 'success');
    }

    /**
     * Generate CSV content from chart data
     */
    generateCSV(data, type) {
        const headers = ['Date', this.getVitalTypeLabel(type), 'Unit'];
        const unit = this.getVitalUnit(type);
        
        const rows = data.map(item => [
            item.date,
            item.value,
            unit
        ]);
        
        return [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
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
     * Load AI insights based on vitals data
     */
    async loadAIInsights() {
        try {
            // Get user data for AI analysis
            const userData = {
                vitals: this.vitals,
                profile: await this.getMockUserProfile()
            };

            // Generate health goals based on vitals
            this.healthGoals = await aiInsights.generateHealthGoals(this.vitals, userData.profile);
            
            // Analyze health trends
            const trendAnalysis = await aiInsights.analyzeHealthTrends(this.vitals);
            
            // Render AI insights
            this.renderHealthGoals();
            this.renderVitalsTrendInsights(trendAnalysis);
            
        } catch (error) {
            console.warn('Failed to load AI insights for vitals:', error);
            // Continue without AI insights - they're supplementary
        }
    }

    /**
     * Get mock user profile for AI analysis
     */
    async getMockUserProfile() {
        return {
            age: 45,
            height: 175,
            conditions: ['diabetes', 'hypertension'],
            medications: ['metformin', 'lisinopril']
        };
    }

    /**
     * Render health goals based on vitals
     */
    renderHealthGoals() {
        if (!this.healthGoals || this.healthGoals.length === 0) return;

        const goalsContainer = this.getOrCreateInsightsSection('vitals-health-goals', 'AI Health Goals', '🎯');
        
        const goalsHTML = `
            <div class="space-y-4">
                ${this.healthGoals.map(goal => `
                    <div class="card bg-base-200 shadow-sm">
                        <div class="card-body p-4">
                            <div class="flex items-center justify-between mb-2">
                                <h4 class="font-medium">${goal.title}</h4>
                                <span class="badge ${this.getPriorityBadgeClass(goal.priority)}">${goal.priority}</span>
                            </div>
                            <div class="grid grid-cols-2 gap-4 mb-3 text-sm">
                                <div>
                                    <span class="text-base-content/60">Current:</span>
                                    <span class="font-medium ml-1">${goal.current}</span>
                                </div>
                                <div>
                                    <span class="text-base-content/60">Target:</span>
                                    <span class="font-medium ml-1">${goal.target}</span>
                                </div>
                            </div>
                            <div class="mb-3">
                                <span class="text-xs text-base-content/60">Timeframe: ${goal.timeframe}</span>
                            </div>
                            <details class="collapse collapse-arrow bg-base-100">
                                <summary class="collapse-title text-sm font-medium">Action Steps</summary>
                                <div class="collapse-content">
                                    <ul class="text-sm space-y-1">
                                        ${goal.steps.map(step => `<li class="flex items-start gap-2"><span class="text-primary">•</span>${step}</li>`).join('')}
                                    </ul>
                                </div>
                            </details>
                            <div class="mt-2">
                                <div class="flex items-center gap-2">
                                    <span class="text-xs text-base-content/50">AI Confidence:</span>
                                    <div class="w-16 bg-base-300 rounded-full h-1">
                                        <div class="bg-primary h-1 rounded-full" style="width: ${goal.confidence * 100}%"></div>
                                    </div>
                                    <span class="text-xs text-base-content/50">${Math.round(goal.confidence * 100)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        goalsContainer.innerHTML = goalsHTML;
    }

    /**
     * Render vitals trend insights
     */
    renderVitalsTrendInsights(trendAnalysis) {
        if (!trendAnalysis || !trendAnalysis.trends) return;

        const trendsContainer = this.getOrCreateInsightsSection('vitals-trend-insights', 'AI Trend Analysis', '📈');
        
        const trendsHTML = `
            <div class="space-y-3">
                ${trendAnalysis.trends.map(trend => `
                    <div class="bg-base-200 p-3 rounded-lg">
                        <div class="flex items-center justify-between mb-2">
                            <span class="font-medium capitalize">${trend.type.replace('_', ' ')}</span>
                            <span class="badge ${this.getTrendBadgeClass(trend.direction)}">${trend.direction}</span>
                        </div>
                        <p class="text-sm text-base-content/70">${trend.insight}</p>
                        <div class="mt-2">
                            <div class="flex items-center gap-2">
                                <span class="text-xs text-base-content/50">Confidence:</span>
                                <div class="w-16 bg-base-300 rounded-full h-1">
                                    <div class="bg-primary h-1 rounded-full" style="width: ${trend.confidence * 100}%"></div>
                                </div>
                                <span class="text-xs text-base-content/50">${Math.round(trend.confidence * 100)}%</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
                
                ${trendAnalysis.alerts && trendAnalysis.alerts.length > 0 ? `
                    <div class="mt-4 p-3 bg-warning/10 rounded-lg border border-warning/20">
                        <h4 class="font-medium text-warning mb-2 flex items-center gap-2">
                            <span>⚠️</span>
                            Health Alerts
                        </h4>
                        <div class="space-y-2">
                            ${trendAnalysis.alerts.map(alert => `
                                <div class="text-sm">
                                    <span class="badge badge-${alert.priority === 'high' ? 'error' : alert.priority === 'medium' ? 'warning' : 'info'} badge-sm mr-2">${alert.priority}</span>
                                    ${alert.message}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${trendAnalysis.recommendations && trendAnalysis.recommendations.length > 0 ? `
                    <div class="mt-4 p-3 bg-info/10 rounded-lg border border-info/20">
                        <h4 class="font-medium text-info mb-2 flex items-center gap-2">
                            <span>💡</span>
                            AI Recommendations
                        </h4>
                        <ul class="text-sm space-y-1">
                            ${trendAnalysis.recommendations.map(rec => `<li class="flex items-start gap-2"><span class="text-info">•</span>${rec}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;

        trendsContainer.innerHTML = trendsHTML;
    }

    /**
     * Get or create insights section in vitals page
     */
    getOrCreateInsightsSection(id, title, icon) {
        let section = document.getElementById(id);
        
        if (!section) {
            // Create insights container if it doesn't exist
            let insightsContainer = document.getElementById('vitals-ai-insights-container');
            if (!insightsContainer) {
                insightsContainer = document.createElement('div');
                insightsContainer.id = 'vitals-ai-insights-container';
                insightsContainer.className = 'mt-8 space-y-6';
                
                // Insert after vitals chart section
                const chartSection = document.getElementById('vitals-chart')?.closest('.card');
                if (chartSection) {
                    chartSection.parentNode.insertBefore(insightsContainer, chartSection.nextSibling);
                } else {
                    // Fallback: append to main content
                    const mainContent = document.querySelector('main');
                    if (mainContent) mainContent.appendChild(insightsContainer);
                }
            }

            // Create section card
            section = document.createElement('div');
            section.className = 'card bg-base-100 shadow-lg';
            section.innerHTML = `
                <div class="card-body">
                    <h3 class="text-xl font-semibold mb-4 flex items-center gap-2">
                        <span class="text-2xl">${icon}</span>
                        ${title}
                    </h3>
                    <div id="${id}-content">
                        <div class="flex items-center justify-center py-8">
                            <span class="loading loading-spinner loading-lg text-primary"></span>
                        </div>
                    </div>
                </div>
            `;
            
            insightsContainer.appendChild(section);
            section = document.getElementById(`${id}-content`);
        } else {
            section = document.getElementById(`${id}-content`);
        }

        return section;
    }

    /**
     * Get CSS class for trend badge
     */
    getTrendBadgeClass(direction) {
        switch (direction) {
            case 'improving': return 'badge-success';
            case 'decreasing': return 'badge-success';
            case 'increasing': return 'badge-warning';
            case 'stable': return 'badge-info';
            default: return 'badge-neutral';
        }
    }

    /**
     * Get CSS class for priority badge
     */
    getPriorityBadgeClass(priority) {
        switch (priority) {
            case 'high': return 'badge-error';
            case 'medium': return 'badge-warning';
            case 'low': return 'badge-info';
            default: return 'badge-neutral';
        }
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