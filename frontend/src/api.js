/**
 * API Communication Module
 * Handles all backend API interactions
 */

// Determine API base URL based on environment
function getApiBaseUrl() {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // Development environments - use port 8000 for Django backend
    if (hostname === 'localhost' || 
        hostname === '127.0.0.1' || 
        hostname.startsWith('192.168.') || 
        hostname.startsWith('10.') || 
        hostname.startsWith('172.') ||
        /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
        return `${protocol}//${hostname}:8000/api/v1`;
    }
    
    // Production environment - same host as frontend
    return `${protocol}//${window.location.host}/api/v1`;
}

const API_BASE_URL = getApiBaseUrl();

class ApiClient {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.token = localStorage.getItem('access_token');
    }

    // Set authentication token
    setToken(token) {
        this.token = token;
        localStorage.setItem('access_token', token);
    }

    // Remove authentication token
    clearToken() {
        this.token = null;
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    }

    // Generic request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            credentials: 'include', // Include cookies for CORS
            ...options
        };

        // Add auth token if available
        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            
            if (response.status === 401) {
                // Token expired, try to refresh
                const refreshed = await this.refreshToken();
                if (refreshed) {
                    config.headers.Authorization = `Bearer ${this.token}`;
                    return fetch(url, config);
                } else {
                    this.clearToken();
                    // Don't redirect if we're already on login page
                    if (!window.location.pathname.includes('login') && !window.location.pathname.includes('index')) {
                        window.location.href = '/';
                    }
                }
            }

            return response;
        } catch (error) {
            console.error('API request failed:', error);
            
            // Use global error handler if available
            if (window.errorHandler) {
                const errorResult = window.errorHandler.handleError(error, {
                    type: 'network',
                    action: 'connect to server',
                    retryable: true
                });
                throw new Error(errorResult.error);
            }
            
            // Fallback error handling
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Unable to connect to server. Please check your connection.');
            }
            throw error;
        }
    }

    // Authentication methods
    async login(username, password) {
        const response = await this.request('/auth/login/', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        if (!response.ok) {
            const errorData = await this.safeJsonParse(response);
            return errorData;
        }
        
        return this.safeJsonParse(response);
    }

    // Safe JSON parsing with error handling
    async safeJsonParse(response) {
        try {
            const text = await response.text();
            if (!text) {
                return { error: { code: 'EMPTY_RESPONSE', message: 'Server returned empty response' } };
            }
            return JSON.parse(text);
        } catch (error) {
            console.error('JSON parse error:', error);
            return { 
                error: { 
                    code: 'INVALID_JSON', 
                    message: 'Server returned invalid response format',
                    details: { originalError: error.message }
                } 
            };
        }
    }

    async register(userData) {
        const response = await this.request('/auth/register/', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        if (!response.ok) {
            const errorData = await this.safeJsonParse(response);
            return errorData;
        }
        
        return this.safeJsonParse(response);
    }

    async refreshToken(refreshToken) {
        if (!refreshToken) {
            refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
        }
        if (!refreshToken) return false;

        try {
            const response = await this.request('/auth/token/refresh/', {
                method: 'POST',
                body: JSON.stringify({ refresh: refreshToken })
            });
            
            if (response.ok) {
                const data = await this.safeJsonParse(response);
                if (data.access) {
                    this.setToken(data.access);
                    return data;
                }
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
        }
        return false;
    }

    // Password reset request
    async requestPasswordReset(email) {
        const response = await this.request('/auth/password-reset/', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
        
        if (!response.ok) {
            const errorData = await this.safeJsonParse(response);
            return errorData;
        }
        
        return this.safeJsonParse(response);
    }

    // Password reset confirmation
    async confirmPasswordReset(token, password) {
        const response = await this.request('/auth/password-reset-confirm/', {
            method: 'POST',
            body: JSON.stringify({ token, password })
        });
        
        if (!response.ok) {
            const errorData = await this.safeJsonParse(response);
            return errorData;
        }
        
        return this.safeJsonParse(response);
    }

    // Email verification
    async verifyEmail(token) {
        const response = await this.request('/auth/verify-email/', {
            method: 'POST',
            body: JSON.stringify({ token })
        });
        
        if (!response.ok) {
            const errorData = await this.safeJsonParse(response);
            return errorData;
        }
        
        return this.safeJsonParse(response);
    }

    // Resend email verification
    async resendEmailVerification(email) {
        const response = await this.request('/auth/resend-verification/', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
        
        if (!response.ok) {
            const errorData = await this.safeJsonParse(response);
            return errorData;
        }
        
        return this.safeJsonParse(response);
    }

    // Change password
    async changePassword(currentPassword, newPassword, confirmPassword) {
        const response = await this.request('/auth/change-password/', {
            method: 'POST',
            body: JSON.stringify({ 
                current_password: currentPassword,
                new_password: newPassword,
                new_password_confirm: confirmPassword
            })
        });
        
        if (!response.ok) {
            const errorData = await this.safeJsonParse(response);
            return errorData;
        }
        
        return this.safeJsonParse(response);
    }

    // Get user profile
    async getProfile() {
        const response = await this.request('/auth/profile/');
        
        if (!response.ok) {
            const errorData = await this.safeJsonParse(response);
            return errorData;
        }
        
        return this.safeJsonParse(response);
    }

    // Update user profile
    async updateProfile(profileData) {
        const response = await this.request('/auth/profile/', {
            method: 'PATCH',
            body: JSON.stringify(profileData)
        });
        
        if (!response.ok) {
            const errorData = await this.safeJsonParse(response);
            return errorData;
        }
        
        return this.safeJsonParse(response);
    }

    // Update email address
    async updateEmail(newEmail, password) {
        const response = await this.request('/auth/update-email/', {
            method: 'POST',
            body: JSON.stringify({ 
                new_email: newEmail,
                password: password
            })
        });
        
        if (!response.ok) {
            const errorData = await this.safeJsonParse(response);
            return errorData;
        }
        
        return this.safeJsonParse(response);
    }

    // Delete account
    async deleteAccount(password, confirmation) {
        const response = await this.request('/auth/delete-account/', {
            method: 'POST',
            body: JSON.stringify({ 
                password: password,
                confirmation: confirmation
            })
        });
        
        if (!response.ok) {
            const errorData = await this.safeJsonParse(response);
            return errorData;
        }
        
        return this.safeJsonParse(response);
    }

    // Get security logs
    async getSecurityLogs() {
        const response = await this.request('/auth/security-logs/');
        
        if (!response.ok) {
            const errorData = await this.safeJsonParse(response);
            return errorData;
        }
        
        return this.safeJsonParse(response);
    }

    // Enhanced logout with session termination
    async logout(refreshToken) {
        const response = await this.request('/auth/logout/', {
            method: 'POST',
            body: JSON.stringify({ refresh: refreshToken })
        });
        
        if (!response.ok) {
            const errorData = await this.safeJsonParse(response);
            return errorData;
        }
        
        return this.safeJsonParse(response);
    }

    // Get user sessions
    async getUserSessions(currentJti = null) {
        const response = await this.request('/auth/sessions/', {
            method: 'GET',
            body: currentJti ? JSON.stringify({ current_jti: currentJti }) : undefined
        });
        
        if (!response.ok) {
            const errorData = await this.safeJsonParse(response);
            return errorData;
        }
        
        return this.safeJsonParse(response);
    }

    // Terminate specific session
    async terminateSession(sessionId) {
        const response = await this.request('/auth/sessions/terminate/', {
            method: 'POST',
            body: JSON.stringify({ session_id: sessionId })
        });
        
        if (!response.ok) {
            const errorData = await this.safeJsonParse(response);
            return errorData;
        }
        
        return this.safeJsonParse(response);
    }

    // Terminate all other sessions
    async terminateAllSessions(currentSessionId = null) {
        const response = await this.request('/auth/sessions/terminate-all/', {
            method: 'POST',
            body: JSON.stringify({ current_session_id: currentSessionId })
        });
        
        if (!response.ok) {
            const errorData = await this.safeJsonParse(response);
            return errorData;
        }
        
        return this.safeJsonParse(response);
    }

    // Prescription methods
    async getPrescriptions() {
        const response = await this.request('/prescriptions/');
        return this.safeJsonParse(response);
    }

    async uploadPrescription(formData) {
        const response = await this.request('/prescriptions/', {
            method: 'POST',
            headers: {}, // Let browser set Content-Type for FormData
            body: formData
        });
        return this.safeJsonParse(response);
    }

    async uploadPrescriptionImage(prescriptionId, formData) {
        const response = await this.request(`/prescriptions/${prescriptionId}/upload_image/`, {
            method: 'POST',
            headers: {}, // Let browser set Content-Type for FormData
            body: formData
        });
        return this.safeJsonParse(response);
    }

    async validateFileUpload(formData) {
        const response = await this.request('/prescriptions/validate_upload/', {
            method: 'POST',
            headers: {}, // Let browser set Content-Type for FormData
            body: formData
        });
        return this.safeJsonParse(response);
    }

    async deletePrescriptionImage(prescriptionId) {
        const response = await this.request(`/prescriptions/${prescriptionId}/delete_image/`, {
            method: 'DELETE'
        });
        return this.safeJsonParse(response);
    }

    async getStorageUsage() {
        const response = await this.request('/prescriptions/storage_usage/');
        return this.safeJsonParse(response);
    }

    async cleanupFiles(daysOld = 30) {
        const response = await this.request('/prescriptions/cleanup_files/', {
            method: 'POST',
            body: JSON.stringify({ days_old: daysOld })
        });
        return this.safeJsonParse(response);
    }

    // Vitals methods
    async getVitals(type = null) {
        const endpoint = type ? `/vitals/?type=${type}` : '/vitals/';
        const response = await this.request(endpoint);
        return this.safeJsonParse(response);
    }

    async addVital(vitalData) {
        const response = await this.request('/vitals/', {
            method: 'POST',
            body: JSON.stringify(vitalData)
        });
        return this.safeJsonParse(response);
    }

    // Reports methods
    async getReports() {
        const response = await this.request('/reports/');
        return this.safeJsonParse(response);
    }

    async generateReport(reportData) {
        const response = await this.request('/reports/', {
            method: 'POST',
            body: JSON.stringify(reportData)
        });
        return this.safeJsonParse(response);
    }

    // Emergency methods
    async getEmergencyContacts() {
        const response = await this.request('/emergency/contacts/');
        return this.safeJsonParse(response);
    }

    async sendEmergencyAlert(alertData) {
        const response = await this.request('/emergency/alert/', {
            method: 'POST',
            body: JSON.stringify(alertData)
        });
        return this.safeJsonParse(response);
    }
}

// Global API client instance
const api = new ApiClient();
window.api = api;

// Enhanced error handling with retry logic
const withRetry = async (apiCall, maxRetries = 3, delay = 1000) => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await apiCall();
        } catch (error) {
            lastError = error;
            
            // Don't retry on authentication errors or client errors (4xx)
            if (error.status >= 400 && error.status < 500) {
                throw error;
            }
            
            // Don't retry on the last attempt
            if (attempt === maxRetries) {
                throw error;
            }
            
            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
        }
    }
    
    throw lastError;
};

// Enhanced API response handler
const handleApiResponse = async (response) => {
    if (!response.ok) {
        const errorData = await api.safeJsonParse(response);
        const error = new Error(errorData.error?.message || `HTTP ${response.status}`);
        error.status = response.status;
        error.data = errorData;
        throw error;
    }
    return api.safeJsonParse(response);
};

// Backend availability check
let backendAvailable = null;
const checkBackendAvailability = async () => {
    if (backendAvailable !== null) return backendAvailable;
    
    try {
        const response = await fetch(`${API_BASE_URL}/health/`, { 
            method: 'GET',
            timeout: 2000,
            signal: AbortSignal.timeout(2000)
        });
        backendAvailable = response.ok;
    } catch (error) {
        backendAvailable = false;
    }
    
    return backendAvailable;
};

// Dashboard API functions with complete offline fallback
export const apiGetDashboardStats = async () => {
    const isBackendAvailable = await checkBackendAvailability();
    
    if (!isBackendAvailable) {
        console.info('Backend unavailable, using offline data for dashboard stats');
        // Return demo data for offline experience
        return {
            prescriptions: 3,
            vitals: 8,
            reports: 2,
            emergencyContacts: 1,
            pendingPrescriptions: 1,
            recentVitals: 2
        };
    }
    
    try {
        // Try to get real data from API with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const [prescriptionStats, vitalStats, reportStats, emergencyStats] = await Promise.allSettled([
            api.request('/prescriptions/statistics/').then(handleApiResponse).catch(() => ({ total_prescriptions: 0, pending_prescriptions: 0 })),
            api.request('/vitals/types/').then(handleApiResponse).catch(() => ({ total_readings: 0, recent_count: 0 })),
            api.request('/reports/?limit=1').then(handleApiResponse).catch(() => ({ count: 0 })),
            api.request('/emergency/contacts/').then(handleApiResponse).catch(() => [])
        ]);
        
        clearTimeout(timeoutId);
        
        // Extract values from settled promises
        const prescriptionData = prescriptionStats.status === 'fulfilled' ? prescriptionStats.value : { total_prescriptions: 0, pending_prescriptions: 0 };
        const vitalData = vitalStats.status === 'fulfilled' ? vitalStats.value : { total_readings: 0, recent_count: 0 };
        const reportData = reportStats.status === 'fulfilled' ? reportStats.value : { count: 0 };
        const emergencyData = emergencyStats.status === 'fulfilled' ? emergencyStats.value : [];
        
        return {
            prescriptions: prescriptionData.total_prescriptions || 0,
            vitals: vitalData.total_readings || 0,
            reports: reportData.count || 0,
            emergencyContacts: Array.isArray(emergencyData) ? emergencyData.length : 0,
            pendingPrescriptions: prescriptionData.pending_prescriptions || 0,
            recentVitals: vitalData.recent_count || 0
        };
    } catch (error) {
        console.warn('Dashboard stats API failed, using offline fallback:', error);
        backendAvailable = false; // Mark backend as unavailable
        
        // Return demo data for offline experience
        return {
            prescriptions: 3,
            vitals: 8,
            reports: 2,
            emergencyContacts: 1,
            pendingPrescriptions: 1,
            recentVitals: 2
        };
    }
};

