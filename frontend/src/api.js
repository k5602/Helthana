/**
 * API Communication Module
 * Handles all backend API interactions
 */

// Determine API base URL based on environment
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000/api/v1'
    : `${window.location.protocol}//${window.location.host}/api/v1`;

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
            // Check if it's a network error (CORS, connection issues)
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
            const errorData = await response.json();
            return errorData;
        }
        
        return response.json();
    }

    async register(userData) {
        const response = await this.request('/auth/register/', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            return errorData;
        }
        
        return response.json();
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
                const data = await response.json();
                this.setToken(data.access);
                return data;
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
            const errorData = await response.json();
            return errorData;
        }
        
        return response.json();
    }

    // Password reset confirmation
    async confirmPasswordReset(token, password) {
        const response = await this.request('/auth/password-reset-confirm/', {
            method: 'POST',
            body: JSON.stringify({ token, password })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            return errorData;
        }
        
        return response.json();
    }

    // Email verification
    async verifyEmail(token) {
        const response = await this.request('/auth/verify-email/', {
            method: 'POST',
            body: JSON.stringify({ token })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            return errorData;
        }
        
        return response.json();
    }

    // Resend email verification
    async resendEmailVerification(email) {
        const response = await this.request('/auth/resend-verification/', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            return errorData;
        }
        
        return response.json();
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
            const errorData = await response.json();
            return errorData;
        }
        
        return response.json();
    }

    // Get user profile
    async getProfile() {
        const response = await this.request('/auth/profile/');
        
        if (!response.ok) {
            const errorData = await response.json();
            return errorData;
        }
        
        return response.json();
    }

    // Update user profile
    async updateProfile(profileData) {
        const response = await this.request('/auth/profile/', {
            method: 'PATCH',
            body: JSON.stringify(profileData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            return errorData;
        }
        
        return response.json();
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
            const errorData = await response.json();
            return errorData;
        }
        
        return response.json();
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
            const errorData = await response.json();
            return errorData;
        }
        
        return response.json();
    }

    // Get security logs
    async getSecurityLogs() {
        const response = await this.request('/auth/security-logs/');
        
        if (!response.ok) {
            const errorData = await response.json();
            return errorData;
        }
        
        return response.json();
    }

    // Prescription methods
    async getPrescriptions() {
        const response = await this.request('/prescriptions/');
        return response.json();
    }

    async uploadPrescription(formData) {
        const response = await this.request('/prescriptions/', {
            method: 'POST',
            headers: {}, // Let browser set Content-Type for FormData
            body: formData
        });
        return response.json();
    }

    // Vitals methods
    async getVitals(type = null) {
        const endpoint = type ? `/vitals/?type=${type}` : '/vitals/';
        const response = await this.request(endpoint);
        return response.json();
    }

    async addVital(vitalData) {
        const response = await this.request('/vitals/', {
            method: 'POST',
            body: JSON.stringify(vitalData)
        });
        return response.json();
    }

    // Reports methods
    async getReports() {
        const response = await this.request('/reports/');
        return response.json();
    }

    async generateReport(reportData) {
        const response = await this.request('/reports/', {
            method: 'POST',
            body: JSON.stringify(reportData)
        });
        return response.json();
    }

    // Emergency methods
    async getEmergencyContacts() {
        const response = await this.request('/emergency/contacts/');
        return response.json();
    }

    async sendEmergencyAlert(alertData) {
        const response = await this.request('/emergency/alert/', {
            method: 'POST',
            body: JSON.stringify(alertData)
        });
        return response.json();
    }
}

// Global API client instance
window.api = new ApiClient();