/**
 * Comprehensive Error Handling System
 * Handles all types of errors with user-friendly messages and offline support
 */

class ErrorHandler {
    constructor() {
        this.isOnline = navigator.onLine;
        this.setupOnlineStatusListeners();
        this.errorQueue = []; // Queue errors when offline
        this.retryAttempts = new Map(); // Track retry attempts
        this.maxRetryAttempts = 3;
    }

    // Setup online/offline status listeners
    setupOnlineStatusListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.processErrorQueue();
            this.showConnectionRestored();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showOfflineMessage();
        });
    }

    // Main error handling method
    handleError(error, context = {}) {
        const errorInfo = this.parseError(error);
        const userMessage = this.getUserFriendlyMessage(errorInfo, context);
        
        // Log error for debugging
        this.logError(errorInfo, context);
        
        // Handle based on error type
        if (errorInfo.isNetworkError && !this.isOnline) {
            return this.handleOfflineError(errorInfo, context);
        }
        
        if (errorInfo.isAuthError) {
            return this.handleAuthError(errorInfo, context);
        }
        
        if (errorInfo.isValidationError) {
            return this.handleValidationError(errorInfo, context);
        }
        
        if (errorInfo.isServerError) {
            return this.handleServerError(errorInfo, context);
        }
        
        // Default error handling
        return this.handleGenericError(errorInfo, context);
    }

    // Parse different types of errors
    parseError(error) {
        const errorInfo = {
            originalError: error,
            code: null,
            message: null,
            details: null,
            statusCode: null,
            isNetworkError: false,
            isAuthError: false,
            isValidationError: false,
            isServerError: false,
            isOfflineError: false,
            timestamp: new Date().toISOString()
        };

        // Handle Response objects (fetch API)
        if (error instanceof Response) {
            errorInfo.statusCode = error.status;
            errorInfo.isNetworkError = !error.ok;
            errorInfo.isAuthError = error.status === 401 || error.status === 403;
            errorInfo.isServerError = error.status >= 500;
            return errorInfo;
        }

        // Handle Error objects
        if (error instanceof Error) {
            errorInfo.message = error.message;
            
            // Network errors
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorInfo.isNetworkError = true;
                errorInfo.code = 'NETWORK_ERROR';
            }
            
            // CORS errors
            if (error.message.includes('CORS')) {
                errorInfo.isNetworkError = true;
                errorInfo.code = 'CORS_ERROR';
            }
            
            return errorInfo;
        }

        // Handle API error responses (JSON objects)
        if (typeof error === 'object' && error !== null) {
            if (error.error) {
                // New standardized error format
                errorInfo.code = error.error.code;
                errorInfo.message = error.error.message;
                errorInfo.details = error.error.details;
                errorInfo.timestamp = error.error.timestamp;
            } else {
                // Legacy error format
                errorInfo.message = error.detail || error.message;
                errorInfo.details = error;
            }
            
            // Determine error types based on code
            if (errorInfo.code) {
                errorInfo.isAuthError = this.isAuthenticationError(errorInfo.code);
                errorInfo.isValidationError = this.isValidationError(errorInfo.code);
                errorInfo.isServerError = this.isServerError(errorInfo.code);
                errorInfo.isOfflineError = errorInfo.code === 'OFFLINE_ERROR';
                errorInfo.isNetworkError = errorInfo.code === 'NETWORK_ERROR';
            }
            
            return errorInfo;
        }

        // Handle string errors
        if (typeof error === 'string') {
            errorInfo.message = error;
            return errorInfo;
        }

        // Unknown error type
        errorInfo.message = 'An unknown error occurred';
        return errorInfo;
    }

    // Check if error code is authentication-related
    isAuthenticationError(code) {
        const authCodes = [
            'LOGIN_FAILED', 'INVALID_CREDENTIALS', 'ACCOUNT_LOCKED',
            'ACCOUNT_INACTIVE', 'EMAIL_NOT_VERIFIED', 'INVALID_TOKEN',
            'EXPIRED_TOKEN', 'TOKEN_REFRESH_FAILED', 'SESSION_EXPIRED'
        ];
        return authCodes.includes(code);
    }

    // Check if error code is validation-related
    isValidationError(code) {
        const validationCodes = [
            'VALIDATION_ERROR', 'REGISTRATION_FAILED', 'WEAK_PASSWORD',
            'USERNAME_EXISTS', 'EMAIL_EXISTS', 'REQUIRED_FIELD_MISSING',
            'INVALID_FORMAT'
        ];
        return validationCodes.includes(code);
    }

    // Check if error code is server-related
    isServerError(code) {
        const serverCodes = [
            'INTERNAL_SERVER_ERROR', 'SERVICE_UNAVAILABLE',
            'DATABASE_ERROR'
        ];
        return serverCodes.includes(code);
    }

    // Get user-friendly error messages
    getUserFriendlyMessage(errorInfo, context) {
        // Offline-specific messages
        if (!this.isOnline || errorInfo.isOfflineError) {
            return this.getOfflineMessage(context.action || 'perform this action');
        }

        // Network error messages
        if (errorInfo.isNetworkError) {
            return this.getNetworkErrorMessage(errorInfo);
        }

        // Use provided message if available
        if (errorInfo.message) {
            return errorInfo.message;
        }

        // Default messages based on error type
        if (errorInfo.isAuthError) {
            return 'Authentication failed. Please check your credentials and try again.';
        }

        if (errorInfo.isValidationError) {
            return 'Please check your input and correct any errors.';
        }

        if (errorInfo.isServerError) {
            return 'Server error occurred. Please try again later.';
        }

        return 'An unexpected error occurred. Please try again.';
    }

    // Get offline-specific messages
    getOfflineMessage(action) {
        return `Unable to ${action} while offline. Please check your connection and try again.`;
    }

    // Get network error messages
    getNetworkErrorMessage(errorInfo) {
        if (errorInfo.code === 'CORS_ERROR') {
            return 'Connection blocked. Please try again later.';
        }
        
        return 'Unable to connect to server. Please check your internet connection.';
    }

    // Handle offline errors
    handleOfflineError(errorInfo, context) {
        const message = this.getOfflineMessage(context.action || 'perform this action');
        
        // Queue the error for retry when online
        if (context.retryable !== false) {
            this.queueErrorForRetry(errorInfo, context);
        }
        
        this.displayError(message, 'offline', context);
        
        return {
            success: false,
            error: message,
            offline: true,
            queued: context.retryable !== false
        };
    }

    // Handle authentication errors
    handleAuthError(errorInfo, context) {
        const message = this.getUserFriendlyMessage(errorInfo, context);
        
        // Handle token expiration
        if (errorInfo.code === 'EXPIRED_TOKEN' || errorInfo.code === 'SESSION_EXPIRED') {
            this.handleTokenExpiration(context);
        }
        
        // Handle account lockout
        if (errorInfo.code === 'ACCOUNT_LOCKED') {
            this.handleAccountLockout(context);
        }
        
        this.displayError(message, 'auth', context);
        
        return {
            success: false,
            error: message,
            code: errorInfo.code,
            requiresAuth: true
        };
    }

    // Handle validation errors
    handleValidationError(errorInfo, context) {
        const message = this.getUserFriendlyMessage(errorInfo, context);
        
        // Display field-specific errors if available
        if (errorInfo.details && typeof errorInfo.details === 'object') {
            this.displayFieldErrors(errorInfo.details, context);
        } else {
            this.displayError(message, 'validation', context);
        }
        
        return {
            success: false,
            error: message,
            details: errorInfo.details,
            validation: true
        };
    }

    // Handle server errors
    handleServerError(errorInfo, context) {
        const message = this.getUserFriendlyMessage(errorInfo, context);
        
        // Offer retry for server errors
        if (context.retryable !== false) {
            this.offerRetry(errorInfo, context);
        }
        
        this.displayError(message, 'server', context);
        
        return {
            success: false,
            error: message,
            code: errorInfo.code,
            retryable: true
        };
    }

    // Handle generic errors
    handleGenericError(errorInfo, context) {
        const message = this.getUserFriendlyMessage(errorInfo, context);
        
        this.displayError(message, 'generic', context);
        
        return {
            success: false,
            error: message
        };
    }

    // Display error messages to user
    displayError(message, type = 'generic', context = {}) {
        // Use UI manager if available
        if (window.ui && window.ui.showToast) {
            const toastType = this.getToastType(type);
            window.ui.showToast(message, toastType);
            return;
        }

        // Use auth error display if in auth context
        if (context.containerId && window.displayAuthError) {
            window.displayAuthError(context.containerId, message);
            return;
        }

        // Fallback to alert
        console.error(`${type.toUpperCase()}: ${message}`);
        
        // Only show alert for critical errors
        if (type === 'auth' || type === 'server') {
            alert(message);
        }
    }

    // Display field-specific validation errors
    displayFieldErrors(errors, context) {
        Object.keys(errors).forEach(field => {
            const fieldErrors = Array.isArray(errors[field]) ? errors[field] : [errors[field]];
            const fieldElement = document.querySelector(`[name="${field}"]`);
            
            if (fieldElement) {
                this.showFieldError(fieldElement, fieldErrors[0]);
            } else {
                // Display as general error if field not found
                this.displayError(`${field}: ${fieldErrors[0]}`, 'validation', context);
            }
        });
    }

    // Show error for specific form field
    showFieldError(fieldElement, message) {
        // Remove existing error
        this.clearFieldError(fieldElement);
        
        // Add error class
        fieldElement.classList.add('input-error');
        
        // Create error message element
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error text-error text-sm mt-1';
        errorElement.textContent = message;
        errorElement.setAttribute('data-field-error', 'true');
        
        // Insert after field
        fieldElement.parentNode.insertBefore(errorElement, fieldElement.nextSibling);
        
        // Auto-clear error when user starts typing
        fieldElement.addEventListener('input', () => {
            this.clearFieldError(fieldElement);
        }, { once: true });
    }

    // Clear field error
    clearFieldError(fieldElement) {
        fieldElement.classList.remove('input-error');
        const errorElement = fieldElement.parentNode.querySelector('[data-field-error="true"]');
        if (errorElement) {
            errorElement.remove();
        }
    }

    // Get appropriate toast type for error type
    getToastType(errorType) {
        const typeMap = {
            'auth': 'warning',
            'validation': 'warning',
            'server': 'error',
            'offline': 'info',
            'generic': 'error'
        };
        return typeMap[errorType] || 'error';
    }

    // Handle token expiration
    handleTokenExpiration(context) {
        // Clear auth data
        if (window.auth) {
            window.auth.clearAuthData();
        }
        
        // Redirect to login if not already there
        setTimeout(() => {
            if (!window.location.pathname.includes('login') && !window.location.pathname.includes('index')) {
                window.location.href = '/';
            }
        }, 2000);
    }

    // Handle account lockout
    handleAccountLockout(context) {
        // Show additional help information
        const helpMessage = 'Your account has been temporarily locked. You can reset your password or wait 15 minutes before trying again.';
        
        setTimeout(() => {
            this.displayError(helpMessage, 'auth', context);
        }, 3000);
    }

    // Queue error for retry when online
    queueErrorForRetry(errorInfo, context) {
        this.errorQueue.push({
            errorInfo,
            context,
            timestamp: Date.now()
        });
        
        // Limit queue size
        if (this.errorQueue.length > 10) {
            this.errorQueue.shift();
        }
    }

    // Process queued errors when back online
    processErrorQueue() {
        if (this.errorQueue.length === 0) return;
        
        const queuedErrors = [...this.errorQueue];
        this.errorQueue = [];
        
        queuedErrors.forEach(({ errorInfo, context }) => {
            if (context.retryCallback && typeof context.retryCallback === 'function') {
                setTimeout(() => {
                    context.retryCallback();
                }, 1000);
            }
        });
        
        if (queuedErrors.length > 0) {
            this.displayError(
                `${queuedErrors.length} queued action(s) will be retried automatically.`,
                'info'
            );
        }
    }

    // Offer retry option for recoverable errors
    offerRetry(errorInfo, context) {
        if (!context.retryCallback) return;
        
        const retryKey = context.retryKey || 'default';
        const attempts = this.retryAttempts.get(retryKey) || 0;
        
        if (attempts < this.maxRetryAttempts) {
            setTimeout(() => {
                this.retryAttempts.set(retryKey, attempts + 1);
                context.retryCallback();
            }, Math.pow(2, attempts) * 1000); // Exponential backoff
        } else {
            this.retryAttempts.delete(retryKey);
            this.displayError('Maximum retry attempts reached. Please try again later.', 'server', context);
        }
    }

    // Show offline message
    showOfflineMessage() {
        this.displayError('You are currently offline. Some features may not be available.', 'offline');
    }

    // Show connection restored message
    showConnectionRestored() {
        this.displayError('Connection restored. Retrying queued actions...', 'info');
    }

    // Log errors for debugging
    logError(errorInfo, context) {
        const logData = {
            timestamp: errorInfo.timestamp,
            code: errorInfo.code,
            message: errorInfo.message,
            context: context,
            userAgent: navigator.userAgent,
            url: window.location.href,
            online: this.isOnline
        };
        
        console.error('Error logged:', logData);
        
        // Store in localStorage for debugging (limit to last 50 errors)
        try {
            const errorLog = JSON.parse(localStorage.getItem('error_log') || '[]');
            errorLog.unshift(logData);
            errorLog.splice(50); // Keep only last 50 errors
            localStorage.setItem('error_log', JSON.stringify(errorLog));
        } catch (e) {
            console.warn('Failed to store error log:', e);
        }
    }

    // Clear error log
    clearErrorLog() {
        localStorage.removeItem('error_log');
    }

    // Get error log for debugging
    getErrorLog() {
        try {
            return JSON.parse(localStorage.getItem('error_log') || '[]');
        } catch (e) {
            return [];
        }
    }

    // Check if user is online
    isUserOnline() {
        return this.isOnline;
    }

    // Reset retry attempts for a specific key
    resetRetryAttempts(retryKey = 'default') {
        this.retryAttempts.delete(retryKey);
    }

    // Clear all retry attempts
    clearAllRetryAttempts() {
        this.retryAttempts.clear();
    }
}

// Global error handler instance
window.errorHandler = new ErrorHandler();

// Enhanced global error handling functions
window.handleApiError = function(error, context = {}) {
    return window.errorHandler.handleError(error, context);
};

window.handleAuthError = function(error, containerId = null) {
    return window.errorHandler.handleError(error, {
        containerId: containerId,
        type: 'auth'
    });
};

window.handleValidationError = function(error, formElement = null) {
    return window.errorHandler.handleError(error, {
        formElement: formElement,
        type: 'validation'
    });
};

window.handleOfflineError = function(action) {
    return window.errorHandler.handleOfflineError(
        { isOfflineError: true },
        { action: action }
    );
};

// Enhanced error display functions (backward compatibility)
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
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }, 10000);
};

window.clearAuthError = function(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const errorDiv = container.querySelector('.auth-error');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
};

// Global error event listeners
window.addEventListener('error', (event) => {
    window.errorHandler.logError({
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
    }, { type: 'javascript_error' });
});

window.addEventListener('unhandledrejection', (event) => {
    window.errorHandler.logError({
        message: 'Unhandled Promise Rejection',
        reason: event.reason
    }, { type: 'promise_rejection' });
});
