/**
 * Profile Management Module
 * Handles user profile updates, password changes, email updates, and account deletion
 */

class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Check authentication
        if (!window.auth || !window.auth.isAuthenticated()) {
            window.location.href = '/';
            return;
        }

        // Load user profile
        this.loadProfile();
        this.loadSecurityLogs();
        
        // Setup event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Profile form submission
        document.getElementById('profile-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleProfileUpdate();
        });

        // Password form submission
        document.getElementById('password-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handlePasswordChange();
        });

        // Email update form submission
        document.getElementById('email-update-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEmailUpdate();
        });

        // Delete account form submission
        document.getElementById('delete-account-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAccountDeletion();
        });

        // Password strength indicator
        document.getElementById('new_password').addEventListener('input', (e) => {
            this.updatePasswordStrength(e.target.value);
        });
    }

    async loadProfile() {
        try {
            const response = await window.api.getProfile();
            
            if (response.id) {
                this.currentUser = response;
                this.populateProfileForm(response);
                this.updateAccountInfo(response);
                this.updateUserInitial(response);
            } else {
                this.showError('Failed to load profile information');
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
            this.showError('Failed to load profile information');
        }
    }

    populateProfileForm(user) {
        // Basic information
        document.getElementById('first_name').value = user.first_name || '';
        document.getElementById('last_name').value = user.last_name || '';
        document.getElementById('email').value = user.email || '';
        document.getElementById('phone_number').value = user.phone_number || '';
        
        // Date of birth
        if (user.date_of_birth) {
            document.getElementById('date_of_birth').value = user.date_of_birth;
        }
        
        // Emergency contact
        document.getElementById('emergency_contact_name').value = user.emergency_contact_name || '';
        document.getElementById('emergency_contact_phone').value = user.emergency_contact_phone || '';
        
        // Medical conditions
        document.getElementById('medical_conditions').value = user.medical_conditions || '';
        
        // Email verification status
        const emailStatus = document.getElementById('email-status');
        if (user.email_verified) {
            emailStatus.textContent = 'Verified';
            emailStatus.className = 'badge badge-sm badge-success';
        } else {
            emailStatus.textContent = 'Unverified';
            emailStatus.className = 'badge badge-sm badge-warning';
        }
    }

    updateAccountInfo(user) {
        // Account created date
        if (user.created_at) {
            const createdDate = new Date(user.created_at).toLocaleDateString();
            document.getElementById('account-created').textContent = createdDate;
        }
        
        // Last login (if available)
        // Note: This would need to be added to the user model/serializer
        document.getElementById('last-login').textContent = 'Today'; // Placeholder
        
        // Email verification status
        const emailVerificationStatus = document.getElementById('email-verification-status');
        if (user.email_verified) {
            emailVerificationStatus.textContent = 'Verified';
            emailVerificationStatus.className = 'stat-value text-lg text-success';
        } else {
            emailVerificationStatus.textContent = 'Pending';
            emailVerificationStatus.className = 'stat-value text-lg text-warning';
        }
    }

    updateUserInitial(user) {
        const userInitial = document.getElementById('user-initial');
        if (userInitial) {
            userInitial.textContent = user.first_name?.charAt(0) || 
                                     user.username?.charAt(0) || 'U';
        }
    }

    async handleProfileUpdate() {
        const form = document.getElementById('profile-form');
        const formData = new FormData(form);
        const profileData = Object.fromEntries(formData.entries());
        
        // Remove empty fields
        Object.keys(profileData).forEach(key => {
            if (profileData[key] === '') {
                delete profileData[key];
            }
        });

        // Validate form
        const errors = window.auth.validateProfileForm(profileData);
        if (errors.length > 0) {
            this.showError(errors.join(', '));
            return;
        }

        // Show loading
        const loadingSpinner = document.getElementById('profile-loading');
        const submitButton = form.querySelector('button[type="submit"]');
        loadingSpinner.classList.remove('hidden');
        submitButton.disabled = true;

        try {
            const result = await window.auth.updateProfile(profileData);
            
            if (result.success) {
                this.showSuccess(result.message);
                this.currentUser = result.user;
                this.updateUserInitial(result.user);
            } else {
                this.showError(result.error);
            }
        } catch (error) {
            console.error('Profile update error:', error);
            this.showError('Failed to update profile');
        } finally {
            loadingSpinner.classList.add('hidden');
            submitButton.disabled = false;
        }
    }

    async handlePasswordChange() {
        const form = document.getElementById('password-form');
        const formData = new FormData(form);
        
        const currentPassword = formData.get('current_password');
        const newPassword = formData.get('new_password');
        const confirmPassword = formData.get('confirm_password');

        // Validate passwords match
        if (newPassword !== confirmPassword) {
            this.showError("New passwords don't match");
            return;
        }

        // Validate password strength
        if (!this.isStrongPassword(newPassword)) {
            this.showError('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
            return;
        }

        // Show loading
        const loadingSpinner = document.getElementById('password-loading');
        const submitButton = form.querySelector('button[type="submit"]');
        loadingSpinner.classList.remove('hidden');
        submitButton.disabled = true;

        try {
            const result = await window.auth.changePassword(currentPassword, newPassword, confirmPassword);
            
            if (result.success) {
                this.showSuccess(result.message);
                form.reset();
            } else {
                this.showError(result.error);
            }
        } catch (error) {
            console.error('Password change error:', error);
            this.showError('Failed to change password');
        } finally {
            loadingSpinner.classList.add('hidden');
            submitButton.disabled = false;
        }
    }

    async handleEmailUpdate() {
        const form = document.getElementById('email-update-form');
        const formData = new FormData(form);
        
        const newEmail = formData.get('new_email');
        const password = formData.get('password');

        // Validate email format
        if (!this.isValidEmail(newEmail)) {
            this.showError('Please enter a valid email address');
            return;
        }

        // Show loading
        const loadingSpinner = document.getElementById('email-update-loading');
        const submitButton = form.querySelector('button[type="submit"]');
        loadingSpinner.classList.remove('hidden');
        submitButton.disabled = true;

        try {
            const result = await window.auth.updateEmail(newEmail, password);
            
            if (result.success) {
                this.showSuccess(result.message);
                this.closeEmailUpdateModal();
                form.reset();
                
                // Update the email field and status
                document.getElementById('email').value = result.newEmail;
                const emailStatus = document.getElementById('email-status');
                emailStatus.textContent = 'Unverified';
                emailStatus.className = 'badge badge-sm badge-warning';
            } else {
                this.showError(result.error);
            }
        } catch (error) {
            console.error('Email update error:', error);
            this.showError('Failed to update email address');
        } finally {
            loadingSpinner.classList.add('hidden');
            submitButton.disabled = false;
        }
    }

    async handleAccountDeletion() {
        const form = document.getElementById('delete-account-form');
        const formData = new FormData(form);
        
        const password = formData.get('password');
        const confirmation = formData.get('confirmation');

        // Validate confirmation text
        if (confirmation.toUpperCase() !== 'DELETE MY ACCOUNT') {
            this.showError('Please type "DELETE MY ACCOUNT" exactly to confirm');
            return;
        }

        // Show loading
        const loadingSpinner = document.getElementById('delete-account-loading');
        const submitButton = form.querySelector('button[type="submit"]');
        loadingSpinner.classList.remove('hidden');
        submitButton.disabled = true;

        try {
            const result = await window.auth.deleteAccount(password, confirmation);
            
            if (result.success) {
                this.showSuccess(result.message);
                this.closeDeleteAccountModal();
                
                // Redirect to home page after a delay
                setTimeout(() => {
                    window.location.href = '/';
                }, 3000);
            } else {
                this.showError(result.error);
            }
        } catch (error) {
            console.error('Account deletion error:', error);
            this.showError('Failed to delete account');
        } finally {
            loadingSpinner.classList.add('hidden');
            submitButton.disabled = false;
        }
    }

    async loadSecurityLogs() {
        try {
            const result = await window.auth.getSecurityLogs();
            
            if (result.success) {
                this.displaySecurityLogs(result.logs);
            } else {
                this.showError('Failed to load security logs');
            }
        } catch (error) {
            console.error('Failed to load security logs:', error);
            this.showError('Failed to load security logs');
        }
    }

    displaySecurityLogs(logs) {
        const container = document.getElementById('security-logs');
        
        if (!logs || logs.length === 0) {
            container.innerHTML = '<p class="text-center text-base-content/60 py-8">No security activity found</p>';
            return;
        }

        const logsHtml = logs.map(log => {
            const iconClass = this.getLogIcon(log.action);
            const statusClass = log.success ? 'badge-success' : 'badge-error';
            const statusText = log.success ? 'Success' : 'Failed';
            
            return `
                <div class="flex items-center justify-between p-4 bg-base-100 rounded-lg border">
                    <div class="flex items-center space-x-3">
                        <div class="text-2xl">${iconClass}</div>
                        <div>
                            <div class="font-semibold">${log.action_display}</div>
                            <div class="text-sm text-base-content/60">
                                ${log.ip_address} • ${this.formatDate(log.timestamp)}
                            </div>
                        </div>
                    </div>
                    <div class="badge ${statusClass}">${statusText}</div>
                </div>
            `;
        }).join('');

        container.innerHTML = logsHtml;
    }

    getLogIcon(action) {
        const icons = {
            'login': '🔐',
            'logout': '🚪',
            'login_failed': '❌',
            'password_reset_request': '🔑',
            'password_reset_confirm': '✅',
            'password_change': '🔒',
            'email_verification': '📧',
            'account_locked': '🔒',
            'account_unlocked': '🔓',
            'profile_update': '👤',
            'email_update': '📧',
            'account_deletion': '🗑️'
        };
        return icons[action] || '📝';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString();
    }

    updatePasswordStrength(password) {
        // This could be enhanced with a visual password strength indicator
        const strength = this.calculatePasswordStrength(password);
        // Implementation for visual feedback could go here
    }

    calculatePasswordStrength(password) {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
        return strength;
    }

    isStrongPassword(password) {
        return this.calculatePasswordStrength(password) >= 4;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Modal management
    showEmailUpdateModal() {
        document.getElementById('email-update-modal').showModal();
    }

    closeEmailUpdateModal() {
        document.getElementById('email-update-modal').close();
        document.getElementById('email-update-form').reset();
    }

    showDeleteAccountModal() {
        document.getElementById('delete-account-modal').showModal();
    }

    closeDeleteAccountModal() {
        document.getElementById('delete-account-modal').close();
        document.getElementById('delete-account-form').reset();
    }

    // Utility methods
    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        
        const typeClasses = {
            success: 'alert-success',
            error: 'alert-error',
            warning: 'alert-warning',
            info: 'alert-info'
        };

        toast.className = `alert ${typeClasses[type]} mb-2`;
        toast.innerHTML = `
            <span>${message}</span>
            <button class="btn btn-sm btn-ghost" onclick="this.parentElement.remove()">×</button>
        `;
        
        container.appendChild(toast);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }
}

// Tab management
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('tab-active');
    });
    
    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.remove('hidden');
    
    // Add active class to clicked tab button
    event.target.classList.add('tab-active');
}

// Global functions for modal management
window.showEmailUpdateModal = function() {
    window.profileManager.showEmailUpdateModal();
}

window.closeEmailUpdateModal = function() {
    window.profileManager.closeEmailUpdateModal();
}

window.showDeleteAccountModal = function() {
    window.profileManager.showDeleteAccountModal();
}

window.closeDeleteAccountModal = function() {
    window.profileManager.closeDeleteAccountModal();
}

window.loadProfile = function() {
    window.profileManager.loadProfile();
}

window.loadSecurityLogs = function() {
    window.profileManager.loadSecurityLogs();
}

// Initialize profile manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.profileManager = new ProfileManager();
});