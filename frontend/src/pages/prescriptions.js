/**
 * Prescriptions Page Module
 * Handles prescription management and scanning functionality
 */

import { apiGetPrescriptions, apiUploadPrescription, apiDeletePrescription } from '../api.js';
import { uiShowToast, uiShowLoading, uiHideLoading, uiShowModal, uiHideModal } from '../ui.js';
import { getTranslation } from '../localization.js';

class PrescriptionsPage {
    constructor() {
        this.prescriptions = [];
        this.scanner = null;
        this.currentStream = null;
    }

    /**
     * Initialize prescriptions page
     */
    async init() {
        console.log('Initializing Prescriptions Page');
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Load prescriptions data
        await this.loadPrescriptions();
        
        // Initialize scanner if supported
        this.initializeScanner();
    }

    /**
     * Set up event listeners for prescription interactions
     */
    setupEventListeners() {
        // Scan prescription button
        const scanBtn = document.getElementById('scan-prescription-btn');
        if (scanBtn) {
            scanBtn.addEventListener('click', () => this.openScanner());
        }

        // Upload prescription button
        const uploadBtn = document.getElementById('upload-prescription-btn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => this.openFileUpload());
        }

        // File input for manual upload
        const fileInput = document.getElementById('prescription-file-input');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        }

        // Close scanner button
        const closeScannerBtn = document.getElementById('close-scanner');
        if (closeScannerBtn) {
            closeScannerBtn.addEventListener('click', () => this.closeScanner());
        }

        // Capture photo button
        const captureBtn = document.getElementById('capture-photo');
        if (captureBtn) {
            captureBtn.addEventListener('click', () => this.capturePhoto());
        }

