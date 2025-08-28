/**
 * Profile Page Module
 * Handles user profile management and settings
 */

import { apiGetProfile, apiUpdateProfile, apiChangePassword, apiDeleteAccount } from '../api.js';
import { uiShowToast, uiShowLoading, uiHideLoading, uiShowModal, uiHideModal } from '../ui.js';
import { getTranslation, setLanguage, getCurrentLanguage } from '../localization.js';

class ProfilePage {
    constructor() {
        this.profile = null;
        this.isEditing = false;
    }

    /**
     * Initialize profile page
     */
    async init() {
        console.log('Initializing Profile Page');
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Load profile data
        await this.loadProfile();
    }

    /**
     * Set up event listeners for profile interactions
     */
    setupEventListeners() {
        // Edit profile button
        const editBtn = document.getElementById('edit-profile-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => this.toggleEditMode());
        }

        // Profile form submission
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));
        }

        // Change password button
        const changePasswordBtn = document.getElementById('change-password-btn');
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', () => this.openChangePasswordModal());
        }

        // Password form submission
        const passwordForm = document.getElementById('password-form');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => this.handlePasswordChange(e));
        }

        // Language selector
        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => this.handleLanguageChange(e.target.value));
        }

        // Theme selector
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => this.handleThemeChange(e.target.value));
        }

        // Delete account button
        const deleteAccountBtn = document.getElementById('delete-account-btn');
        if (deleteAccountBtn) {
            deleteAccountBtn.addEventListener('click', () => this.handleDeleteAccount());
        }

        // Export data button
        const exportDataBtn = document.getElementById('export-data-btn');
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => this.handleDataExport());
        }
    }

    /**
     * Load profile from API
     */
    async loadProfile() {
        try {
            uiShowLoading('profile-content');
            
            this.profile = await apiGetProfile();
            this.renderProfile();
            
        } catch (error) {
            console.error('Failed to load profile:', error);
            uiShowToast(getTranslation('profile.loadError'), 'error');
        } finally {
            uiHideLoading('profile-content');
        }
    }

    /**
     * Render profile information
     */
    renderProfile() {
        if (!this.profile) return;

        // Update profile display
        const nameDisplay = document.getElementById('profile-name');
        if (nameDisplay) {
            nameDisplay.textContent = `${this.profile.first_name} ${this.profile.last_name}`;
        }

        const emailDisplay = document.getElementById('profile-email');
        if (emailDisplay) {
            emailDisplay.textContent = this.profile.email;
        }

        const phoneDisplay = document.getElementById('profile-phone');
        if (phoneDisplay) {
            phoneDisplay.textContent = this.profile.phone || getTranslation('profile.notProvided');
        }

        const dobDisplay = document.getElementById('profile-dob');
        if (dobDisplay) {
            dobDisplay.textContent = this.profile.date_of_birth || getTranslation('profile.notProvided');
        }

        // Update form fields
        const form = document.getElementById('profile-form');
        if (form) {
            form.first_name.value = this.profile.first_name || '';
            form.last_name.value = this.profile.last_name || '';
            form.email.value = this.profile.email || '';
            form.phone.value = this.profile.phone || '';
            form.date_of_birth.value = this.profile.date_of_birth || '';
            form.emergency_contact.value = this.profile.emergency_contact || '';
            form.medical_conditions.value = this.profile.medical_conditions || '';
            form.allergies.value = this.profile.allergies || '';
        }

        // Update settings
        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            languageSelect.value = getCurrentLanguage();
        }

        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.value = document.documentElement.getAttribute('data-theme') || 'light';
        }
    }

    /**
     * Toggle edit mode
     */
    toggleEditMode() {
        this.isEditing = !this.isEditing;
        
        const form = document.getElementById('profile-form');
        const editBtn = document.getElementById('edit-profile-btn');
        const formInputs = form?.querySelectorAll('input, textarea, select');
        
        if (this.isEditing) {
            // Enable editing
            formInputs?.forEach(input => input.removeAttribute('disabled'));
            if (editBtn) {
                editBtn.textContent = getTranslation('common.cancel');
                editBtn.classList.remove('btn-primary');
                editBtn.classList.add('btn-outline');
            }
            
            // Show save button
            const saveBtn = document.getElementById('save-profile-btn');
            if (saveBtn) {
                saveBtn.classList.remove('hidden');
            }
        } else {
            // Disable editing
            formInputs?.forEach(input => input.setAttribute('disabled', 'disabled'));
            if (editBtn) {
                editBtn.textContent = getTranslation('profile.edit');
                editBtn.classList.remove('btn-outline');
                editBtn.classList.add('btn-primary');
            }
            
            // Hide save button
            const saveBtn = document.getElementById('save-profile-btn');
            if (saveBtn) {
                saveBtn.classList.add('hidden');
            }
            
            // Reset form to original values
            this.renderProfile();
        }
    }

    /**
     * Handle profile update
     */
    async handleProfileUpdate(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const profileData = {
            first_name: formData.get('first_name'),
            last_name: formData.get('last_name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            date_of_birth: formData.get('date_of_birth'),
            emergency_contact: formData.get('emergency_contact'),
            medical_conditions: formData.get('medical_conditions'),
            allergies: formData.get('allergies')
        };

        try {
            uiShowLoading('save-profile-btn');
            
            this.profile = await apiUpdateProfile(profileData);
            
            uiShowToast(getTranslation('profile.updateSuccess'), 'success');
            this.toggleEditMode(); // Exit edit mode
            this.renderProfile();
            
        } catch (error) {
            console.error('Failed to update profile:', error);
            uiShowToast(getTranslation('profile.updateError'), 'error');
        } finally {
            uiHideLoading('save-profile-btn');
        }
    }

    /**
     * Open change password modal
     */
    openChangePasswordModal() {
        // Reset form
        const form = document.getElementById('password-form');
        if (form) {
            form.reset();
        }

        uiShowModal('change-password-modal');
    }

    /**
     * Handle password change
     */
    async handlePasswordChange(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const currentPassword = formData.get('current_password');
        const newPassword = formData.get('new_password');
        const confirmPassword = formData.get('confirm_password');

        // Validate passwords match
        if (newPassword !== confirmPassword) {
            uiShowToast(getTranslation('profile.passwordMismatch'), 'error');
            return;
        }

        // Validate password strength
        if (newPassword.length < 8) {
            uiShowToast(getTranslation('profile.passwordTooShort'), 'error');
            return;
        }

        try {
            await apiChangePassword({
                current_password: currentPassword,
                new_password: newPassword
            });
            
            uiShowToast(getTranslation('profile.passwordChanged'), 'success');
            uiHideModal('change-password-modal');
            
        } catch (error) {
            console.error('Failed to change password:', error);
            uiShowToast(getTranslation('profile.passwordChangeError'), 'error');
        }
    }

    /**
     * Handle language change
     */
    async handleLanguageChange(language) {
        try {
            await setLanguage(language);
            uiShowToast(getTranslation('profile.languageChanged'), 'success');
            
            // Reload page to apply new language
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            
        } catch (error) {
            console.error('Failed to change language:', error);
            uiShowToast(getTranslation('profile.languageChangeError'), 'error');
        }
    }

    /**
     * Handle theme change
     */
    handleThemeChange(theme) {
        try {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            uiShowToast(getTranslation('profile.themeChanged'), 'success');
            
        } catch (error) {
            console.error('Failed to change theme:', error);
            uiShowToast(getTranslation('profile.themeChangeError'), 'error');
        }
    }

    /**
     * Handle data export
     */
    async handleDataExport() {
        try {
            uiShowToast(getTranslation('profile.exportingData'), 'info');
            
            // This would call an API to generate and download user data
            // For now, we'll create a simple JSON export
            const exportData = {
                profile: this.profile,
                exported_at: new Date().toISOString(),
                app_version: '1.0.0'
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `health-guide-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            uiShowToast(getTranslation('profile.exportSuccess'), 'success');
            
        } catch (error) {
            console.error('Failed to export data:', error);
            uiShowToast(getTranslation('profile.exportError'), 'error');
        }
    }

    /**
     * Handle account deletion
     */
    async handleDeleteAccount() {
        // Multiple confirmations for account deletion
        if (!confirm(getTranslation('profile.confirmDelete1'))) {
            return;
        }
        
        if (!confirm(getTranslation('profile.confirmDelete2'))) {
            return;
        }
        
        const userConfirmation = prompt(getTranslation('profile.typeDeleteToConfirm'));
        if (userConfirmation !== 'DELETE') {
            uiShowToast(getTranslation('profile.deleteCancelled'), 'info');
            return;
        }

        try {
            await apiDeleteAccount();
            
            uiShowToast(getTranslation('profile.accountDeleted'), 'success');
            
            // Clear local storage and redirect to login
            localStorage.clear();
            sessionStorage.clear();
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            
        } catch (error) {
            console.error('Failed to delete account:', error);
            uiShowToast(getTranslation('profile.deleteError'), 'error');
        }
    }

    /**
     * Cleanup profile page
     */
    destroy() {
        if (this.isEditing) {
            this.toggleEditMode();
        }
    }
}

// Export for use in main.js
export { ProfilePage };