export const apiGetRecentActivity = async () => {
    try {
        // Try to get real data from API with graceful fallback
        const [recentPrescriptions, recentVitals, recentReports] = await Promise.allSettled([
            api.request('/prescriptions/recent/').then(handleApiResponse).catch(() => []),
            api.request('/vitals/?limit=5').then(handleApiResponse).catch(() => ({ results: [] })),
            api.request('/reports/?limit=3').then(handleApiResponse).catch(() => ({ results: [] }))
        ]);
        
        const activities = [];
        
        // Extract values from settled promises
        const prescriptionData = recentPrescriptions.status === 'fulfilled' ? recentPrescriptions.value : [];
        const vitalData = recentVitals.status === 'fulfilled' ? recentVitals.value : { results: [] };
        const reportData = recentReports.status === 'fulfilled' ? recentReports.value : { results: [] };
        
        // Add prescription activities
        if (Array.isArray(prescriptionData)) {
            prescriptionData.forEach(prescription => {
                activities.push({
                    id: `prescription-${prescription.id}`,
                    type: 'prescription',
                    title: `Prescription from Dr. ${prescription.doctor_name || 'Unknown'}`,
                    timestamp: prescription.created_at,
                    status: prescription.processing_status
                });
            });
        }
        
        // Add vital activities
        if (vitalData.results && Array.isArray(vitalData.results)) {
            vitalData.results.forEach(vital => {
                activities.push({
                    id: `vital-${vital.id}`,
                    type: 'vital',
                    title: `${vital.vital_type} recorded: ${vital.value} ${vital.unit || ''}`,
                    timestamp: vital.recorded_at
                });
            });
        }
        
        // Add report activities
        if (reportData.results && Array.isArray(reportData.results)) {
            reportData.results.forEach(report => {
                activities.push({
                    id: `report-${report.id}`,
                    type: 'report',
                    title: `${report.report_type} report generated`,
                    timestamp: report.created_at
                });
            });
        }
        
        // Sort by timestamp and return latest 10
        return activities
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10);
    } catch (error) {
        console.warn('Recent activity API failed, returning empty activity:', error);
        return [];
    }
};

