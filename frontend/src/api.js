/**
 * Secure API Communication Module
 * Handles all backend API interactions with environment-based configuration
 */

import { config, API_ENDPOINTS } from './config/environment.js';

const API_BASE_URL = config.api.baseUrl;

class ApiClient {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.token = localStorage.getItem('access_token');
        this.timeout = config.api.timeout;
        this.maxRetries = config.api.maxRetries;
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
        const response = await this.request(API_ENDPOINTS.AUTH.LOGIN, {
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
        const response = await this.request(API_ENDPOINTS.AUTH.REGISTER, {
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
            const response = await this.request(API_ENDPOINTS.AUTH.REFRESH_TOKEN, {
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
        const response = await this.request(API_ENDPOINTS.AUTH.PASSWORD_RESET, {
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
        const response = await this.request(API_ENDPOINTS.AUTH.PASSWORD_RESET_CONFIRM, {
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
        const response = await this.request(API_ENDPOINTS.AUTH.VERIFY_EMAIL, {
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
        const response = await this.request(API_ENDPOINTS.AUTH.RESEND_VERIFICATION, {
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
        const response = await this.request(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
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
        const response = await this.request(API_ENDPOINTS.AUTH.PROFILE);
        
        if (!response.ok) {
            const errorData = await this.safeJsonParse(response);
            return errorData;
        }
        
        return this.safeJsonParse(response);
    }

    // Update user profile
    async updateProfile(profileData) {
        const response = await this.request(API_ENDPOINTS.AUTH.PROFILE, {
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
        const response = await this.request(API_ENDPOINTS.AUTH.UPDATE_EMAIL, {
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
        const response = await this.request(API_ENDPOINTS.AUTH.DELETE_ACCOUNT, {
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
        const response = await this.request(API_ENDPOINTS.AUTH.SECURITY_LOGS);
        
        if (!response.ok) {
            const errorData = await this.safeJsonParse(response);
            return errorData;
        }
        
        return this.safeJsonParse(response);
    }

    // Enhanced logout with session termination
    async logout(refreshToken) {
        const response = await this.request(API_ENDPOINTS.AUTH.LOGOUT, {
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
        const response = await this.request(API_ENDPOINTS.AUTH.SESSIONS, {
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
        const response = await this.request(API_ENDPOINTS.AUTH.SESSIONS_TERMINATE, {
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
        const response = await this.request(API_ENDPOINTS.AUTH.SESSIONS_TERMINATE_ALL, {
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
        const response = await this.request(API_ENDPOINTS.PRESCRIPTIONS.BASE);
        return this.safeJsonParse(response);
    }

    async uploadPrescription(formData) {
        const response = await this.request(API_ENDPOINTS.PRESCRIPTIONS.BASE, {
            method: 'POST',
            headers: {}, // Let browser set Content-Type for FormData
            body: formData
        });
        return this.safeJsonParse(response);
    }

    async uploadPrescriptionImage(prescriptionId, formData) {
        const response = await this.request(API_ENDPOINTS.PRESCRIPTIONS.UPLOAD_IMAGE(prescriptionId), {
            method: 'POST',
            headers: {}, // Let browser set Content-Type for FormData
            body: formData
        });
        return this.safeJsonParse(response);
    }

    async validateFileUpload(formData) {
        const response = await this.request(API_ENDPOINTS.PRESCRIPTIONS.VALIDATE_UPLOAD, {
            method: 'POST',
            headers: {}, // Let browser set Content-Type for FormData
            body: formData
        });
        return this.safeJsonParse(response);
    }

    async deletePrescriptionImage(prescriptionId) {
        const response = await this.request(API_ENDPOINTS.PRESCRIPTIONS.DELETE_IMAGE(prescriptionId), {
            method: 'DELETE'
        });
        return this.safeJsonParse(response);
    }

    async getStorageUsage() {
        const response = await this.request(API_ENDPOINTS.PRESCRIPTIONS.STORAGE_USAGE);
        return this.safeJsonParse(response);
    }

    async cleanupFiles(daysOld = 30) {
        const response = await this.request(API_ENDPOINTS.PRESCRIPTIONS.CLEANUP_FILES, {
            method: 'POST',
            body: JSON.stringify({ days_old: daysOld })
        });
        return this.safeJsonParse(response);
    }

    // Vitals methods
    async getVitals(type = null) {
        const endpoint = type ? `${API_ENDPOINTS.VITALS.BASE}?type=${type}` : API_ENDPOINTS.VITALS.BASE;
        const response = await this.request(endpoint);
        return this.safeJsonParse(response);
    }

    async addVital(vitalData) {
        const response = await this.request(API_ENDPOINTS.VITALS.BASE, {
            method: 'POST',
            body: JSON.stringify(vitalData)
        });
        return this.safeJsonParse(response);
    }

    // Reports methods
    async getReports() {
        const response = await this.request(API_ENDPOINTS.REPORTS.BASE);
        return this.safeJsonParse(response);
    }

    async generateReport(reportData) {
        const response = await this.request(API_ENDPOINTS.REPORTS.BASE, {
            method: 'POST',
            body: JSON.stringify(reportData)
        });
        return this.safeJsonParse(response);
    }

    // Emergency methods
    async getEmergencyContacts() {
        const response = await this.request(API_ENDPOINTS.EMERGENCY.CONTACTS);
        return this.safeJsonParse(response);
    }

    async sendEmergencyAlert(alertData) {
        const response = await this.request(API_ENDPOINTS.EMERGENCY.SEND_ALERT, {
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
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.HEALTH}`, { 
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
            api.request(API_ENDPOINTS.PRESCRIPTIONS.STATISTICS).then(handleApiResponse).catch(() => ({ total_prescriptions: 0, pending_prescriptions: 0 })),
            api.request(API_ENDPOINTS.VITALS.TYPES).then(handleApiResponse).catch(() => ({ total_readings: 0, recent_count: 0 })),
            api.request(`${API_ENDPOINTS.REPORTS.BASE}?limit=1`).then(handleApiResponse).catch(() => ({ count: 0 })),
            api.request(API_ENDPOINTS.EMERGENCY.CONTACTS).then(handleApiResponse).catch(() => [])
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
            api.request(API_ENDPOINTS.PRESCRIPTIONS.RECENT).then(handleApiResponse).catch(() => []),
            api.request(`${API_ENDPOINTS.VITALS.BASE}?limit=5`).then(handleApiResponse).catch(() => ({ results: [] })),
            api.request(`${API_ENDPOINTS.REPORTS.BASE}?limit=3`).then(handleApiResponse).catch(() => ({ results: [] }))
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
        const endpoint = queryString ? `${API_ENDPOINTS.PRESCRIPTIONS.BASE}?${queryString}` : API_ENDPOINTS.PRESCRIPTIONS.BASE;
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
        return api.request(API_ENDPOINTS.PRESCRIPTIONS.DETAIL(id)).then(handleApiResponse);
    });
};

export const apiUpdatePrescription = (id, data) => {
    return withRetry(async () => {
        const response = await api.request(API_ENDPOINTS.PRESCRIPTIONS.DETAIL(id), {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
        return handleApiResponse(response);
    });
};

export const apiDeletePrescription = async (id) => {
    return withRetry(async () => {
        const response = await api.request(API_ENDPOINTS.PRESCRIPTIONS.DETAIL(id), { method: 'DELETE' });
        return response.ok;
    });
};

export const apiProcessPrescriptionOCR = (id) => {
    return withRetry(async () => {
        const response = await api.request(API_ENDPOINTS.PRESCRIPTIONS.PROCESS_OCR(id), {
            method: 'POST'
        });
        return handleApiResponse(response);
    });
};

export const apiSearchPrescriptions = (searchQuery, filters = {}) => {
    return withRetry(async () => {
        const params = new URLSearchParams({ search: searchQuery, ...filters });
        return api.request(`${API_ENDPOINTS.PRESCRIPTIONS.SEARCH}?${params.toString()}`).then(handleApiResponse);
    });
};

export const apiGetRecentPrescriptions = () => {
    return withRetry(async () => {
        return api.request(API_ENDPOINTS.PRESCRIPTIONS.RECENT).then(handleApiResponse);
    });
};

export const apiGetPrescriptionStatistics = () => {
    return withRetry(async () => {
        return api.request(API_ENDPOINTS.PRESCRIPTIONS.STATISTICS).then(handleApiResponse);
    });
};

// Medication API Functions
export const apiGetMedications = (prescriptionId = null) => {
    return withRetry(async () => {
        const endpoint = prescriptionId 
            ? `${API_ENDPOINTS.MEDICATIONS.BASE}?prescription_id=${prescriptionId}` 
            : API_ENDPOINTS.MEDICATIONS.BASE;
        return api.request(endpoint).then(handleApiResponse);
    });
};

export const apiCreateMedication = (medicationData) => {
    return withRetry(async () => {
        const response = await api.request(API_ENDPOINTS.MEDICATIONS.BASE, {
            method: 'POST',
            body: JSON.stringify(medicationData)
        });
        return handleApiResponse(response);
    });
};

export const apiUpdateMedication = (id, medicationData) => {
    return withRetry(async () => {
        const response = await api.request(API_ENDPOINTS.MEDICATIONS.DETAIL(id), {
            method: 'PATCH',
            body: JSON.stringify(medicationData)
        });
        return handleApiResponse(response);
    });
};

export const apiDeleteMedication = (id) => {
    return withRetry(async () => {
        const response = await api.request(API_ENDPOINTS.MEDICATIONS.DETAIL(id), { method: 'DELETE' });
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
        const endpoint = queryString ? `${API_ENDPOINTS.VITALS.BASE}?${queryString}` : API_ENDPOINTS.VITALS.BASE;
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
        return api.request(API_ENDPOINTS.VITALS.DETAIL(id)).then(handleApiResponse);
    });
};

export const apiUpdateVital = (id, vitalData) => {
    return withRetry(async () => {
        const response = await api.request(API_ENDPOINTS.VITALS.DETAIL(id), {
            method: 'PATCH',
            body: JSON.stringify(vitalData)
        });
        return handleApiResponse(response);
    });
};

export const apiDeleteVital = async (id) => {
    return withRetry(async () => {
        const response = await api.request(API_ENDPOINTS.VITALS.DETAIL(id), { method: 'DELETE' });
        return response.ok;
    });
};

export const apiGetVitalsTrends = (vitalType, days = 30) => {
    return withRetry(async () => {
        const params = new URLSearchParams({ type: vitalType, days: days.toString() });
        return api.request(`${API_ENDPOINTS.VITALS.TRENDS}?${params.toString()}`).then(handleApiResponse);
    });
};

export const apiGetVitalsSummary = () => {
    return withRetry(async () => {
        return api.request(API_ENDPOINTS.VITALS.SUMMARY).then(handleApiResponse);
    });
};

export const apiGetVitalsStatistics = (vitalType = null, days = 30) => {
    return withRetry(async () => {
        const params = new URLSearchParams({ days: days.toString() });
        if (vitalType) params.append('type', vitalType);
        return api.request(`${API_ENDPOINTS.VITALS.STATISTICS}?${params.toString()}`).then(handleApiResponse);
    });
};

export const apiGetVitalTypes = () => {
    return withRetry(async () => {
        return api.request(API_ENDPOINTS.VITALS.TYPES).then(handleApiResponse);
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
        const endpoint = queryString ? `${API_ENDPOINTS.REPORTS.BASE}?${queryString}` : API_ENDPOINTS.REPORTS.BASE;
        return api.request(endpoint).then(handleApiResponse);
    });
};

export const apiGetReport = (id) => {
    return withRetry(async () => {
        return api.request(API_ENDPOINTS.REPORTS.DETAIL(id)).then(handleApiResponse);
    });
};

export const apiGenerateReport = (reportData) => {
    return withRetry(async () => {
        const response = await api.request(API_ENDPOINTS.REPORTS.GENERATE, {
            method: 'POST',
            body: JSON.stringify(reportData)
        });
        return handleApiResponse(response);
    });
};

export const apiDownloadReport = async (id) => {
    return withRetry(async () => {
        const response = await api.request(API_ENDPOINTS.REPORTS.DOWNLOAD(id));
        if (!response.ok) {
            throw new Error(`Failed to download report: ${response.status}`);
        }
        return response.blob();
    });
};

export const apiPreviewReport = async (id) => {
    return withRetry(async () => {
        const response = await api.request(API_ENDPOINTS.REPORTS.PREVIEW(id));
        if (!response.ok) {
            throw new Error(`Failed to preview report: ${response.status}`);
        }
        return response.blob();
    });
};

export const apiShareReport = (id, shareOptions = {}) => {
    return withRetry(async () => {
        const response = await api.request(API_ENDPOINTS.REPORTS.SHARE(id), {
            method: 'POST',
            body: JSON.stringify(shareOptions)
        });
        return handleApiResponse(response);
    });
};

export const apiDeleteReport = async (id) => {
    return withRetry(async () => {
        const response = await api.request(API_ENDPOINTS.REPORTS.DETAIL(id), { method: 'DELETE' });
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
        return api.request(API_ENDPOINTS.REPORTS.TEMPLATES).then(handleApiResponse);
    });
};

export const apiScheduleReport = (scheduleData) => {
    return withRetry(async () => {
        const response = await api.request(API_ENDPOINTS.REPORTS.SCHEDULE, {
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
        return api.request(API_ENDPOINTS.EMERGENCY.CONTACT_DETAIL(id)).then(handleApiResponse);
    });
};

export const apiCreateEmergencyContact = (contactData) => {
    return withRetry(async () => {
        const response = await api.request(API_ENDPOINTS.EMERGENCY.CONTACTS, {
            method: 'POST',
            body: JSON.stringify(contactData)
        });
        return handleApiResponse(response);
    });
};

export const apiUpdateEmergencyContact = (id, contactData) => {
    return withRetry(async () => {
        const response = await api.request(API_ENDPOINTS.EMERGENCY.CONTACT_DETAIL(id), {
            method: 'PATCH',
            body: JSON.stringify(contactData)
        });
        return handleApiResponse(response);
    });
};

export const apiDeleteEmergencyContact = (id) => {
    return withRetry(async () => {
        const response = await api.request(API_ENDPOINTS.EMERGENCY.CONTACT_DETAIL(id), { method: 'DELETE' });
        return response.ok;
    });
};

export const apiSetPrimaryEmergencyContact = (id) => {
    return withRetry(async () => {
        const response = await api.request(API_ENDPOINTS.EMERGENCY.SET_PRIMARY(id), {
            method: 'POST'
        });
        return handleApiResponse(response);
    });
};

export const apiGetPrimaryEmergencyContact = () => {
    return withRetry(async () => {
        return api.request(API_ENDPOINTS.EMERGENCY.PRIMARY_CONTACT).then(handleApiResponse);
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
        const endpoint = queryString ? `${API_ENDPOINTS.EMERGENCY.ALERTS}?${queryString}` : API_ENDPOINTS.EMERGENCY.ALERTS;
        return api.request(endpoint).then(handleApiResponse);
    });
};

export const apiGetEmergencyAlert = (id) => {
    return withRetry(async () => {
        return api.request(API_ENDPOINTS.EMERGENCY.ALERT_DETAIL(id)).then(handleApiResponse);
    });
};

export const apiSendEmergencyAlert = (alertData) => {
    return withRetry(async () => {
        const response = await api.request(API_ENDPOINTS.EMERGENCY.SEND_ALERT, {
            method: 'POST',
            body: JSON.stringify(alertData)
        });
        return handleApiResponse(response);
    });
};

export const apiResolveEmergencyAlert = (id) => {
    return withRetry(async () => {
        const response = await api.request(API_ENDPOINTS.EMERGENCY.RESOLVE_ALERT(id), {
            method: 'POST'
        });
        return handleApiResponse(response);
    });
};

export const apiCancelEmergencyAlert = (id) => {
    return withRetry(async () => {
        const response = await api.request(API_ENDPOINTS.EMERGENCY.CANCEL_ALERT(id), {
            method: 'POST'
        });
        return handleApiResponse(response);
    });
};

export const apiGetEmergencyStatus = () => {
    return withRetry(async () => {
        return api.request(API_ENDPOINTS.EMERGENCY.STATUS).then(handleApiResponse);
    });
};

export const apiGetEmergencyAlertHistory = (days = 30) => {
    return withRetry(async () => {
        const params = new URLSearchParams({ days: days.toString() });
        return api.request(`${API_ENDPOINTS.EMERGENCY.HISTORY}?${params.toString()}`).then(handleApiResponse);
    });
};

export const apiGetProfile = () => api.getProfile();
export const apiUpdateProfile = (profileData) => api.updateProfile(profileData);
export const apiChangePassword = (passwordData) => api.changePassword(passwordData.current_password, passwordData.new_password, passwordData.new_password);
export const apiDeleteAccount = () => api.deleteAccount();

// Export the API client class and instance
export { ApiClient, api };
