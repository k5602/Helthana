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
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleProfileUpdate();
            });
        }

        // Password form submission
        const passwordForm = document.getElementById('password-form');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePasswordChange();
            });
        }

        // Email update form submission
        const emailForm = document.getElementById('email-update-form');
        if (emailForm) {
            emailForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleEmailUpdate();
            });
        }

        // Delete account form submission
        const deleteForm = document.getElementById('delete-account-form');
        if (deleteForm) {
            deleteForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAccountDeletion();
            });
        }

        // Medical form submission
        const medicalForm = document.getElementById('medical-form');
        if (medicalForm) {
            medicalForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleMedicalUpdate();
            });
        }

        // Password strength indicator
        const newPasswordInput = document.getElementById('new_password');
        if (newPasswordInput) {
            newPasswordInput.addEventListener('input', (e) => {
                this.updatePasswordStrength(e.target.value);
            });
        }

        // BMI calculation listeners
        const heightInput = document.getElementById('height');
        const weightInput = document.getElementById('weight');
        
        if (heightInput) {
            heightInput.addEventListener('input', () => this.calculateBMI());
        }
        
        if (weightInput) {
            weightInput.addEventListener('input', () => this.calculateBMI());
        }
    }

    async loadProfile() {
        try {
            const response = await window.api.getProfile();
            
            if (response && response.id) {
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
        this.setInputValue('first_name', user.first_name);
        this.setInputValue('last_name', user.last_name);
        this.setInputValue('email', user.email);
        this.setInputValue('phone_number', user.phone_number);
        
        // Date of birth
        if (user.date_of_birth) {
            this.setInputValue('date_of_birth', user.date_of_birth);
            this.calculateAge(user.date_of_birth);
        }
        
        // Emergency contact
        this.setInputValue('emergency_contact_name', user.emergency_contact_name);
        this.setInputValue('emergency_contact_phone', user.emergency_contact_phone);
        
        // Medical conditions
        this.setInputValue('medical_conditions', user.medical_conditions);
        this.setInputValue('allergies', user.allergies);
        this.setInputValue('blood_type', user.blood_type);
        this.setInputValue('height', user.height);
        this.setInputValue('weight', user.weight);
        
        // Calculate BMI if height and weight are available
        this.calculateBMI();
        
        // Update emergency information display
        this.updateEmergencyInfo(user);
        
        // Load health summary
        this.loadHealthSummary();
        
        // Email verification status
        this.updateEmailStatus(user);
    }

    setInputValue(id, value) {
        const element = document.getElementById(id);
        if (element && value) {
            element.value = value;
        }
    }

    setTextContent(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value || 'Not set';
        }
    }

    calculateAge(dateOfBirth) {
        if (!dateOfBirth) return;
        
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        this.setTextContent('calculated-age', age.toString());
    }

    calculateBMI() {
        const heightEl = document.getElementById('height');
        const weightEl = document.getElementById('weight');
        
        if (!heightEl || !weightEl) return;
        
        const height = parseFloat(heightEl.value);
        const weight = parseFloat(weightEl.value);
        
        if (height && weight && height > 0 && weight > 0) {
            const bmi = weight / ((height / 100) ** 2);
            const bmiElement = document.getElementById('bmi-value');
            const categoryElement = document.getElementById('bmi-category');
            
            if (bmiElement) {
                bmiElement.textContent = bmi.toFixed(1);
            }
            
            if (categoryElement) {
                let category = '';
                let categoryClass = '';
                
                if (bmi < 18.5) {
                    category = 'Underweight';
                    categoryClass = 'text-info';
                } else if (bmi < 25) {
                    category = 'Normal weight';
                    categoryClass = 'text-success';
                } else if (bmi < 30) {
                    category = 'Overweight';
                    categoryClass = 'text-warning';
                } else {
                    category = 'Obesity';
                    categoryClass = 'text-error';
                }
                
                categoryElement.textContent = category;
                categoryElement.className = `stat-desc ${categoryClass}`;
            }
        }
    }

    updateEmergencyInfo(user) {
        // Update emergency summary display
        this.setTextContent('emergency-name', 
            user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : 'Not set');
        this.setTextContent('emergency-dob', user.date_of_birth);
        this.setTextContent('emergency-blood', user.blood_type);
        this.setTextContent('emergency-allergies', user.allergies || 'None');
        this.setTextContent('emergency-conditions', user.medical_conditions || 'None');
        this.setTextContent('emergency-contact-summary', 
            user.emergency_contact_name && user.emergency_contact_phone ? 
            `${user.emergency_contact_name} (${user.emergency_contact_phone})` : 'Not set');
    }

    async loadHealthSummary() {
        try {
            // Placeholder for health summary data
            this.setTextContent('active-prescriptions', '0');
            this.setTextContent('last-vitals', 'Never');
        } catch (error) {
            console.error('Failed to load health summary:', error);
        }
    }

    updateAccountInfo(user) {
        if (user.created_at) {
            const createdDate = new Date(user.created_at).toLocaleDateString();
            this.setTextContent('account-created', createdDate);
        }
        
        this.setTextContent('last-login', 'Today');
        
        const emailVerificationStatus = document.getElementById('email-verification-status');
        if (emailVerificationStatus) {
            if (user.email_verified) {
                emailVerificationStatus.textContent = 'Verified';
                emailVerificationStatus.className = 'stat-value text-lg text-success';
            } else {
                emailVerificationStatus.textContent = 'Pending';
                emailVerificationStatus.className = 'stat-value text-lg text-warning';
            }
        }
    }

    updateEmailStatus(user) {
        const emailStatus = document.getElementById('email-status');
        if (emailStatus) {
            if (user.email_verified) {
                emailStatus.textContent = 'Verified';
                emailStatus.className = 'badge badge-sm badge-success';
                
                const verificationBadge = document.getElementById('email-verification-badge');
                if (verificationBadge) {
                    verificationBadge.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                        </svg>
                        Email Verified
                    `;
                    verificationBadge.className = 'badge badge-success gap-2';
                }
            } else {
                emailStatus.textContent = 'Unverified';
                emailStatus.className = 'badge badge-sm badge-warning';
            }
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
        if (!form) return;

        const formData = new FormData(form);
        const profileData = Object.fromEntries(formData.entries());
        
        // Remove empty fields
        Object.keys(profileData).forEach(key => {
            if (profileData[key] === '') {
                delete profileData[key];
            }
        });

        // Validate form
        if (window.auth && window.auth.validateProfileForm) {
            const errors = window.auth.validateProfileForm(profileData);
            if (errors.length > 0) {
                this.showError(errors.join(', '));
                return;
            }
        }

        // Show loading
        this.showLoading('profile-loading', form);

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
            this.hideLoading('profile-loading', form);
        }
    }

    async handlePasswordChange() {
        const form = document.getElementById('password-form');
        if (!form) return;

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
            this.showError('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
            return;
        }

        // Show loading
        this.showLoading('password-loading', form);

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
            this.hideLoading('password-loading', form);
        }
    }

    async handleEmailUpdate() {
        const form = document.getElementById('email-update-form');
        if (!form) return;

        const formData = new FormData(form);
        
        const newEmail = formData.get('new_email');
        const password = formData.get('password');

        // Validate email format
        if (!this.isValidEmail(newEmail)) {
            this.showError('Please enter a valid email address');
            return;
        }

        // Show loading
        this.showLoading('email-update-loading', form);

        try {
            const result = await window.auth.updateEmail(newEmail, password);
            
            if (result.success) {
                this.showSuccess(result.message);
                this.closeEmailUpdateModal();
                form.reset();
                
                // Update the email field and status
                this.setInputValue('email', result.newEmail);
                const emailStatus = document.getElementById('email-status');
                if (emailStatus) {
                    emailStatus.textContent = 'Unverified';
                    emailStatus.className = 'badge badge-sm badge-warning';
                }
            } else {
                this.showError(result.error);
            }
        } catch (error) {
            console.error('Email update error:', error);
            this.showError('Failed to update email address');
        } finally {
            this.hideLoading('email-update-loading', form);
        }
    }

    async handleAccountDeletion() {
        const form = document.getElementById('delete-account-form');
        if (!form) return;

        const formData = new FormData(form);
        
        const password = formData.get('password');
        const confirmation = formData.get('confirmation');

        // Validate confirmation text
        if (confirmation.toUpperCase() !== 'DELETE MY ACCOUNT') {
            this.showError('Please type "DELETE MY ACCOUNT" exactly to confirm');
            return;
        }

        // Show loading
        this.showLoading('delete-account-loading', form);

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
            this.hideLoading('delete-account-loading', form);
        }
    }

    async handleMedicalUpdate() {
        const form = document.getElementById('medical-form');
        if (!form) return;

        const formData = new FormData(form);
        const medicalData = Object.fromEntries(formData.entries());

        // Show loading
        this.showLoading('medical-loading', form);

        try {
            // This would call the medical update API
            const result = await window.auth.updateMedicalInfo(medicalData);
            
            if (result && result.success) {
                this.showSuccess('Medical information updated successfully');
                this.calculateBMI(); // Recalculate BMI if height/weight changed
            } else {
                this.showError('Failed to update medical information');
            }
        } catch (error) {
            console.error('Medical update error:', error);
            this.showError('Failed to update medical information');
        } finally {
            this.hideLoading('medical-loading', form);
        }
    }

    async loadSecurityLogs() {
        try {
            if (!window.auth || !window.auth.getSecurityLogs) {
                return;
            }

            const result = await window.auth.getSecurityLogs();
            
            if (result.success) {
                this.displaySecurityLogs(result.logs);
            }
        } catch (error) {
            console.error('Failed to load security logs:', error);
        }
    }

    displaySecurityLogs(logs) {
        const container = document.getElementById('security-logs');
        if (!container) return;
        
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
        const strength = this.calculatePasswordStrength(password);
        const strengthElement = document.getElementById('password-strength');
        
        if (strengthElement) {
            const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
            const strengthColors = ['text-error', 'text-warning', 'text-info', 'text-success', 'text-success'];
            
            if (password.length > 0) {
                strengthElement.textContent = `Strength: ${strengthLabels[strength - 1] || 'Very Weak'}`;
                strengthElement.className = `label-text-alt ${strengthColors[strength - 1] || 'text-error'}`;
            } else {
                strengthElement.textContent = '';
            }
        }
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
        const modal = document.getElementById('email-update-modal');
        if (modal && modal.showModal) {
            modal.showModal();
        }
    }

    closeEmailUpdateModal() {
        const modal = document.getElementById('email-update-modal');
        if (modal && modal.close) {
            modal.close();
        }
        
        const form = document.getElementById('email-update-form');
        if (form) {
            form.reset();
        }
    }

    showDeleteAccountModal() {
        const modal = document.getElementById('delete-account-modal');
        if (modal && modal.showModal) {
            modal.showModal();
        }
    }

    closeDeleteAccountModal() {
        const modal = document.getElementById('delete-account-modal');
        if (modal && modal.close) {
            modal.close();
        }
        
        const form = document.getElementById('delete-account-form');
        if (form) {
            form.reset();
        }
    }

    // Loading states
    showLoading(loadingId, form) {
        const loadingSpinner = document.getElementById(loadingId);
        const submitButton = form.querySelector('button[type="submit"]');
        
        if (loadingSpinner) {
            loadingSpinner.classList.remove('hidden');
        }
        
        if (submitButton) {
            submitButton.disabled = true;
        }
    }

    hideLoading(loadingId, form) {
        const loadingSpinner = document.getElementById(loadingId);
        const submitButton = form.querySelector('button[type="submit"]');
        
        if (loadingSpinner) {
            loadingSpinner.classList.add('hidden');
        }
        
        if (submitButton) {
            submitButton.disabled = false;
        }
    }

    // Utility methods
    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showInfo(message) {
        this.showToast(message, 'info');
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container') || this.createToastContainer();
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

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed top-4 right-4 z-50 space-y-2';
        document.body.appendChild(container);
        return container;
    }
}

// Global functions for tab management
window.showTab = function(tabName) {
    // Hide all tab contents
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.add('hidden'));
    
    // Show selected tab
    const selectedTab = document.getElementById(`${tabName}-tab`);
    if (selectedTab) {
        selectedTab.classList.remove('hidden');
    }
    
    // Update tab buttons
    const tabButtons = document.querySelectorAll('.tab');
    tabButtons.forEach(button => button.classList.remove('tab-active'));
    
    // Find and activate the correct tab button
    const tabButtonText = {
        'personal': 'Personal Info',
        'medical': 'Health Profile', 
        'emergency': 'Emergency',
        'security': 'Security',
        'preferences': 'Preferences'
    };
    
    const activeButton = Array.from(document.querySelectorAll('.tab')).find(button => 
        button.textContent.trim() === tabButtonText[tabName]
    );
    
    if (activeButton) {
        activeButton.classList.add('tab-active');
    }
};

// Global helper functions
window.changeProfilePicture = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const profileAvatar = document.getElementById('profile-avatar');
                if (profileAvatar) {
                    profileAvatar.innerHTML = `<img src="${e.target.result}" alt="Profile" class="w-full h-full object-cover rounded-full">`;
                }
            };
            reader.readAsDataURL(file);
            
            if (window.profileManager) {
                window.profileManager.showSuccess('Profile picture updated successfully!');
            }
        }
    };
    input.click();
};

window.addMedicalReminder = function() {
    if (window.profileManager) {
        window.profileManager.showInfo('Medical reminder feature coming soon!');
    }
};

window.triggerEmergencyAlert = function() {
    const result = confirm('Are you in an emergency? This will alert your emergency contacts and potentially contact emergency services.');
    if (result && window.profileManager) {
        window.profileManager.showSuccess('Emergency alert sent to your contacts!');
        console.log('Emergency alert triggered');
    }
};

window.generateMedicalIdCard = function() {
    if (window.profileManager) {
        window.profileManager.showInfo('Medical ID card generation feature coming soon!');
    }
};

window.showEmailUpdateModal = function() {
    if (window.profileManager) {
        window.profileManager.showEmailUpdateModal();
    }
};

window.closeEmailUpdateModal = function() {
    if (window.profileManager) {
        window.profileManager.closeEmailUpdateModal();
    }
};

window.showDeleteAccountModal = function() {
    if (window.profileManager) {
        window.profileManager.showDeleteAccountModal();
    }
};

window.closeDeleteAccountModal = function() {
    if (window.profileManager) {
        window.profileManager.closeDeleteAccountModal();
    }
};

window.savePreferences = function() {
    const preferences = {
        language: document.getElementById('language')?.value || 'en',
        theme: document.getElementById('theme')?.value || 'light',
        medication_reminders: document.getElementById('medication_reminders')?.checked || false,
        vitals_reminders: document.getElementById('vitals_reminders')?.checked || false,
        appointment_reminders: document.getElementById('appointment_reminders')?.checked || false,
        emergency_alerts: document.getElementById('emergency_alerts')?.checked || false,
        data_sharing: document.getElementById('data_sharing')?.checked || false,
        location_tracking: document.getElementById('location_tracking')?.checked || false
    };
    
    // Save to localStorage
    localStorage.setItem('health_guide_preferences', JSON.stringify(preferences));
    
    // Apply theme change
    if (preferences.theme !== 'light') {
        document.documentElement.setAttribute('data-theme', preferences.theme);
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
    
    // Apply language change
    if (preferences.language !== localStorage.getItem('preferred-language')) {
        localStorage.setItem('preferred-language', preferences.language);
        window.location.reload();
    }
    
    if (window.profileManager) {
        window.profileManager.showSuccess('Preferences saved successfully!');
    }
};

window.showSettings = function() {
    window.location.href = 'profile.html?tab=preferences';
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create profile manager instance
    window.profileManager = new ProfileManager();
    
    // Load saved preferences
    const savedPreferences = localStorage.getItem('health_guide_preferences');
    if (savedPreferences) {
        const preferences = JSON.parse(savedPreferences);
        
        // Apply saved preferences to form elements
        const preferenceInputs = [
            'language', 'theme', 'medication_reminders', 'vitals_reminders',
            'appointment_reminders', 'emergency_alerts', 'data_sharing', 'location_tracking'
        ];
        
        preferenceInputs.forEach(inputId => {
            const element = document.getElementById(inputId);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = preferences[inputId] !== false;
                } else {
                    element.value = preferences[inputId] || (inputId === 'theme' ? 'light' : 'en');
                }
            }
        });
    }
    
    // Handle URL tab parameter
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab) {
        setTimeout(() => {
            window.showTab(tab);
        }, 100);
    }
});
