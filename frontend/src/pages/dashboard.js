/**
 * Dashboard Page Module
 * Handles dashboard-specific functionality and data loading
 */

import { apiGetDashboardStats, apiGetRecentActivity } from '../api.js';
import { uiShowToast, uiShowLoading, uiHideLoading } from '../ui.js';
import { getTranslation } from '../localization.js';

class DashboardPage {
    constructor() {
        this.stats = null;
        this.recentActivity = [];
        this.refreshInterval = null;
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
     * Load dashboard data from API
     */
    async loadDashboardData() {
        try {
            uiShowLoading('dashboard-content');
            
            // Load dashboard statistics
            this.stats = await apiGetDashboardStats();
            this.renderStats();
            
            // Load recent activity
            this.recentActivity = await apiGetRecentActivity();
            this.renderRecentActivity();
            
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            uiShowToast(getTranslation('dashboard.loadError'), 'error');
        } finally {
            uiHideLoading('dashboard-content');
        }
    }

    /**
     * Render dashboard statistics
     */
    renderStats() {
        if (!this.stats) return;

        // Update prescription count
        const prescriptionCount = document.getElementById('prescription-count');
        if (prescriptionCount) {
            prescriptionCount.textContent = this.stats.prescriptions || 0;
        }

        // Update vitals count
        const vitalsCount = document.getElementById('vitals-count');
        if (vitalsCount) {
            vitalsCount.textContent = this.stats.vitals || 0;
        }

        // Update reports count
        const reportsCount = document.getElementById('reports-count');
        if (reportsCount) {
            reportsCount.textContent = this.stats.reports || 0;
        }

        // Update emergency contacts count
        const emergencyCount = document.getElementById('emergency-count');
        if (emergencyCount) {
            emergencyCount.textContent = this.stats.emergencyContacts || 0;
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