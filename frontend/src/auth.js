/**
 * Enhanced Authentication Module
 * Handles user authentication, session management, password reset, and email verification
 */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.rememberMe = false;
        this.tokenRefreshTimer = null;
        this.currentSessionId = null;
        this.refreshTokenJti = null;
        this.checkAuthStatus();
        this.setupTokenRefresh();
    }

    // Check if user is authenticated
    isAuthenticated() {
        const token = this.getStoredToken();
        return !!token && !this.isTokenExpired(token);
    }

    // Get stored token from appropriate storage
    getStoredToken() {
        return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    }

    // Check if JWT token is expired
    isTokenExpired(token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Math.floor(Date.now() / 1000);
            return payload.exp < currentTime;
        } catch (error) {
            return true;
        }
    }

    // Setup automatic token refresh
    setupTokenRefresh() {
        const refreshToken = this.getRefreshToken();
        if (refreshToken) {
            // Set up refresh timer for 5 minutes before token expires
            const token = this.getStoredToken();
            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    const expiryTime = payload.exp * 1000;
                    const refreshTime = expiryTime - (5 * 60 * 1000); // 5 minutes before expiry
                    const timeUntilRefresh = refreshTime - Date.now();
                    
                    if (timeUntilRefresh > 0) {
                        this.tokenRefreshTimer = setTimeout(() => {
                            this.refreshAccessToken();
                        }, timeUntilRefresh);
                    }
                } catch (error) {
                    console.error('Error setting up token refresh:', error);
                }
            }
        }
    }

    // Get refresh token
    getRefreshToken() {
        return localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
    }

    // Check authentication status on page load
    checkAuthStatus() {
        if (this.isAuthenticated()) {
            this.loadUserProfile();
        } else {
            // Try to refresh token if available
            const refreshToken = this.getRefreshToken();
            if (refreshToken) {
                this.refreshAccessToken();
            }
        }
    }

    // Enhanced login with remember me functionality
    async login(username, password, rememberMe = false) {
        try {
            this.rememberMe = rememberMe;
            
            // Send remember_me preference to backend
            const loginData = { username, password, remember_me: rememberMe };
            const response = await window.api.request('/auth/login/', {
                method: 'POST',
                body: JSON.stringify(loginData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                return this.handleAuthError(errorData);
            }
            
            const data = await response.json();
            
            if (data.access) {
                this.storeTokens(data.access, data.refresh, rememberMe);
                this.currentUser = data.user;
                this.currentSessionId = data.session_id;
                this.extractRefreshTokenJti(data.refresh);
                this.setupTokenRefresh();
                
                return { 
                    success: true, 
                    user: data.user,
                    emailVerified: data.user.email_verified,
                    sessionId: data.session_id
                };
            } else {
                return this.handleAuthError(data);
            }
        } catch (error) {
            console.error('Login error:', error);
            return this.handleNetworkError(error, 'Login failed. Please try again.');
        }
    }

    // Enhanced registration with email verification
    async register(userData) {
        try {
            // Validate passwords match
            if (userData.password !== userData.password_confirm) {
                return { success: false, error: "Passwords don't match" };
            }

            const response = await window.api.register(userData);
            
            if (response.user || response.message) {
                return { 
                    success: true, 
                    user: response.user,
                    message: response.message || 'Registration successful! Please check your email to verify your account.',
                    emailVerificationSent: response.email_verification_sent
                };
            } else {
                return this.handleAuthError(response);
            }
        } catch (error) {
            console.error('Registration error:', error);
            return this.handleNetworkError(error, 'Registration failed. Please try again.');
        }
    }

    // Password reset request
    async requestPasswordReset(email) {
        try {
            const response = await window.api.requestPasswordReset(email);
            
            if (response.message) {
                return { 
                    success: true, 
                    message: response.message 
                };
            } else {
                return this.handleAuthError(response);
            }
        } catch (error) {
            console.error('Password reset request error:', error);
            return this.handleNetworkError(error, 'Failed to send password reset email.');
        }
    }

    // Password reset confirmation
    async confirmPasswordReset(token, newPassword, confirmPassword) {
        try {
            if (newPassword !== confirmPassword) {
                return { success: false, error: "Passwords don't match" };
            }

            const response = await window.api.confirmPasswordReset(token, newPassword);
            
            if (response.message) {
                return { 
                    success: true, 
                    message: response.message 
                };
            } else {
                return this.handleAuthError(response);
            }
        } catch (error) {
            console.error('Password reset confirmation error:', error);
            return this.handleNetworkError(error, 'Failed to reset password.');
        }
    }

    // Email verification
    async verifyEmail(token) {
        try {
            const response = await window.api.verifyEmail(token);
            
            if (response.message) {
                // Update current user if logged in
                if (this.currentUser) {
                    this.currentUser.email_verified = true;
                }
                
                return { 
                    success: true, 
                    message: response.message,
                    user: response.user 
                };
            } else {
                return this.handleAuthError(response);
            }
        } catch (error) {
            console.error('Email verification error:', error);
            return this.handleNetworkError(error, 'Failed to verify email.');
        }
    }

    // Resend email verification
    async resendEmailVerification(email) {
        try {
            const response = await window.api.resendEmailVerification(email);
            
            if (response.message) {
                return { 
                    success: true, 
                    message: response.message 
                };
            } else {
                return this.handleAuthError(response);
            }
        } catch (error) {
            console.error('Resend email verification error:', error);
            return this.handleNetworkError(error, 'Failed to resend verification email.');
        }
    }

    // Extract JWT ID from refresh token
    extractRefreshTokenJti(refreshToken) {
        try {
            const payload = JSON.parse(atob(refreshToken.split('.')[1]));
            this.refreshTokenJti = payload.jti;
        } catch (error) {
            console.error('Error extracting refresh token JTI:', error);
        }
    }

    // Refresh access token with enhanced session management
    async refreshAccessToken() {
        try {
            const refreshToken = this.getRefreshToken();
            if (!refreshToken) {
                this.logout();
                return false;
            }

            const response = await window.api.request('/auth/token/refresh/', {
                method: 'POST',
                body: JSON.stringify({ refresh: refreshToken })
            });
            
            if (!response.ok) {
                this.logout();
                return false;
            }
            
            const data = await response.json();
            
            if (data.access) {
                // Store new tokens (refresh token might have rotated)
                const newRefreshToken = data.refresh || refreshToken;
                this.storeTokens(data.access, newRefreshToken, this.rememberMe);
                
                // Update session tracking
                if (data.session_id) {
                    this.currentSessionId = data.session_id;
                }
                
                // Extract new refresh token JTI if token was rotated
                if (data.refresh) {
                    this.extractRefreshTokenJti(data.refresh);
                }
                
                window.api.setToken(data.access);
                this.setupTokenRefresh();
                return true;
            } else {
                this.logout();
                return false;
            }
        } catch (error) {
            console.error('Token refresh error:', error);
            this.logout();
            return false;
        }
    }

    // Store tokens in appropriate storage
    storeTokens(accessToken, refreshToken, rememberMe) {
        const storage = rememberMe ? localStorage : sessionStorage;
        
        // Clear tokens from both storages first
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
        
        // Store in appropriate storage
        storage.setItem('access_token', accessToken);
        storage.setItem('refresh_token', refreshToken);
        
        // Always store remember me preference in localStorage
        localStorage.setItem('remember_me', rememberMe.toString());
        
        window.api.setToken(accessToken);
    }

    // Handle authentication errors using the global error handler
    handleAuthError(response) {
        if (window.errorHandler) {
            return window.errorHandler.handleError(response, { type: 'auth' });
        }
        
        // Fallback for backward compatibility
        let errorMessage = 'Authentication failed';
        
        if (response.error) {
            // New standardized error format
            errorMessage = response.error.message || errorMessage;
            if (response.error.details) {
                const details = response.error.details;
                if (details.username) {
                    errorMessage = `Username: ${Array.isArray(details.username) ? details.username[0] : details.username}`;
                } else if (details.email) {
                    errorMessage = `Email: ${Array.isArray(details.email) ? details.email[0] : details.email}`;
                } else if (details.password) {
                    errorMessage = `Password: ${Array.isArray(details.password) ? details.password[0] : details.password}`;
                } else if (details.non_field_errors) {
                    errorMessage = Array.isArray(details.non_field_errors) ? details.non_field_errors[0] : details.non_field_errors;
                }
            }
        } else {
            // Legacy error format handling
            if (response.username) {
                errorMessage = `Username: ${Array.isArray(response.username) ? response.username[0] : response.username}`;
            } else if (response.email) {
                errorMessage = `Email: ${Array.isArray(response.email) ? response.email[0] : response.email}`;
            } else if (response.password) {
                errorMessage = `Password: ${Array.isArray(response.password) ? response.password[0] : response.password}`;
            } else if (response.non_field_errors) {
                errorMessage = Array.isArray(response.non_field_errors) ? response.non_field_errors[0] : response.non_field_errors;
            } else if (response.detail) {
                errorMessage = response.detail;
            }
        }
        
        return { success: false, error: errorMessage };
    }

    // Handle network errors using the global error handler
    handleNetworkError(error, defaultMessage) {
        if (window.errorHandler) {
            return window.errorHandler.handleError(error, { 
                type: 'network',
                action: defaultMessage.replace('failed. Please try again.', '').replace('Failed to ', '').toLowerCase()
            });
        }
        
        // Fallback for backward compatibility
        let errorMessage = defaultMessage;
        
        if (error.message) {
            if (error.message.includes('fetch')) {
                errorMessage = 'Unable to connect to server. Please check your connection.';
            } else if (error.message.includes('CORS')) {
                errorMessage = 'Connection blocked. Please try again later.';
            } else {
                errorMessage = error.message;
            }
        }
        
        return { success: false, error: errorMessage };
    }

    // Validate form data
    validateLoginForm(username, password) {
        const errors = [];
        
        if (!username || username.trim().length === 0) {
            errors.push('Username is required');
        }
        
        if (!password || password.length === 0) {
            errors.push('Password is required');
        }
        
        return errors;
    }

    // Validate registration form
    validateRegistrationForm(userData) {
        const errors = [];
        
        if (!userData.first_name || userData.first_name.trim().length === 0) {
            errors.push('First name is required');
        }
        
        if (!userData.last_name || userData.last_name.trim().length === 0) {
            errors.push('Last name is required');
        }
        
        if (!userData.username || userData.username.trim().length === 0) {
            errors.push('Username is required');
        } else if (userData.username.length < 3) {
            errors.push('Username must be at least 3 characters long');
        }
        
        if (!userData.email || userData.email.trim().length === 0) {
            errors.push('Email is required');
        } else if (!this.isValidEmail(userData.email)) {
            errors.push('Please enter a valid email address');
        }
        
        if (!userData.password || userData.password.length === 0) {
            errors.push('Password is required');
        } else if (userData.password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        } else if (!this.isStrongPassword(userData.password)) {
            errors.push('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
        }
        
        if (userData.password !== userData.password_confirm) {
            errors.push("Passwords don't match");
        }
        
        return errors;
    }

    // Email validation
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Strong password validation
    isStrongPassword(password) {
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
    }

    // Clear authentication data
    clearAuthData() {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('remember_me');
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
        
        if (this.tokenRefreshTimer) {
            clearTimeout(this.tokenRefreshTimer);
            this.tokenRefreshTimer = null;
        }
        
        window.api.clearToken();
        this.currentUser = null;
    }

    // Enhanced logout with proper session termination
    async logout() {
        try {
            const refreshToken = this.getRefreshToken();
            
            if (refreshToken) {
                // Call backend logout to terminate session
                await window.api.logout(refreshToken);
            }
        } catch (error) {
            console.error('Logout API call failed:', error);
            // Continue with local cleanup even if API call fails
        }
        
        this.clearAuthData();
        
        // Redirect to login page if not already there
        if (!window.location.pathname.includes('login') && !window.location.pathname.includes('index')) {
            window.location.href = '/';
        }
    }

    // Check if email verification is required
    requiresEmailVerification() {
        return this.currentUser && !this.currentUser.email_verified;
    }

    // Get user's email for verification
    getUserEmail() {
        return this.currentUser ? this.currentUser.email : null;
    }

    // Load user profile
    async loadUserProfile() {
        try {
            const response = await window.api.request('/auth/profile/');
            if (response.ok) {
                this.currentUser = await response.json();
                this.updateUIWithUser();
            }
        } catch (error) {
            console.error('Failed to load user profile:', error);
        }
    }

    // Update UI with user information
    updateUIWithUser() {
        if (this.currentUser) {
            const userInitial = document.getElementById('user-initial');
            if (userInitial) {
                userInitial.textContent = this.currentUser.first_name?.charAt(0) || 
                                         this.currentUser.username?.charAt(0) || 'U';
            }
        }
    }

    // Redirect to dashboard
    redirectToDashboard() {
        window.location.href = '/dashboard.html';
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Profile management methods
    async updateProfile(profileData) {
        try {
            const response = await window.api.updateProfile(profileData);
            
            if (response.id) {
                // Update current user data
                this.currentUser = { ...this.currentUser, ...response };
                return { 
                    success: true, 
                    user: response,
                    message: 'Profile updated successfully!'
                };
            } else {
                return this.handleAuthError(response);
            }
        } catch (error) {
            console.error('Profile update error:', error);
            return this.handleNetworkError(error, 'Failed to update profile.');
        }
    }

    // Change password
    async changePassword(currentPassword, newPassword, confirmPassword) {
        try {
            if (newPassword !== confirmPassword) {
                return { success: false, error: "New passwords don't match" };
            }

            const response = await window.api.changePassword(currentPassword, newPassword, confirmPassword);
            
            if (response.message) {
                return { 
                    success: true, 
                    message: response.message 
                };
            } else {
                return this.handleAuthError(response);
            }
        } catch (error) {
            console.error('Password change error:', error);
            return this.handleNetworkError(error, 'Failed to change password.');
        }
    }

    // Update email address
    async updateEmail(newEmail, password) {
        try {
            const response = await window.api.updateEmail(newEmail, password);
            
            if (response.message) {
                // Update current user email (but mark as unverified)
                if (this.currentUser) {
                    this.currentUser.email = response.new_email;
                    this.currentUser.email_verified = false;
                }
                
                return { 
                    success: true, 
                    message: response.message,
                    newEmail: response.new_email
                };
            } else {
                return this.handleAuthError(response);
            }
        } catch (error) {
            console.error('Email update error:', error);
            return this.handleNetworkError(error, 'Failed to update email address.');
        }
    }

    // Delete account
    async deleteAccount(password, confirmation) {
        try {
            if (confirmation.toLowerCase() !== 'delete my account') {
                return { success: false, error: "Please type 'DELETE MY ACCOUNT' to confirm" };
            }

            const response = await window.api.deleteAccount(password, confirmation);
            
            if (response.message) {
                // Clear all auth data and redirect
                this.clearAuthData();
                
                return { 
                    success: true, 
                    message: response.message 
                };
            } else {
                return this.handleAuthError(response);
            }
        } catch (error) {
            console.error('Account deletion error:', error);
            return this.handleNetworkError(error, 'Failed to delete account.');
        }
    }

    // Get security logs
    async getSecurityLogs() {
        try {
            const response = await window.api.getSecurityLogs();
            
            if (Array.isArray(response)) {
                return { 
                    success: true, 
                    logs: response 
                };
            } else {
                return this.handleAuthError(response);
            }
        } catch (error) {
            console.error('Security logs error:', error);
            return this.handleNetworkError(error, 'Failed to load security logs.');
        }
    }

    // Session Management Methods

    // Get user sessions
    async getUserSessions() {
        try {
            const response = await window.api.getUserSessions(this.refreshTokenJti);
            
            if (response.sessions) {
                return { 
                    success: true, 
                    sessions: response.sessions,
                    totalSessions: response.total_sessions
                };
            } else {
                return this.handleAuthError(response);
            }
        } catch (error) {
            console.error('Get user sessions error:', error);
            return this.handleNetworkError(error, 'Failed to load sessions.');
        }
    }

    // Terminate specific session
    async terminateSession(sessionId) {
        try {
            const response = await window.api.terminateSession(sessionId);
            
            if (response.message) {
                return { 
                    success: true, 
                    message: response.message 
                };
            } else {
                return this.handleAuthError(response);
            }
        } catch (error) {
            console.error('Terminate session error:', error);
            return this.handleNetworkError(error, 'Failed to terminate session.');
        }
    }

    // Terminate all other sessions
    async terminateAllOtherSessions() {
        try {
            const response = await window.api.terminateAllSessions(this.currentSessionId);
            
            if (response.message) {
                return { 
                    success: true, 
                    message: response.message 
                };
            } else {
                return this.handleAuthError(response);
            }
        } catch (error) {
            console.error('Terminate all sessions error:', error);
            return this.handleNetworkError(error, 'Failed to terminate all sessions.');
        }
    }

    // Get current session info
    getCurrentSessionId() {
        return this.currentSessionId;
    }

    // Check if remember me is enabled
    isRememberMeEnabled() {
        return localStorage.getItem('remember_me') === 'true';
    }

    // Get device info for current session
    getCurrentDeviceInfo() {
        const userAgent = navigator.userAgent;
        const platform = navigator.platform;
        
        // Simple device detection
        let deviceType = 'desktop';
        if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
            deviceType = /iPad/.test(userAgent) ? 'tablet' : 'mobile';
        }
        
        return {
            userAgent,
            platform,
            deviceType,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    }

    // Hijack Management Methods

    // Check if current session is hijacked
    async checkHijackStatus() {
        try {
            const response = await window.api.request('/auth/hijack/status/');
            if (response.ok) {
                const data = await response.json();
                return {
                    success: true,
                    isHijacked: data.is_hijacked,
                    originalUser: data.original_user,
                    currentUser: data.current_user
                };
            } else {
                return { success: false, isHijacked: false };
            }
        } catch (error) {
            console.error('Hijack status check error:', error);
            return { success: false, isHijacked: false };
        }
    }

    // Release hijack session
    async releaseHijack() {
        try {
            const response = await window.api.request('/auth/hijack/release-api/', {
                method: 'POST'
            });
            
            if (response.ok) {
                const data = await response.json();
                return {
                    success: true,
                    message: data.message
                };
            } else {
                const errorData = await response.json();
                return this.handleAuthError(errorData);
            }
        } catch (error) {
            console.error('Release hijack error:', error);
            return this.handleNetworkError(error, 'Failed to release hijack session.');
        }
    }

    // Initialize hijack indicator on page load
    async initializeHijackIndicator() {
        const hijackStatus = await this.checkHijackStatus();
        if (hijackStatus.success && hijackStatus.isHijacked) {
            this.showHijackIndicator(hijackStatus.originalUser, hijackStatus.currentUser);
        }
    }

    // Show hijack indicator in the UI
    showHijackIndicator(originalUser, currentUser) {
        // Remove existing indicator if present
        this.removeHijackIndicator();
        
        // Create hijack indicator
        const indicator = document.createElement('div');
        indicator.id = 'hijack-indicator';
        indicator.className = 'fixed top-0 left-0 right-0 bg-warning text-warning-content p-2 z-50 shadow-lg';
        indicator.innerHTML = `
            <div class="container mx-auto flex items-center justify-between">
                <div class="flex items-center space-x-2">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                    </svg>
                    <span class="font-medium">
                        Admin Mode: Viewing as ${currentUser.first_name} ${currentUser.last_name} (${currentUser.email})
                    </span>
                </div>
                <button id="release-hijack-btn" class="btn btn-sm btn-outline">
                    Return to ${originalUser.first_name} ${originalUser.last_name}
                </button>
            </div>
        `;
        
        // Insert at the beginning of body
        document.body.insertBefore(indicator, document.body.firstChild);
        
        // Add margin to body to account for fixed indicator
        document.body.style.marginTop = '60px';
        
        // Add event listener for release button
        const releaseBtn = document.getElementById('release-hijack-btn');
        if (releaseBtn) {
            releaseBtn.addEventListener('click', async () => {
                await this.handleReleaseHijack();
            });
        }
    }

    // Remove hijack indicator
    removeHijackIndicator() {
        const indicator = document.getElementById('hijack-indicator');
        if (indicator) {
            indicator.remove();
            document.body.style.marginTop = '';
        }
    }

    // Handle release hijack button click
    async handleReleaseHijack() {
        const releaseBtn = document.getElementById('release-hijack-btn');
        if (releaseBtn) {
            releaseBtn.disabled = true;
            releaseBtn.textContent = 'Releasing...';
        }
        
        const result = await this.releaseHijack();
        
        if (result.success) {
            // Show success message
            if (window.ui && window.ui.showToast) {
                window.ui.showToast(result.message, 'success');
            }
            
            // Redirect to admin panel after a short delay
            setTimeout(() => {
                window.location.href = '/admin/';
            }, 1000);
        } else {
            // Show error message
            if (window.ui && window.ui.showToast) {
                window.ui.showToast(result.error || 'Failed to release hijack session', 'error');
            }
            
            // Re-enable button
            if (releaseBtn) {
                releaseBtn.disabled = false;
                releaseBtn.textContent = 'Return to Admin';
            }
        }
    }

    // Validate profile form
    validateProfileForm(profileData) {
        const errors = [];
        
        if (profileData.first_name && profileData.first_name.trim().length < 2) {
            errors.push('First name must be at least 2 characters long');
        }
        
        if (profileData.last_name && profileData.last_name.trim().length < 2) {
            errors.push('Last name must be at least 2 characters long');
        }
        
        if (profileData.phone_number && !this.isValidPhoneNumber(profileData.phone_number)) {
            errors.push('Please enter a valid phone number');
        }
        
        if (profileData.emergency_contact_phone && !this.isValidPhoneNumber(profileData.emergency_contact_phone)) {
            errors.push('Please enter a valid emergency contact phone number');
        }
        
        if (profileData.date_of_birth && !this.isValidDateOfBirth(profileData.date_of_birth)) {
            errors.push('Please enter a valid date of birth');
        }
        
        return errors;
    }

    // Phone number validation
    isValidPhoneNumber(phone) {
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    // Date of birth validation
    isValidDateOfBirth(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const age = today.getFullYear() - date.getFullYear();
        
        if (date > today) return false; // Future date
        if (age < 13 || age > 120) return false; // Age limits
        
        return true;
    }
}

// Global auth manager instance
window.auth = new AuthManager();

// Utility functions for backward compatibility
window.showMessage = function(message, type = 'info') {
    if (window.ui && window.ui.showToast) {
        window.ui.showToast(message, type);
    } else {
        // Fallback for pages without UI manager
        console.log(`${type.toUpperCase()}: ${message}`);
        alert(message);
    }
}

// Enhanced error display function
window.displayAuthError = function(containerId, message) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let errorDiv = container.querySelector('.auth-error');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'auth-error alert alert-error mb-4';
        container.insertBefore(errorDiv, container.firstChild);
    }
    
    errorDiv.innerHTML = `<span>${message}</span>`;
    errorDiv.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }, 5000);
}

// Clear error messages
window.clearAuthError = function(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const errorDiv = container.querySelector('.auth-error');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}
