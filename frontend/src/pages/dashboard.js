/**
 * Dashboard Page Module
 * Handles dashboard-specific functionality and data loading
 */

import { apiGetDashboardStats, apiGetRecentActivity } from '../api.js';
import { uiShowToast, uiShowLoading, uiHideLoading } from '../ui.js';
import { getTranslation } from '../localization.js';
import { aiInsights } from '../ai-insights.js';

class DashboardPage {
    constructor() {
        this.stats = null;
        this.recentActivity = [];
        this.refreshInterval = null;
        this.aiInsights = null;
        this.healthGoals = [];
        this.personalizedTips = [];
    }

    /**
     * Initialize dashboard page
     */
    async init() {
        console.log('Initializing Dashboard Page');
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Load dashboard data
        await this.loadDashboardData();
        
        // Set up auto-refresh
        this.setupAutoRefresh();
    }

    /**
     * Set up event listeners for dashboard interactions
     */
    setupEventListeners() {
        // Refresh button
        const refreshBtn = document.getElementById('refresh-dashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshDashboard());
        }

        // Quick action buttons
        const scanBtn = document.getElementById('quick-scan-prescription');
        if (scanBtn) {
            scanBtn.addEventListener('click', () => this.navigateToScanner());
        }

        const vitalsBtn = document.getElementById('quick-log-vitals');
        if (vitalsBtn) {
            vitalsBtn.addEventListener('click', () => this.navigateToVitals());
        }

        const emergencyBtn = document.getElementById('quick-emergency');
        if (emergencyBtn) {
            emergencyBtn.addEventListener('click', () => this.handleEmergencyAlert());
        }
    }

    /**
     * Load dashboard data from API with enhanced error handling
     */
    async loadDashboardData() {
        try {
            // Show loading states for individual components
            this.showLoadingStates();
            
            // Load dashboard statistics with retry logic
            this.stats = await this.loadStatsWithFallback();
            this.renderStats();
            
            // Load recent activity with retry logic
            this.recentActivity = await this.loadActivityWithFallback();
            this.renderRecentActivity();
            
            // Load AI health insights
            await this.loadAIInsights();
            
            // Update last refresh time
            this.updateLastRefreshTime();
            
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            this.handleLoadError(error);
        } finally {
            this.hideLoadingStates();
        }
    }

    /**
     * Load stats with fallback to offline data
     */
    async loadStatsWithFallback() {
        try {
            return await apiGetDashboardStats();
        } catch (error) {
            console.warn('Failed to load stats from API, using fallback:', error);
            
            // Fallback to basic counts if API fails
            return {
                prescriptions: 0,
                vitals: 0,
                reports: 0,
                emergencyContacts: 0,
                pendingPrescriptions: 0,
                recentVitals: 0
            };
        }
    }

    /**
     * Load activity with fallback to offline data
     */
    async loadActivityWithFallback() {
        try {
            return await apiGetRecentActivity();
        } catch (error) {
            console.warn('Failed to load activity from API, using fallback:', error);
            
            // Return empty activity if API fails
            return [];
        }
    }

