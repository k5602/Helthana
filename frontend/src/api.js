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
window.api = new ApiClient();