// Prescription Management API Functions
export const apiGetPrescriptions = (filters = {}) => {
    return withRetry(async () => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, value);
        });
        const queryString = params.toString();
        const endpoint = queryString ? `/prescriptions/?${queryString}` : '/prescriptions/';
        return api.request(endpoint).then(handleApiResponse);
    });
};

export const apiUploadPrescription = (formData) => {
    return withRetry(async () => {
        return api.uploadPrescription(formData);
    });
};

export const apiGetPrescription = (id) => {
    return withRetry(async () => {
        return api.request(`/prescriptions/${id}/`).then(handleApiResponse);
    });
};

export const apiUpdatePrescription = (id, data) => {
    return withRetry(async () => {
        const response = await api.request(`/prescriptions/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
        return handleApiResponse(response);
    });
};

export const apiDeletePrescription = async (id) => {
    return withRetry(async () => {
        const response = await api.request(`/prescriptions/${id}/`, { method: 'DELETE' });
        return response.ok;
    });
};

export const apiProcessPrescriptionOCR = (id) => {
    return withRetry(async () => {
        const response = await api.request(`/prescriptions/${id}/process_ocr/`, {
            method: 'POST'
        });
        return handleApiResponse(response);
    });
};

export const apiSearchPrescriptions = (searchQuery, filters = {}) => {
    return withRetry(async () => {
        const params = new URLSearchParams({ search: searchQuery, ...filters });
        return api.request(`/prescriptions/search/?${params.toString()}`).then(handleApiResponse);
    });
};

export const apiGetRecentPrescriptions = () => {
    return withRetry(async () => {
        return api.request('/prescriptions/recent/').then(handleApiResponse);
    });
};

export const apiGetPrescriptionStatistics = () => {
    return withRetry(async () => {
        return api.request('/prescriptions/statistics/').then(handleApiResponse);
    });
};

// Medication API Functions
export const apiGetMedications = (prescriptionId = null) => {
    return withRetry(async () => {
        const endpoint = prescriptionId 
            ? `/medications/?prescription_id=${prescriptionId}` 
            : '/medications/';
        return api.request(endpoint).then(handleApiResponse);
    });
};

export const apiCreateMedication = (medicationData) => {
    return withRetry(async () => {
        const response = await api.request('/medications/', {
            method: 'POST',
            body: JSON.stringify(medicationData)
        });
        return handleApiResponse(response);
    });
};

export const apiUpdateMedication = (id, medicationData) => {
    return withRetry(async () => {
        const response = await api.request(`/medications/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(medicationData)
        });
        return handleApiResponse(response);
    });
};

