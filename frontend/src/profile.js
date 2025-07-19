import { api } from './api.js';
import { auth } from './auth.js';

class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    async init() {
        if (!auth.isAuthenticated()) {
            window.location.href = '/login.html';
            return;
        }

        this.currentUser = await api.getProfile();
        this.populateForms();
        this.setupEventListeners();
        this.updateUserInitial();
    }

    populateForms() {
        if (!this.currentUser) return;

        // Personal Info
        document.getElementById('first_name').value = this.currentUser.first_name || '';
        document.getElementById('last_name').value = this.currentUser.last_name || '';
        document.getElementById('email').value = this.currentUser.email || '';
        document.getElementById('phone_number').value = this.currentUser.phone_number || '';
        document.getElementById('date_of_birth').value = this.currentUser.date_of_birth || '';

        // Health Profile
        document.getElementById('blood_type').value = this.currentUser.blood_type || '';
        document.getElementById('height').value = this.currentUser.height || '';
        document.getElementById('weight').value = this.currentUser.weight || '';
        document.getElementById('allergies').value = this.currentUser.allergies || '';
        document.getElementById('medical_conditions').value = this.currentUser.medical_conditions || '';
        this.calculateBMI();

        // Emergency Contact
        document.getElementById('emergency_contact_name').value = this.currentUser.emergency_contact_name || '';
        document.getElementById('emergency_contact_phone').value = this.currentUser.emergency_contact_phone || '';
        
        // Preferences
        document.getElementById('language').value = localStorage.getItem('language') || 'en';
        document.getElementById('theme').value = localStorage.getItem('theme') || 'light';
    }

    setupEventListeners() {
        document.getElementById('profile-form').addEventListener('submit', e => this.handleFormSubmit(e, 'updateProfile'));
        document.getElementById('medical-form').addEventListener('submit', e => this.handleFormSubmit(e, 'updateProfile'));
        document.getElementById('emergency-form').addEventListener('submit', e => this.handleFormSubmit(e, 'updateProfile'));
        document.getElementById('password-form').addEventListener('submit', e => this.handlePasswordChange(e));
        document.getElementById('preferences-form').addEventListener('submit', e => this.handlePreferencesSave(e));

        document.getElementById('height').addEventListener('input', () => this.calculateBMI());
        document.getElementById('weight').addEventListener('input', () => this.calculateBMI());
        
        document.getElementById('logout-btn').addEventListener('click', () => auth.logout());
        
        const deleteBtn = document.getElementById('confirm-delete-btn');
        if(deleteBtn) {
            deleteBtn.addEventListener('click', () => this.handleAccountDeletion());
        }
    }

    async handleFormSubmit(event, apiMethod) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const updatedUser = await api[apiMethod](data);
            this.currentUser = { ...this.currentUser, ...updatedUser };
            alert('Profile updated successfully!');
        } catch (error) {
            console.error('Failed to update profile:', error);
            alert('Failed to update profile.');
        }
    }

    async handlePasswordChange(event) {
        event.preventDefault();
        const form = event.target;
        const currentPassword = form.current_password.value;
        const newPassword = form.new_password.value;
        const confirmPassword = form.confirm_password.value;

        if (newPassword !== confirmPassword) {
            alert("New passwords don't match.");
            return;
        }

        try {
            await auth.changePassword(currentPassword, newPassword, confirmPassword);
            alert('Password changed successfully!');
            form.reset();
        } catch (error) {
            console.error('Failed to change password:', error);
            alert('Failed to change password.');
        }
    }

    handlePreferencesSave(event) {
        event.preventDefault();
        const language = document.getElementById('language').value;
        const theme = document.getElementById('theme').value;

        localStorage.setItem('language', language);
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
        // You might need a full page reload or a more sophisticated way to apply language changes.
        alert('Preferences saved!');
    }

    async handleAccountDeletion() {
        try {
            await api.deleteAccount();
            auth.logout();
        } catch (error) {
            console.error('Failed to delete account:', error);
            alert('Failed to delete account.');
        }
    }

    calculateBMI() {
        const height = parseFloat(document.getElementById('height').value);
        const weight = parseFloat(document.getElementById('weight').value);
        const bmiInput = document.getElementById('bmi');

        if (height > 0 && weight > 0) {
            const bmi = (weight / ((height / 100) ** 2)).toFixed(2);
            bmiInput.value = bmi;
        } else {
            bmiInput.value = '';
        }
    }
    
    updateUserInitial() {
        const userInitial = document.getElementById('user-initial');
        if (this.currentUser && userInitial) {
            userInitial.textContent = this.currentUser.first_name?.charAt(0).toUpperCase() || 'U';
        }
    }
}

function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    document.getElementById(`${tabName}-tab`).classList.remove('hidden');

    document.querySelectorAll('.tab').forEach(button => {
        button.classList.remove('tab-active');
    });
    
    const activeButton = Array.from(document.querySelectorAll('.tab')).find(button => 
        button.textContent.toLowerCase().includes(tabName.replace('-', ' '))
    );
    if(activeButton) {
        activeButton.classList.add('tab-active');
    }
}

window.showTab = showTab;
window.showDeleteAccountModal = () => document.getElementById('delete-account-modal').showModal();

document.addEventListener('DOMContentLoaded', () => {
    new ProfileManager();
    showTab('personal'); // Show personal tab by default
});
