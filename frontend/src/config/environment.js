/**
 * Secure Environment Configuration Module
 * Handles environment-based configuration with security best practices
 */

// Environment configuration with fallbacks
const ENV_CONFIG = {
    NODE_ENV: import.meta.env.VITE_NODE_ENV || 'development',
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '',
    API_VERSION: import.meta.env.VITE_API_VERSION || 'v1',
    API_TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000,
    API_MAX_RETRIES: parseInt(import.meta.env.VITE_API_MAX_RETRIES) || 3,
    ENABLE_DEBUG: import.meta.env.VITE_ENABLE_DEBUG === 'true',
    ENABLE_MOCK_API: import.meta.env.VITE_ENABLE_MOCK_API === 'true',
};

/**
 * Validates that all required environment variables are present
 */
function validateEnvironment() {
    const requiredVars = ['API_BASE_URL'];
    const missingVars = requiredVars.filter(key => !ENV_CONFIG[key]);
    
    if (missingVars.length > 0) {
        console.error('Missing required environment variables:', missingVars);
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
}

/**
 * Gets the appropriate API base URL based on environment
 */
export function getApiBaseUrl() {
    // If API_BASE_URL is explicitly set, use it
    if (ENV_CONFIG.API_BASE_URL) {
        return ENV_CONFIG.API_BASE_URL;
    }
    
    // Fallback to dynamic detection for backward compatibility
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // Development environments
    if (hostname === 'localhost' || 
        hostname === '127.0.0.1' || 
        hostname.startsWith('192.168.') || 
        hostname.startsWith('10.') || 
        hostname.startsWith('172.') ||
        /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
        return `${protocol}//${hostname}:8000/api/${ENV_CONFIG.API_VERSION}`;
    }
    
    // Production environment
    return `${protocol}//${window.location.host}/api/${ENV_CONFIG.API_VERSION}`;
}

/**
 * Configuration object with all environment settings
 */
export const config = {
    // Environment
    isDevelopment: ENV_CONFIG.NODE_ENV === 'development',
    isProduction: ENV_CONFIG.NODE_ENV === 'production',
    environment: ENV_CONFIG.NODE_ENV,
    
    // API Configuration
    api: {
        baseUrl: getApiBaseUrl(),
        version: ENV_CONFIG.API_VERSION,
        timeout: ENV_CONFIG.API_TIMEOUT,
        maxRetries: ENV_CONFIG.API_MAX_RETRIES,
    },
    
    // Feature Flags
    features: {
        debug: ENV_CONFIG.ENABLE_DEBUG,
        mockApi: ENV_CONFIG.ENABLE_MOCK_API,
    },
    
    // Security Settings
    security: {
        // These should never be exposed to the frontend in production
        enableConsoleLogging: ENV_CONFIG.NODE_ENV === 'development',
        enableNetworkLogging: ENV_CONFIG.NODE_ENV === 'development' && ENV_CONFIG.ENABLE_DEBUG,
    }
};

/**
 * API endpoint definitions - centralized and secure
 */
export const API_ENDPOINTS = {
    // Authentication endpoints
    AUTH: {
        LOGIN: '/auth/login/',
        REGISTER: '/auth/register/',
        LOGOUT: '/auth/logout/',
        REFRESH_TOKEN: '/auth/token/refresh/',
        PASSWORD_RESET: '/auth/password-reset/',
        PASSWORD_RESET_CONFIRM: '/auth/password-reset-confirm/',
        VERIFY_EMAIL: '/auth/verify-email/',
        RESEND_VERIFICATION: '/auth/resend-verification/',
        CHANGE_PASSWORD: '/auth/change-password/',
        PROFILE: '/auth/profile/',
        UPDATE_EMAIL: '/auth/update-email/',
        DELETE_ACCOUNT: '/auth/delete-account/',
        SECURITY_LOGS: '/auth/security-logs/',
        SESSIONS: '/auth/sessions/',
        SESSIONS_TERMINATE: '/auth/sessions/terminate/',
        SESSIONS_TERMINATE_ALL: '/auth/sessions/terminate-all/',
    },
    
    // Health check
    HEALTH: '/health/',
    
    // Prescription endpoints
    PRESCRIPTIONS: {
        BASE: '/prescriptions/',
        DETAIL: (id) => `/prescriptions/${id}/`,
        UPLOAD_IMAGE: (id) => `/prescriptions/${id}/upload_image/`,
        DELETE_IMAGE: (id) => `/prescriptions/${id}/delete_image/`,
        PROCESS_OCR: (id) => `/prescriptions/${id}/process_ocr/`,
        VALIDATE_UPLOAD: '/prescriptions/validate_upload/',
        STORAGE_USAGE: '/prescriptions/storage_usage/',
        CLEANUP_FILES: '/prescriptions/cleanup_files/',
        SEARCH: '/prescriptions/search/',
        RECENT: '/prescriptions/recent/',
        STATISTICS: '/prescriptions/statistics/',
    },
    
    // Medication endpoints
    MEDICATIONS: {
        BASE: '/medications/',
        DETAIL: (id) => `/medications/${id}/`,
    },
    
    // Vitals endpoints
    VITALS: {
        BASE: '/vitals/',
        DETAIL: (id) => `/vitals/${id}/`,
        TRENDS: '/vitals/trends/',
        SUMMARY: '/vitals/summary/',
        STATISTICS: '/vitals/statistics/',
        TYPES: '/vitals/types/',
    },
    
    // Reports endpoints
    REPORTS: {
        BASE: '/reports/',
        DETAIL: (id) => `/reports/${id}/`,
        GENERATE: '/reports/generate/',
        DOWNLOAD: (id) => `/reports/${id}/download/`,
        PREVIEW: (id) => `/reports/${id}/preview/`,
        SHARE: (id) => `/reports/${id}/share/`,
        TEMPLATES: '/reports/templates/',
        SCHEDULE: '/reports/schedule/',
    },
    
    // Emergency endpoints
    EMERGENCY: {
        CONTACTS: '/emergency/contacts/',
        CONTACT_DETAIL: (id) => `/emergency/contacts/${id}/`,
        SET_PRIMARY: (id) => `/emergency/contacts/${id}/set_primary/`,
        PRIMARY_CONTACT: '/emergency/contacts/primary/',
        ALERTS: '/emergency/alerts/',
        ALERT_DETAIL: (id) => `/emergency/alerts/${id}/`,
        SEND_ALERT: '/emergency/alerts/send_alert/',
        RESOLVE_ALERT: (id) => `/emergency/alerts/${id}/resolve/`,
        CANCEL_ALERT: (id) => `/emergency/alerts/${id}/cancel/`,
        STATUS: '/emergency/alerts/status/',
        HISTORY: '/emergency/alerts/history/',
    },
};

// Validate environment on module load
try {
    validateEnvironment();
    if (config.security.enableConsoleLogging) {
        console.info('Environment configuration loaded successfully');
        console.debug('Config:', {
            environment: config.environment,
            apiBaseUrl: config.api.baseUrl,
            features: config.features
        });
    }
} catch (error) {
    console.error('Environment configuration validation failed:', error);
    // In production, you might want to show a user-friendly error page
    if (config.isProduction) {
        // Handle gracefully in production
        console.error('Application configuration error. Please contact support.');
    } else {
        // In development, show the actual error
        throw error;
    }
}

export default config;