export const apiDeleteMedication = (id) => {
    return withRetry(async () => {
        const response = await api.request(`/medications/${id}/`, { method: 'DELETE' });
        return response.ok;
    });
};

// Vitals Management API Functions
export const apiGetVitals = (filters = {}) => {
    return withRetry(async () => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, value);
        });
        const queryString = params.toString();
        const endpoint = queryString ? `/vitals/?${queryString}` : '/vitals/';
        return api.request(endpoint).then(handleApiResponse);
    });
};

export const apiCreateVital = (vitalData) => {
    return withRetry(async () => {
        return api.addVital(vitalData);
    });
};

export const apiGetVital = (id) => {
    return withRetry(async () => {
        return api.request(`/vitals/${id}/`).then(handleApiResponse);
    });
};

export const apiUpdateVital = (id, vitalData) => {
    return withRetry(async () => {
        const response = await api.request(`/vitals/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(vitalData)
        });
        return handleApiResponse(response);
    });
};

export const apiDeleteVital = async (id) => {
    return withRetry(async () => {
        const response = await api.request(`/vitals/${id}/`, { method: 'DELETE' });
        return response.ok;
    });
};

export const apiGetVitalsTrends = (vitalType, days = 30) => {
    return withRetry(async () => {
        const params = new URLSearchParams({ type: vitalType, days: days.toString() });
        return api.request(`/vitals/trends/?${params.toString()}`).then(handleApiResponse);
    });
};

export const apiGetVitalsSummary = () => {
    return withRetry(async () => {
        return api.request('/vitals/summary/').then(handleApiResponse);
    });
};

export const apiGetVitalsStatistics = (vitalType = null, days = 30) => {
    return withRetry(async () => {
        const params = new URLSearchParams({ days: days.toString() });
        if (vitalType) params.append('type', vitalType);
        return api.request(`/vitals/statistics/?${params.toString()}`).then(handleApiResponse);
    });
};

export const apiGetVitalTypes = () => {
    return withRetry(async () => {
        return api.request('/vitals/types/').then(handleApiResponse);
    });
};

// Reports Management API Functions
export const apiGetReports = (filters = {}) => {
    return withRetry(async () => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, value);
        });
        const queryString = params.toString();
        const endpoint = queryString ? `/reports/?${queryString}` : '/reports/';
        return api.request(endpoint).then(handleApiResponse);
    });
};

export const apiGetReport = (id) => {
    return withRetry(async () => {
        return api.request(`/reports/${id}/`).then(handleApiResponse);
    });
};

export const apiGenerateReport = (reportData) => {
    return withRetry(async () => {
        const response = await api.request('/reports/generate/', {
            method: 'POST',
            body: JSON.stringify(reportData)
        });
        return handleApiResponse(response);
    });
};

export const apiDownloadReport = async (id) => {
    return withRetry(async () => {
        const response = await api.request(`/reports/${id}/download/`);
        if (!response.ok) {
            throw new Error(`Failed to download report: ${response.status}`);
        }
        return response.blob();
    });
};

export const apiPreviewReport = async (id) => {
    return withRetry(async () => {
        const response = await api.request(`/reports/${id}/preview/`);
        if (!response.ok) {
            throw new Error(`Failed to preview report: ${response.status}`);
        }
        return response.blob();
    });
};

export const apiShareReport = (id, shareOptions = {}) => {
    return withRetry(async () => {
        const response = await api.request(`/reports/${id}/share/`, {
            method: 'POST',
            body: JSON.stringify(shareOptions)
        });
        return handleApiResponse(response);
    });
};

export const apiDeleteReport = async (id) => {
    return withRetry(async () => {
        const response = await api.request(`/reports/${id}/`, { method: 'DELETE' });
        return response.ok;
    });
};

// Secure File Upload API Functions
export const apiUploadPrescriptionImage = (prescriptionId, formData) => {
    return withRetry(async () => {
        return api.uploadPrescriptionImage(prescriptionId, formData);
    });
};

export const apiValidateFileUpload = (formData) => {
    return withRetry(async () => {
        return api.validateFileUpload(formData);
    });
};

export const apiDeletePrescriptionImage = (prescriptionId) => {
    return withRetry(async () => {
        return api.deletePrescriptionImage(prescriptionId);
    });
};

export const apiGetStorageUsage = () => {
    return withRetry(async () => {
        return api.getStorageUsage();
    });
};

export const apiCleanupFiles = (daysOld = 30) => {
    return withRetry(async () => {
        return api.cleanupFiles(daysOld);
    });
};

export const apiGetReportTemplates = () => {
    return withRetry(async () => {
        return api.request('/reports/templates/').then(handleApiResponse);
    });
};

export const apiScheduleReport = (scheduleData) => {
    return withRetry(async () => {
        const response = await api.request('/reports/schedule/', {
            method: 'POST',
            body: JSON.stringify(scheduleData)
        });
        return handleApiResponse(response);
    });
};

// Emergency Management API Functions
export const apiGetEmergencyContacts = () => {
    return withRetry(async () => {
        return api.getEmergencyContacts();
    });
};

export const apiGetEmergencyContact = (id) => {
    return withRetry(async () => {
        return api.request(`/emergency/contacts/${id}/`).then(handleApiResponse);
    });
};

export const apiCreateEmergencyContact = (contactData) => {
    return withRetry(async () => {
        const response = await api.request('/emergency/contacts/', {
            method: 'POST',
            body: JSON.stringify(contactData)
        });
        return handleApiResponse(response);
    });
};

export const apiUpdateEmergencyContact = (id, contactData) => {
    return withRetry(async () => {
        const response = await api.request(`/emergency/contacts/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(contactData)
        });
        return handleApiResponse(response);
    });
};

