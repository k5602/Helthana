/**
 * Dashboard Module
 * Handles dashboard-specific functionality and data loading
 */

async function loadDashboardData() {
    try {
        // Load dashboard statistics
        const [prescriptions, vitals, reports] = await Promise.all([
            offline.getCombinedPrescriptions(),
            offline.getCombinedVitals(),
            api.getReports().catch(() => ({ results: [] }))
        ]);

        // Update dashboard stats
        ui.updateDashboardStats({
            prescriptions: prescriptions.length,
            vitals: vitals.length,
            reports: reports.results?.length || 0
        });

        // Load recent activity
        loadRecentActivity(prescriptions, vitals);

    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        ui.showToast('Failed to load dashboard data', 'error');
    }
}

function loadRecentActivity(prescriptions, vitals) {
    const activities = [];

    // Add recent prescriptions
    prescriptions.slice(0, 3).forEach(prescription => {
        activities.push({
            icon: '📱',
            title: 'Prescription Scanned',
            description: `Dr. ${prescription.doctor_name}`,
            timestamp: formatDate(prescription.created_at)
        });
    });

    // Add recent vitals
    vitals.slice(0, 3).forEach(vital => {
        activities.push({
            icon: '📊',
            title: 'Vital Signs Logged',
            description: `${vital.vital_type}: ${vital.value} ${vital.unit}`,
            timestamp: formatDate(vital.recorded_at)
        });
    });

    // Sort by timestamp and take most recent
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    ui.renderRecentActivity(activities.slice(0, 5));
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
}

// Load dashboard data when page loads
if (window.location.pathname.includes('dashboard')) {
    document.addEventListener('DOMContentLoaded', loadDashboardData);
}