    /**
     * Show loading states for dashboard components
     */
    showLoadingStates() {
        // Show loading for stats cards
        const statElements = [
            'prescription-count',
            'vitals-count', 
            'reports-count',
            'emergency-count'
        ];
        
        statElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = '<span class="loading loading-spinner loading-sm"></span>';
            }
        });

        // Show loading for recent activity
        const activityContainer = document.getElementById('recent-activity');
        if (activityContainer) {
            activityContainer.innerHTML = `
                <div class="flex items-center justify-center py-8">
                    <span class="loading loading-spinner loading-lg text-primary"></span>
                </div>
            `;
        }
    }

    /**
     * Hide loading states
     */
    hideLoadingStates() {
        // Loading states are replaced by actual content in render methods
    }

    /**
     * Handle loading errors with user-friendly messages
     */
    handleLoadError(error) {
        let errorMessage = getTranslation('dashboard.loadError');
        
        if (error.status === 401) {
            errorMessage = getTranslation('auth.sessionExpired');
            // Redirect to login after showing error
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else if (error.status >= 500) {
            errorMessage = getTranslation('dashboard.serverError');
        } else if (!navigator.onLine) {
            errorMessage = getTranslation('dashboard.offlineError');
        }
        
        uiShowToast(errorMessage, 'error');
    }

    /**
     * Update last refresh time indicator
     */
    updateLastRefreshTime() {
        const refreshIndicator = document.getElementById('last-refresh');
        if (refreshIndicator) {
            const now = new Date();
            refreshIndicator.textContent = `Last updated: ${now.toLocaleTimeString()}`;
        }
    }

    /**
     * Render dashboard statistics with enhanced data
     */
    renderStats() {
        if (!this.stats) return;

        // Update prescription count with animation
        this.animateCountUpdate('prescription-count', this.stats.prescriptions || 0);
        
        // Update vitals count
        this.animateCountUpdate('vitals-count', this.stats.vitals || 0);
        
        // Update reports count
        this.animateCountUpdate('reports-count', this.stats.reports || 0);
        
        // Update emergency contacts count (if element exists)
        const emergencyCount = document.getElementById('emergency-count');
        if (emergencyCount) {
            this.animateCountUpdate('emergency-count', this.stats.emergencyContacts || 0);
        }

        // Add status indicators for pending items
        this.updateStatusIndicators();
    }

    /**
     * Animate count updates for better UX
     */
    animateCountUpdate(elementId, newValue) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const currentValue = parseInt(element.textContent) || 0;
        const increment = newValue > currentValue ? 1 : -1;
        const steps = Math.abs(newValue - currentValue);
        
        if (steps === 0) return;

        let current = currentValue;
        const stepTime = Math.min(50, 500 / steps); // Max 500ms total animation

        const timer = setInterval(() => {
            current += increment;
            element.textContent = current;
            
            if (current === newValue) {
                clearInterval(timer);
            }
        }, stepTime);
    }

    /**
     * Update status indicators for pending items
     */
    updateStatusIndicators() {
        // Add pending prescriptions indicator
        if (this.stats.pendingPrescriptions > 0) {
            const prescriptionCard = document.getElementById('prescription-count')?.closest('.card');
            if (prescriptionCard) {
                const badge = document.createElement('div');
                badge.className = 'badge badge-warning badge-sm absolute -top-2 -right-2';
                badge.textContent = this.stats.pendingPrescriptions;
                badge.title = `${this.stats.pendingPrescriptions} pending processing`;
                prescriptionCard.style.position = 'relative';
                
                // Remove existing badge
                const existingBadge = prescriptionCard.querySelector('.badge');
                if (existingBadge) existingBadge.remove();
                
                prescriptionCard.appendChild(badge);
            }
        }

        // Add recent vitals indicator
        if (this.stats.recentVitals > 0) {
            const vitalsCard = document.getElementById('vitals-count')?.closest('.card');
            if (vitalsCard) {
                const indicator = document.createElement('div');
                indicator.className = 'w-3 h-3 bg-success rounded-full absolute top-2 right-2';
                indicator.title = 'Recent vitals logged';
                vitalsCard.style.position = 'relative';
                
                // Remove existing indicator
                const existingIndicator = vitalsCard.querySelector('.bg-success');
                if (existingIndicator) existingIndicator.remove();
                
                vitalsCard.appendChild(indicator);
            }
        }
    }

    /**
     * Render recent activity feed
     */
    renderRecentActivity() {
        const activityContainer = document.getElementById('recent-activity');
        if (!activityContainer) return;

        if (this.recentActivity.length === 0) {
            activityContainer.innerHTML = `
                <div class="text-center py-8 text-base-content/60">
                    <p data-i18n="dashboard.noActivity">${getTranslation('dashboard.noActivity')}</p>
                </div>
            `;
            return;
        }

        const activityHTML = this.recentActivity.map(activity => `
            <div class="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                <div class="w-2 h-2 bg-primary rounded-full"></div>
                <div class="flex-1">
                    <p class="text-sm font-medium">${activity.title}</p>
                    <p class="text-xs text-base-content/60">${activity.timestamp}</p>
                </div>
            </div>
        `).join('');

        activityContainer.innerHTML = activityHTML;
    }

    /**
     * Refresh dashboard data
     */
    async refreshDashboard() {
        await this.loadDashboardData();
        uiShowToast(getTranslation('dashboard.refreshed'), 'success');
    }

    /**
     * Set up auto-refresh for dashboard data
     */
    setupAutoRefresh() {
        // Refresh every 5 minutes
        this.refreshInterval = setInterval(() => {
            this.loadDashboardData();
        }, 5 * 60 * 1000);
    }

    /**
     * Navigate to prescription scanner
     */
    navigateToScanner() {
        if (window.router) {
            window.router.navigate('/prescriptions');
        } else {
            window.location.href = 'prescriptions.html';
        }
    }

    /**
     * Navigate to vitals page
     */
    navigateToVitals() {
        if (window.router) {
            window.router.navigate('/vitals');
        } else {
            window.location.href = 'vitals.html';
        }
    }

    /**
     * Handle emergency alert
     */
    async handleEmergencyAlert() {
        if (confirm(getTranslation('emergency.confirmAlert'))) {
            try {
                // This will be implemented in the emergency module
                uiShowToast(getTranslation('emergency.alertSent'), 'success');
            } catch (error) {
                console.error('Failed to send emergency alert:', error);
                uiShowToast(getTranslation('emergency.alertFailed'), 'error');
            }
        }
    }

    /**
     * Load AI health insights
     */
    async loadAIInsights() {
        try {
            // Get user data for AI analysis (mock data for now)
            const userData = {
                vitals: await this.getMockVitalsData(),
                medications: await this.getMockMedicationsData(),
                profile: await this.getMockUserProfile()
            };

            // Load AI insights
            this.aiInsights = await aiInsights.getAllInsights(userData);
            
            // Render AI insights components
            this.renderHealthTrends();
            this.renderMedicationInteractions();
            this.renderHealthGoals();
            this.renderPersonalizedTips();
            
        } catch (error) {
            console.warn('Failed to load AI insights:', error);
            // Continue without AI insights - they're supplementary
        }
    }

    /**
     * Get mock vitals data for AI analysis
     */
    async getMockVitalsData() {
        // In a real implementation, this would fetch from API or IndexedDB
        return [
            { vital_type: 'blood_pressure', value: '125/80', recorded_at: '2024-01-15T10:00:00Z' },
            { vital_type: 'blood_pressure', value: '122/78', recorded_at: '2024-01-14T10:00:00Z' },
            { vital_type: 'weight', value: '75.2', recorded_at: '2024-01-15T08:00:00Z' },
            { vital_type: 'weight', value: '75.8', recorded_at: '2024-01-08T08:00:00Z' },
            { vital_type: 'heart_rate', value: '72', recorded_at: '2024-01-15T10:00:00Z' },
            { vital_type: 'heart_rate', value: '75', recorded_at: '2024-01-14T10:00:00Z' }
        ];
    }

    /**
     * Get mock medications data for AI analysis
     */
    async getMockMedicationsData() {
        return [
            { name: 'Metformin', dosage: '500mg', frequency: 'twice daily' },
            { name: 'Lisinopril', dosage: '10mg', frequency: 'once daily' }
        ];
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
     * Render health trends insights
     */
    renderHealthTrends() {
        if (!this.aiInsights?.trends) return;

        const trendsContainer = this.getOrCreateInsightsSection('health-trends', 'Health Trends', '📈');
        const trends = this.aiInsights.trends;

        const trendsHTML = `
            <div class="space-y-3">
                ${trends.trends.map(trend => `
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
                ${trends.recommendations.length > 0 ? `
                    <div class="mt-4 p-3 bg-info/10 rounded-lg border border-info/20">
                        <h4 class="font-medium text-info mb-2">AI Recommendations</h4>
                        <ul class="text-sm space-y-1">
                            ${trends.recommendations.map(rec => `<li class="flex items-start gap-2"><span class="text-info">•</span>${rec}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;

        trendsContainer.innerHTML = trendsHTML;
    }

    /**
     * Render medication interaction warnings
     */
    renderMedicationInteractions() {
        if (!this.aiInsights?.interactions) return;

        const interactionsContainer = this.getOrCreateInsightsSection('medication-interactions', 'Medication Safety', '💊');
        const interactions = this.aiInsights.interactions;

        if (interactions.length === 0) {
            interactionsContainer.innerHTML = `
                <div class="text-center py-4 text-base-content/60">
                    <p>No medication interactions detected</p>
                </div>
            `;
            return;
        }

        const interactionsHTML = `
            <div class="space-y-3">
                ${interactions.map(interaction => `
                    <div class="alert ${this.getInteractionAlertClass(interaction.severity)}">
                        <div class="flex-1">
                            <div class="flex items-center gap-2 mb-1">
                                <span class="font-medium">${interaction.type.replace('_', ' ').toUpperCase()}</span>
                                <span class="badge badge-sm ${this.getSeverityBadgeClass(interaction.severity)}">${interaction.severity}</span>
                            </div>
                            <p class="text-sm">${interaction.warning}</p>
                            ${interaction.recommendation ? `
                                <p class="text-xs mt-1 opacity-75"><strong>Recommendation:</strong> ${interaction.recommendation}</p>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        interactionsContainer.innerHTML = interactionsHTML;
    }

    /**
     * Render health goals
     */
    renderHealthGoals() {
        if (!this.aiInsights?.goals) return;

        const goalsContainer = this.getOrCreateInsightsSection('health-goals', 'Health Goals', '🎯');
        const goals = this.aiInsights.goals;

        const goalsHTML = `
            <div class="space-y-4">
                ${goals.map(goal => `
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
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        goalsContainer.innerHTML = goalsHTML;
    }

    /**
     * Render personalized health tips
     */
    renderPersonalizedTips() {
        if (!this.aiInsights?.tips) return;

        const tipsContainer = this.getOrCreateInsightsSection('health-tips', 'Personalized Tips', '💡');
        const tips = this.aiInsights.tips;

        const tipsHTML = `
            <div class="space-y-3">
                ${tips.map(tip => `
                    <div class="bg-base-200 p-3 rounded-lg">
                        <div class="flex items-center justify-between mb-2">
                            <span class="font-medium">${tip.title}</span>
                            <div class="flex items-center gap-2">
                                <span class="badge badge-sm ${this.getPriorityBadgeClass(tip.priority)}">${tip.priority}</span>
                                <span class="text-xs text-base-content/50">${tip.frequency}</span>
                            </div>
                        </div>
                        <p class="text-sm text-base-content/70">${tip.tip}</p>
                        <span class="text-xs text-base-content/50 capitalize">${tip.category.replace('_', ' ')}</span>
                    </div>
                `).join('')}
            </div>
        `;

        tipsContainer.innerHTML = tipsHTML;
    }

    /**
     * Get or create insights section in dashboard
     */
    getOrCreateInsightsSection(id, title, icon) {
        let section = document.getElementById(id);
        
        if (!section) {
            // Create insights container if it doesn't exist
            let insightsContainer = document.getElementById('ai-insights-container');
            if (!insightsContainer) {
                insightsContainer = document.createElement('div');
                insightsContainer.id = 'ai-insights-container';
                insightsContainer.className = 'mt-8 space-y-6';
                
                // Insert after recent activity section
                const recentActivityCard = document.getElementById('recent-activity')?.closest('.card');
                if (recentActivityCard) {
                    recentActivityCard.parentNode.insertBefore(insightsContainer, recentActivityCard.nextSibling);
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
     * Get CSS class for interaction alert
     */
    getInteractionAlertClass(severity) {
        switch (severity) {
            case 'high': return 'alert-error';
            case 'moderate': return 'alert-warning';
            case 'low': return 'alert-info';
            default: return 'alert-info';
        }
    }

    /**
     * Get CSS class for severity badge
     */
    getSeverityBadgeClass(severity) {
        switch (severity) {
            case 'high': return 'badge-error';
            case 'moderate': return 'badge-warning';
            case 'low': return 'badge-info';
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
     * Cleanup dashboard page
     */
    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }
}

// Export for use in main.js
export { DashboardPage };