export const apiDeleteEmergencyContact = (id) => {
    return withRetry(async () => {
        const response = await api.request(`/emergency/contacts/${id}/`, { method: 'DELETE' });
        return response.ok;
    });
};

export const apiSetPrimaryEmergencyContact = (id) => {
    return withRetry(async () => {
        const response = await api.request(`/emergency/contacts/${id}/set_primary/`, {
            method: 'POST'
        });
        return handleApiResponse(response);
    });
};

export const apiGetPrimaryEmergencyContact = () => {
    return withRetry(async () => {
        return api.request('/emergency/contacts/primary/').then(handleApiResponse);
    });
};

// Emergency Alert API Functions
export const apiGetEmergencyAlerts = (filters = {}) => {
    return withRetry(async () => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== null && value !== undefined) params.append(key, value);
        });
        const queryString = params.toString();
        const endpoint = queryString ? `/emergency/alerts/?${queryString}` : '/emergency/alerts/';
        return api.request(endpoint).then(handleApiResponse);
    });
};

export const apiGetEmergencyAlert = (id) => {
    return withRetry(async () => {
        return api.request(`/emergency/alerts/${id}/`).then(handleApiResponse);
    });
};

export const apiSendEmergencyAlert = (alertData) => {
    return withRetry(async () => {
        const response = await api.request('/emergency/alerts/send_alert/', {
            method: 'POST',
            body: JSON.stringify(alertData)
        });
        return handleApiResponse(response);
    });
};

export const apiResolveEmergencyAlert = (id) => {
    return withRetry(async () => {
        const response = await api.request(`/emergency/alerts/${id}/resolve/`, {
            method: 'POST'
        });
        return handleApiResponse(response);
    });
};

export const apiCancelEmergencyAlert = (id) => {
    return withRetry(async () => {
        const response = await api.request(`/emergency/alerts/${id}/cancel/`, {
            method: 'POST'
        });
        return handleApiResponse(response);
    });
};

export const apiGetEmergencyStatus = () => {
    return withRetry(async () => {
        return api.request('/emergency/alerts/status/').then(handleApiResponse);
    });
};

export const apiGetEmergencyAlertHistory = (days = 30) => {
    return withRetry(async () => {
        const params = new URLSearchParams({ days: days.toString() });
        return api.request(`/emergency/alerts/history/?${params.toString()}`).then(handleApiResponse);
    });
};

export const apiGetProfile = () => api.getProfile();
export const apiUpdateProfile = (profileData) => api.updateProfile(profileData);
export const apiChangePassword = (passwordData) => api.changePassword(passwordData.current_password, passwordData.new_password, passwordData.new_password);
export const apiDeleteAccount = () => api.deleteAccount();

// Export the API client class and instance
export { ApiClient, api };