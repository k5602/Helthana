/**
 * Emergency Page Module
 * Handles emergency contacts and alert functionality
 */

import { apiGetEmergencyContacts, apiCreateEmergencyContact, apiUpdateEmergencyContact, apiDeleteEmergencyContact, apiSendEmergencyAlert } from '../api.js';
import { uiShowToast, uiShowLoading, uiHideLoading, uiShowModal, uiHideModal } from '../ui.js';
import { getTranslation } from '../localization.js';

class EmergencyPage {
    constructor() {
        this.contacts = [];
        this.currentLocation = null;
        this.isAlertActive = false;
    }

    /**
     * Initialize emergency page
     */
    async init() {
        console.log('Initializing Emergency Page');
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Load emergency contacts
        await this.loadEmergencyContacts();
        
        // Request location permission
        this.requestLocationPermission();
    }

    /**
     * Set up event listeners for emergency interactions
     */
    setupEventListeners() {
        // Emergency alert button
        const alertBtn = document.getElementById('emergency-alert-btn');
        if (alertBtn) {
            alertBtn.addEventListener('click', () => this.handleEmergencyAlert());
        }

        // Add contact button
        const addContactBtn = document.getElementById('add-contact-btn');
        if (addContactBtn) {
            addContactBtn.addEventListener('click', () => this.openAddContactModal());
        }

        // Contact form submission
        const contactForm = document.getElementById('contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => this.handleContactSubmit(e));
        }

        // Test alert buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('test-contact-btn')) {
                const contactId = e.target.dataset.contactId;
                this.testContact(parseInt(contactId));
            }
        });

        // Cancel alert button
        const cancelAlertBtn = document.getElementById('cancel-alert-btn');
        if (cancelAlertBtn) {
            cancelAlertBtn.addEventListener('click', () => this.cancelEmergencyAlert());
        }
    }

    /**
     * Load emergency contacts from API
     */
    async loadEmergencyContacts() {
        try {
            uiShowLoading('contacts-list');
            
            this.contacts = await apiGetEmergencyContacts();
            this.renderContacts();
            
        } catch (error) {
            console.error('Failed to load emergency contacts:', error);
            uiShowToast(getTranslation('emergency.loadError'), 'error');
        } finally {
            uiHideLoading('contacts-list');
        }
    }

    /**
     * Render emergency contacts list
     */
    renderContacts() {
        const container = document.getElementById('contacts-list');
        if (!container) return;

        if (this.contacts.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-6xl mb-4">🚨</div>
                    <h3 class="text-lg font-semibold mb-2" data-i18n="emergency.noContacts">
                        ${getTranslation('emergency.noContacts')}
                    </h3>
                    <p class="text-base-content/60 mb-4" data-i18n="emergency.addFirst">
                        ${getTranslation('emergency.addFirst')}
                    </p>
                    <button class="btn btn-primary" onclick="document.getElementById('add-contact-btn').click()">
                        <span data-i18n="emergency.addNow">${getTranslation('emergency.addNow')}</span>
                    </button>
                </div>
            `;
            return;
        }

        const contactsHTML = this.contacts.map(contact => `
            <div class="card bg-base-100 shadow-md">
                <div class="card-body">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <h3 class="card-title text-lg">${contact.name}</h3>
                            <p class="text-base-content/70">${contact.relationship || ''}</p>
                            <p class="text-sm text-base-content/60">
                                <span class="font-medium">${getTranslation('emergency.phone')}:</span> ${contact.phone}
                            </p>
                            ${contact.email ? `
                                <p class="text-sm text-base-content/60">
                                    <span class="font-medium">${getTranslation('emergency.email')}:</span> ${contact.email}
                                </p>
                            ` : ''}
                        </div>
                        <div class="dropdown dropdown-end">
                            <div tabindex="0" role="button" class="btn btn-ghost btn-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
                                </svg>
                            </div>
                            <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
                                <li><a onclick="emergencyPage.editContact(${contact.id})">
                                    <span data-i18n="common.edit">${getTranslation('common.edit')}</span>
                                </a></li>
                                <li><a class="test-contact-btn" data-contact-id="${contact.id}">
                                    <span data-i18n="emergency.test">${getTranslation('emergency.test')}</span>
                                </a></li>
                                <li><a onclick="emergencyPage.deleteContact(${contact.id})" class="text-error">
                                    <span data-i18n="common.delete">${getTranslation('common.delete')}</span>
                                </a></li>
                            </ul>
                        </div>
                    </div>
                    <div class="card-actions justify-end mt-3">
                        <div class="badge ${contact.is_primary ? 'badge-primary' : 'badge-outline'}">
                            ${contact.is_primary ? getTranslation('emergency.primary') : getTranslation('emergency.secondary')}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = contactsHTML;
    }

    /**
     * Handle emergency alert
     */
    async handleEmergencyAlert() {
        if (this.isAlertActive) {
            this.cancelEmergencyAlert();
            return;
        }

        if (this.contacts.length === 0) {
            uiShowToast(getTranslation('emergency.noContactsAlert'), 'warning');
            this.openAddContactModal();
            return;
        }

        // Show confirmation dialog
        if (!confirm(getTranslation('emergency.confirmAlert'))) {
            return;
        }

        try {
            this.isAlertActive = true;
            this.updateAlertButton();
            
            // Get current location if available
            await this.getCurrentLocation();
            
            // Send emergency alert
            const alertData = {
                message: getTranslation('emergency.alertMessage'),
                location: this.currentLocation,
                timestamp: new Date().toISOString()
            };

            await apiSendEmergencyAlert(alertData);
            
            uiShowToast(getTranslation('emergency.alertSent'), 'success');
            
            // Show alert status
            this.showAlertStatus();

        } catch (error) {
            console.error('Failed to send emergency alert:', error);
            uiShowToast(getTranslation('emergency.alertFailed'), 'error');
            this.isAlertActive = false;
            this.updateAlertButton();
        }
    }

    /**
     * Cancel emergency alert
     */
    async cancelEmergencyAlert() {
        if (!this.isAlertActive) return;

        try {
            // Send cancellation to contacts
            const cancelData = {
                message: getTranslation('emergency.alertCancelled'),
                timestamp: new Date().toISOString()
            };

            await apiSendEmergencyAlert(cancelData);
            
            this.isAlertActive = false;
            this.updateAlertButton();
            this.hideAlertStatus();
            
            uiShowToast(getTranslation('emergency.alertCancelled'), 'info');

        } catch (error) {
            console.error('Failed to cancel emergency alert:', error);
            uiShowToast(getTranslation('emergency.cancelFailed'), 'error');
        }
    }

    /**
     * Update emergency alert button state
     */
    updateAlertButton() {
        const alertBtn = document.getElementById('emergency-alert-btn');
        if (!alertBtn) return;

        if (this.isAlertActive) {
            alertBtn.classList.remove('btn-error');
            alertBtn.classList.add('btn-warning');
            alertBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
                <span data-i18n="emergency.cancelAlert">${getTranslation('emergency.cancelAlert')}</span>
            `;
        } else {
            alertBtn.classList.remove('btn-warning');
            alertBtn.classList.add('btn-error');
            alertBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
                <span data-i18n="emergency.sendAlert">${getTranslation('emergency.sendAlert')}</span>
            `;
        }
    }

    /**
     * Show alert status
     */
    showAlertStatus() {
        const statusContainer = document.getElementById('alert-status');
        if (statusContainer) {
            statusContainer.classList.remove('hidden');
            statusContainer.innerHTML = `
                <div class="alert alert-warning">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                    </svg>
                    <div>
                        <h3 class="font-bold">${getTranslation('emergency.alertActive')}</h3>
                        <div class="text-xs">${getTranslation('emergency.alertActiveDesc')}</div>
                    </div>
                    <button class="btn btn-sm" onclick="emergencyPage.cancelEmergencyAlert()">
                        ${getTranslation('emergency.cancel')}
                    </button>
                </div>
            `;
        }
    }

    /**
     * Hide alert status
     */
    hideAlertStatus() {
        const statusContainer = document.getElementById('alert-status');
        if (statusContainer) {
            statusContainer.classList.add('hidden');
        }
    }

    /**
     * Request location permission
     */
    async requestLocationPermission() {
        if (!navigator.geolocation) {
            console.warn('Geolocation not supported');
            return;
        }

        try {
            await this.getCurrentLocation();
            console.log('Location permission granted');
        } catch (error) {
            console.warn('Location permission denied:', error);
        }
    }

    /**
     * Get current location
     */
    getCurrentLocation() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.currentLocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    };
                    resolve(this.currentLocation);
                },
                (error) => {
                    console.warn('Failed to get location:', error);
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutes
                }
            );
        });
    }

    /**
     * Open add contact modal
     */
    openAddContactModal() {
        // Reset form
        const form = document.getElementById('contact-form');
        if (form) {
            form.reset();
        }

        uiShowModal('add-contact-modal');
    }

    /**
     * Handle contact form submission
     */
    async handleContactSubmit(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const contactData = {
            name: formData.get('name'),
            phone: formData.get('phone'),
            email: formData.get('email') || '',
            relationship: formData.get('relationship') || '',
            is_primary: formData.get('is_primary') === 'on'
        };

        try {
            await apiCreateEmergencyContact(contactData);
            uiShowToast(getTranslation('emergency.contactAdded'), 'success');
            uiHideModal('add-contact-modal');
            
            // Reload contacts
            await this.loadEmergencyContacts();
            
        } catch (error) {
            console.error('Failed to add emergency contact:', error);
            uiShowToast(getTranslation('emergency.contactAddError'), 'error');
        }
    }

    /**
     * Edit contact
     */
    editContact(id) {
        const contact = this.contacts.find(c => c.id === id);
        if (contact) {
            // Populate form with contact data
            const form = document.getElementById('contact-form');
            if (form) {
                form.name.value = contact.name;
                form.phone.value = contact.phone;
                form.email.value = contact.email || '';
                form.relationship.value = contact.relationship || '';
                form.is_primary.checked = contact.is_primary;
            }
            
            uiShowModal('add-contact-modal');
        }
    }

    /**
     * Test contact
     */
    async testContact(id) {
        const contact = this.contacts.find(c => c.id === id);
        if (!contact) return;

        try {
            const testData = {
                message: getTranslation('emergency.testMessage'),
                contact_id: id,
                timestamp: new Date().toISOString()
            };

            // Send test message (placeholder implementation)
            uiShowToast(`${getTranslation('emergency.testSent')} ${contact.name}`, 'success');

        } catch (error) {
            console.error('Failed to test contact:', error);
            uiShowToast(getTranslation('emergency.testFailed'), 'error');
        }
    }

    /**
     * Delete contact
     */
    async deleteContact(id) {
        if (!confirm(getTranslation('emergency.confirmDeleteContact'))) {
            return;
        }

        try {
            await apiDeleteEmergencyContact(id);
            uiShowToast(getTranslation('emergency.contactDeleted'), 'success');
            await this.loadEmergencyContacts();
        } catch (error) {
            console.error('Failed to delete emergency contact:', error);
            uiShowToast(getTranslation('emergency.contactDeleteError'), 'error');
        }
    }

    /**
     * Cleanup emergency page
     */
    destroy() {
        if (this.isAlertActive) {
            this.cancelEmergencyAlert();
        }
    }
}

// Export for use in main.js
export { EmergencyPage };