        // Refresh prescriptions
        const refreshBtn = document.getElementById('refresh-prescriptions');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadPrescriptions());
        }
    }

    /**
     * Load prescriptions from API
     */
    async loadPrescriptions() {
        try {
            uiShowLoading('prescriptions-list');
            
            this.prescriptions = await apiGetPrescriptions();
            this.renderPrescriptions();
            
        } catch (error) {
            console.error('Failed to load prescriptions:', error);
            uiShowToast(getTranslation('prescriptions.loadError'), 'error');
        } finally {
            uiHideLoading('prescriptions-list');
        }
    }

    /**
     * Render prescriptions list
     */
    renderPrescriptions() {
        const container = document.getElementById('prescriptions-list');
        if (!container) return;

        if (this.prescriptions.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-6xl mb-4">💊</div>
                    <h3 class="text-lg font-semibold mb-2" data-i18n="prescriptions.noPrescriptions">
                        ${getTranslation('prescriptions.noPrescriptions')}
                    </h3>
                    <p class="text-base-content/60 mb-4" data-i18n="prescriptions.scanFirst">
                        ${getTranslation('prescriptions.scanFirst')}
                    </p>
                    <button class="btn btn-primary" onclick="document.getElementById('scan-prescription-btn').click()">
                        <span data-i18n="prescriptions.scanNow">${getTranslation('prescriptions.scanNow')}</span>
                    </button>
                </div>
            `;
            return;
        }

        const prescriptionsHTML = this.prescriptions.map(prescription => `
            <div class="card bg-base-100 shadow-md">
                <div class="card-body">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <h3 class="card-title text-lg">${prescription.medication_name || 'Unknown Medication'}</h3>
                            <p class="text-base-content/70">${prescription.dosage || ''}</p>
                            <p class="text-sm text-base-content/60">${prescription.doctor_name || ''}</p>
                            <p class="text-xs text-base-content/50">${prescription.date_prescribed || ''}</p>
                        </div>
                        <div class="dropdown dropdown-end">
                            <div tabindex="0" role="button" class="btn btn-ghost btn-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
                                </svg>
                            </div>
                            <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
                                <li><a onclick="prescriptionsPage.viewPrescription(${prescription.id})">
                                    <span data-i18n="common.view">${getTranslation('common.view')}</span>
                                </a></li>
                                <li><a onclick="prescriptionsPage.editPrescription(${prescription.id})">
                                    <span data-i18n="common.edit">${getTranslation('common.edit')}</span>
                                </a></li>
                                <li><a onclick="prescriptionsPage.deletePrescription(${prescription.id})" class="text-error">
                                    <span data-i18n="common.delete">${getTranslation('common.delete')}</span>
                                </a></li>
                            </ul>
                        </div>
                    </div>
                    ${prescription.image_url ? `
                        <div class="mt-3">
                            <img src="${prescription.image_url}" alt="Prescription" class="w-full h-32 object-cover rounded-lg">
                        </div>
                    ` : ''}
                    <div class="card-actions justify-end mt-3">
                        <div class="badge badge-outline">${prescription.status || 'Active'}</div>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = prescriptionsHTML;
    }

    /**
     * Initialize camera scanner
     */
    async initializeScanner() {
        // Check if camera is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.warn('Camera not supported');
            return;
        }

        try {
            // Request camera permission
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop()); // Stop immediately, just checking permission
            console.log('Camera permission granted');
        } catch (error) {
            console.warn('Camera permission denied:', error);
        }
    }

    /**
     * Open camera scanner
     */
    async openScanner() {
        try {
            const video = document.getElementById('scanner-video');
            const modal = document.getElementById('scanner-modal');
            
            if (!video || !modal) {
                console.error('Scanner elements not found');
                return;
            }

            // Show scanner modal
            uiShowModal('scanner-modal');

            // Start camera stream
            this.currentStream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment' // Use back camera if available
                } 
            });
            
            video.srcObject = this.currentStream;
            video.play();

        } catch (error) {
            console.error('Failed to open scanner:', error);
            uiShowToast(getTranslation('prescriptions.scannerError'), 'error');
            this.closeScanner();
        }
    }

    /**
     * Close camera scanner
     */
    closeScanner() {
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
        }

        const video = document.getElementById('scanner-video');
        if (video) {
            video.srcObject = null;
        }

        uiHideModal('scanner-modal');
    }

    /**
     * Capture photo from camera
     */
    async capturePhoto() {
        const video = document.getElementById('scanner-video');
        const canvas = document.getElementById('scanner-canvas');
        
        if (!video || !canvas) return;

        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw video frame to canvas
        context.drawImage(video, 0, 0);
        
        // Convert to blob
        canvas.toBlob(async (blob) => {
            if (blob) {
                await this.uploadPrescriptionImage(blob);
                this.closeScanner();
            }
        }, 'image/jpeg', 0.8);
    }

    /**
     * Open file upload dialog
     */
    openFileUpload() {
        const fileInput = document.getElementById('prescription-file-input');
        if (fileInput) {
            fileInput.click();
        }
    }

    /**
     * Handle file upload from input
     */
    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            await this.uploadPrescriptionImage(file);
        }
    }

    /**
     * Upload prescription image
     */
    async uploadPrescriptionImage(imageFile) {
        try {
            uiShowLoading('upload-progress');
            uiShowToast(getTranslation('prescriptions.uploading'), 'info');

            const result = await apiUploadPrescription(imageFile);
            
            uiShowToast(getTranslation('prescriptions.uploadSuccess'), 'success');
            
            // Reload prescriptions to show the new one
            await this.loadPrescriptions();

        } catch (error) {
            console.error('Failed to upload prescription:', error);
            uiShowToast(getTranslation('prescriptions.uploadError'), 'error');
        } finally {
            uiHideLoading('upload-progress');
        }
    }

    /**
     * View prescription details
     */
    viewPrescription(id) {
        const prescription = this.prescriptions.find(p => p.id === id);
        if (prescription) {
            // Show prescription details modal
            console.log('View prescription:', prescription);
            // TODO: Implement prescription details modal
        }
    }

    /**
     * Edit prescription
     */
    editPrescription(id) {
        const prescription = this.prescriptions.find(p => p.id === id);
        if (prescription) {
            // Show edit prescription modal
            console.log('Edit prescription:', prescription);
            // TODO: Implement prescription edit modal
        }
    }

    /**
     * Delete prescription
     */
    async deletePrescription(id) {
        if (!confirm(getTranslation('prescriptions.confirmDelete'))) {
            return;
        }

        try {
            await apiDeletePrescription(id);
            uiShowToast(getTranslation('prescriptions.deleteSuccess'), 'success');
            await this.loadPrescriptions();
        } catch (error) {
            console.error('Failed to delete prescription:', error);
            uiShowToast(getTranslation('prescriptions.deleteError'), 'error');
        }
    }

    /**
     * Cleanup prescriptions page
     */
    destroy() {
        this.closeScanner();
    }
}

// Export for use in main.js
export { PrescriptionsPage };