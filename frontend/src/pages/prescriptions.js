/**
 * Prescriptions Page Module
 * Handles prescription management and scanning functionality
 */

import { 
    apiGetPrescriptions, 
    apiUploadPrescription, 
    apiDeletePrescription,
    apiUploadPrescriptionImage,
    apiValidateFileUpload,
    apiDeletePrescriptionImage,
    apiGetStorageUsage,
    apiCleanupFiles
} from '../api.js';
import { uiShowToast, uiShowLoading, uiHideLoading, uiShowModal, uiHideModal } from '../ui.js';
import { getTranslation } from '../localization.js';
import { aiInsights } from '../ai-insights.js';
import { secureFileUpload } from '../file-upload.js';

class PrescriptionsPage {
    constructor() {
        this.prescriptions = [];
        this.scanner = null;
        this.currentStream = null;
        this.medicationInteractions = [];
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
        // Main action buttons
        const scanBtn = document.querySelector('[onclick="openPrescriptionScanner()"]');
        if (scanBtn) {
            scanBtn.onclick = () => this.openScanner();
        }

        const uploadBtn = document.querySelector('[onclick="uploadFile()"]');
        if (uploadBtn) {
            uploadBtn.onclick = () => this.openFileUpload();
        }

        // Scanner modal event listeners
        document.addEventListener('DOMContentLoaded', () => {
            // Capture button
            const captureBtn = document.getElementById('capture-btn');
            if (captureBtn) {
                captureBtn.addEventListener('click', () => this.capturePhoto());
            }

            // Switch camera button
            const switchCameraBtn = document.getElementById('switch-camera-btn');
            if (switchCameraBtn) {
                switchCameraBtn.addEventListener('click', () => this.switchCamera());
            }

            // File upload input
            const fileUpload = document.getElementById('file-upload');
            if (fileUpload) {
                fileUpload.addEventListener('change', (e) => this.handleFileUpload(e));
            }

            // Close scanner button
            const closeScannerBtn = document.getElementById('close-scanner-btn');
            if (closeScannerBtn) {
                closeScannerBtn.addEventListener('click', () => this.closeScanner());
            }

            // Edit OCR results button
            const editOcrBtn = document.getElementById('edit-ocr-btn');
            if (editOcrBtn) {
                editOcrBtn.addEventListener('click', () => this.enableOcrEditing());
            }

            // Save prescription button
            const savePrescriptionBtn = document.getElementById('save-prescription-btn');
            if (savePrescriptionBtn) {
                savePrescriptionBtn.addEventListener('click', () => this.savePrescriptionFromOcr());
            }
        });

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
            
            // Load AI medication interaction warnings
            await this.loadMedicationInteractions();
            
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
     * Initialize camera scanner with device detection
     */
    async initializeScanner() {
        // Check if camera is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.warn('Camera not supported');
            this.showCameraUnsupportedMessage();
            return;
        }

        try {
            // Get available video devices
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.videoDevices = devices.filter(device => device.kind === 'videoinput');
            this.currentDeviceIndex = 0;
            
            console.log(`Found ${this.videoDevices.length} camera(s)`);
            
            // Request camera permission
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop()); // Stop immediately, just checking permission
            console.log('Camera permission granted');
            
        } catch (error) {
            console.warn('Camera permission denied:', error);
            this.handleCameraPermissionDenied(error);
        }
    }

    /**
     * Show camera unsupported message
     */
    showCameraUnsupportedMessage() {
        const cameraView = document.getElementById('camera-view');
        if (cameraView) {
            cameraView.innerHTML = `
                <div class="flex items-center justify-center h-full bg-base-200 rounded-lg">
                    <div class="text-center">
                        <div class="text-4xl mb-4">📷</div>
                        <p class="text-base-content/70" data-i18n="prescriptions.camera.unsupported">
                            Camera not supported on this device
                        </p>
                        <p class="text-sm text-base-content/50 mt-2" data-i18n="prescriptions.camera.uploadOnly">
                            Please use the upload option instead
                        </p>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Handle camera permission denied
     */
    handleCameraPermissionDenied(error) {
        const cameraView = document.getElementById('camera-view');
        if (cameraView) {
            cameraView.innerHTML = `
                <div class="flex items-center justify-center h-full bg-base-200 rounded-lg">
                    <div class="text-center">
                        <div class="text-4xl mb-4">🚫</div>
                        <p class="text-base-content/70" data-i18n="prescriptions.camera.permissionDenied">
                            Camera permission denied
                        </p>
                        <p class="text-sm text-base-content/50 mt-2" data-i18n="prescriptions.camera.enableInstructions">
                            Please enable camera access in your browser settings
                        </p>
                        <button class="btn btn-sm btn-primary mt-3" onclick="prescriptionsPage.requestCameraPermission()">
                            <span data-i18n="prescriptions.camera.tryAgain">Try Again</span>
                        </button>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Request camera permission again
     */
    async requestCameraPermission() {
        try {
            await this.initializeScanner();
            uiShowToast(getTranslation('prescriptions.camera.permissionGranted'), 'success');
        } catch (error) {
            console.error('Failed to get camera permission:', error);
            uiShowToast(getTranslation('prescriptions.camera.permissionFailed'), 'error');
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
     * Switch between available cameras
     */
    async switchCamera() {
        if (!this.videoDevices || this.videoDevices.length <= 1) {
            uiShowToast(getTranslation('prescriptions.camera.noAlternative'), 'info');
            return;
        }

        try {
            // Stop current stream
            if (this.currentStream) {
                this.currentStream.getTracks().forEach(track => track.stop());
            }

            // Switch to next camera
            this.currentDeviceIndex = (this.currentDeviceIndex + 1) % this.videoDevices.length;
            const deviceId = this.videoDevices[this.currentDeviceIndex].deviceId;

            // Start new stream with selected camera
            this.currentStream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: deviceId } }
            });

            const video = document.getElementById('scanner-video');
            if (video) {
                video.srcObject = this.currentStream;
                video.play();
            }

            uiShowToast(getTranslation('prescriptions.camera.switched'), 'success');

        } catch (error) {
            console.error('Failed to switch camera:', error);
            uiShowToast(getTranslation('prescriptions.camera.switchError'), 'error');
        }
    }

    /**
     * Upload prescription image with secure file handling and OCR processing
     */
    async uploadPrescriptionImage(imageFile) {
        try {
            // Create progress UI
            const progressUI = secureFileUpload.createProgressUI('prescriptions-container');
            
            // Upload with secure file handling
            const result = await secureFileUpload.uploadFile(
                imageFile,
                '/api/v1/prescriptions/',
                {
                    onProgress: (progressData) => {
                        secureFileUpload.updateProgressUI(progressUI, progressData);
                    },
                    onValidation: (validation) => {
                        if (!validation.valid) {
                            // Show validation errors
                            validation.errors.forEach(error => {
                                uiShowToast(error, 'error');
                            });
                        }
                        
                        // Show validation warnings
                        validation.warnings.forEach(warning => {
                            uiShowToast(warning, 'warning');
                        });
                    },
                    additionalData: {
                        process_ocr: 'true'
                    }
                }
            );
            
            if (result.error) {
                throw new Error(result.error.message || 'Upload failed');
            }

            // Show OCR results if available
            if (result.ocr_result) {
                this.displayOcrResults(result.ocr_result, result.id);
            } else {
                // If no OCR results, just show success and reload
                uiShowToast(getTranslation('prescriptions.uploadSuccess'), 'success');
                await this.loadPrescriptions();
                this.closeScanner();
            }

        } catch (error) {
            console.error('Failed to upload prescription:', error);
            uiShowToast(getTranslation('prescriptions.uploadError'), 'error');
        } finally {
            // Hide progress UI after a delay
            setTimeout(() => {
                const progressContainer = document.getElementById('upload-progress-container');
                if (progressContainer) {
                    progressContainer.remove();
                }
            }, 2000);
        }
    }

    /**
     * Show upload progress indicator
     */
    showUploadProgress() {
        const progressContainer = document.getElementById('upload-progress');
        const progressBar = document.getElementById('upload-progress-bar');
        
        if (progressContainer) {
            progressContainer.classList.remove('hidden');
        }

        // Simulate progress for better UX
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 90) progress = 90;
            
            if (progressBar) {
                progressBar.value = progress;
            }
        }, 200);

        this.progressInterval = progressInterval;
    }

    /**
     * Hide upload progress indicator
     */
    hideUploadProgress() {
        const progressContainer = document.getElementById('upload-progress');
        const progressBar = document.getElementById('upload-progress-bar');
        
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }

        if (progressBar) {
            progressBar.value = 100;
        }

        setTimeout(() => {
            if (progressContainer) {
                progressContainer.classList.add('hidden');
            }
            if (progressBar) {
                progressBar.value = 0;
            }
        }, 500);
    }

    /**
     * Display OCR results for user review
     */
    displayOcrResults(ocrResult, prescriptionId) {
        const resultsContainer = document.getElementById('ocr-results');
        if (!resultsContainer) return;

        // Store prescription ID for saving
        this.currentPrescriptionId = prescriptionId;

        // Populate OCR result fields
        document.getElementById('ocr-medication-name').value = ocrResult.medication_name || '';
        document.getElementById('ocr-dosage').value = ocrResult.dosage || '';
        document.getElementById('ocr-frequency').value = ocrResult.frequency || '';
        document.getElementById('ocr-doctor-name').value = ocrResult.doctor_name || '';
        document.getElementById('ocr-instructions').value = ocrResult.instructions || '';
        
        // Show confidence score
        const confidenceElement = document.getElementById('ocr-confidence');
        if (confidenceElement) {
            const confidence = Math.round((ocrResult.confidence || 0) * 100);
            confidenceElement.textContent = `${confidence}%`;
            
            // Color code confidence
            confidenceElement.className = 'badge ' + 
                (confidence >= 80 ? 'badge-success' : 
                 confidence >= 60 ? 'badge-warning' : 'badge-error');
        }

        // Show OCR results section
        resultsContainer.classList.remove('hidden');
        
        // Hide camera view
        const cameraView = document.getElementById('camera-view');
        if (cameraView) {
            cameraView.style.display = 'none';
        }

        uiShowToast(getTranslation('prescriptions.ocr.completed'), 'success');
    }

    /**
     * Enable editing of OCR results
     */
    enableOcrEditing() {
        const fields = [
            'ocr-medication-name',
            'ocr-dosage', 
            'ocr-frequency',
            'ocr-doctor-name',
            'ocr-instructions'
        ];

        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.readOnly = false;
                field.classList.add('input-primary');
            }
        });

        const editBtn = document.getElementById('edit-ocr-btn');
        if (editBtn) {
            editBtn.textContent = getTranslation('prescriptions.editing.enabled');
            editBtn.disabled = true;
        }

        uiShowToast(getTranslation('prescriptions.ocr.editingEnabled'), 'info');
    }

    /**
     * Save prescription from OCR results
     */
    async savePrescriptionFromOcr() {
        try {
            const prescriptionData = {
                medication_name: document.getElementById('ocr-medication-name').value,
                dosage: document.getElementById('ocr-dosage').value,
                frequency: document.getElementById('ocr-frequency').value,
                doctor_name: document.getElementById('ocr-doctor-name').value,
                instructions: document.getElementById('ocr-instructions').value
            };

            // Update the prescription with OCR data
            if (this.currentPrescriptionId) {
                await apiUpdatePrescription(this.currentPrescriptionId, prescriptionData);
            }

            uiShowToast(getTranslation('prescriptions.saveSuccess'), 'success');
            
            // Reload prescriptions and close scanner
            await this.loadPrescriptions();
            this.closeScanner();

        } catch (error) {
            console.error('Failed to save prescription:', error);
            uiShowToast(getTranslation('prescriptions.saveError'), 'error');
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
     * Show storage usage information
     */
    async showStorageUsage() {
        try {
            const usage = await apiGetStorageUsage();
            
            if (usage.storage_usage) {
                const { total_size_formatted, file_count } = usage.storage_usage;
                
                uiShowToast(`Storage: ${total_size_formatted} (${file_count} files)`, 'info');
                
                // Create storage info modal if needed
                this.createStorageInfoModal(usage.storage_usage);
            }
        } catch (error) {
            console.error('Failed to get storage usage:', error);
            uiShowToast('Failed to get storage information', 'error');
        }
    }

    /**
     * Clean up old files
     */
    async cleanupOldFiles(daysOld = 30) {
        if (!confirm(`Delete files older than ${daysOld} days?`)) {
            return;
        }

        try {
            uiShowLoading('cleanup-btn');
            
            const result = await apiCleanupFiles(daysOld);
            
            if (result.success) {
                uiShowToast(`Cleanup completed. Deleted ${result.deleted_count} files.`, 'success');
                
                if (result.errors && result.errors.length > 0) {
                    console.warn('Cleanup errors:', result.errors);
                }
                
                // Refresh storage usage
                await this.showStorageUsage();
            } else {
                throw new Error(result.error || 'Cleanup failed');
            }
        } catch (error) {
            console.error('Failed to cleanup files:', error);
            uiShowToast('File cleanup failed', 'error');
        } finally {
            uiHideLoading('cleanup-btn');
        }
    }

    /**
     * Create storage information modal
     */
    createStorageInfoModal(storageData) {
        const modalHTML = `
            <div id="storage-info-modal" class="modal">
                <div class="modal-box">
                    <h3 class="font-bold text-lg mb-4">Storage Information</h3>
                    
                    <div class="space-y-4">
                        <div class="stats shadow">
                            <div class="stat">
                                <div class="stat-title">Total Storage Used</div>
                                <div class="stat-value text-primary">${storageData.total_size_formatted}</div>
                                <div class="stat-desc">${storageData.file_count} files</div>
                            </div>
                        </div>
                        
                        <div class="divider">File Management</div>
                        
                        <div class="space-y-2">
                            <button id="cleanup-30-btn" class="btn btn-outline btn-sm w-full">
                                Clean up files older than 30 days
                            </button>
                            <button id="cleanup-60-btn" class="btn btn-outline btn-sm w-full">
                                Clean up files older than 60 days
                            </button>
                            <button id="cleanup-90-btn" class="btn btn-outline btn-sm w-full">
                                Clean up files older than 90 days
                            </button>
                        </div>
                        
                        <div class="alert alert-info">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span class="text-sm">Only inactive prescription files will be deleted. Active prescriptions are protected.</span>
                        </div>
                    </div>
                    
                    <div class="modal-action">
                        <button class="btn" onclick="document.getElementById('storage-info-modal').close()">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if present
        const existingModal = document.getElementById('storage-info-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Add event listeners
        document.getElementById('cleanup-30-btn').addEventListener('click', () => this.cleanupOldFiles(30));
        document.getElementById('cleanup-60-btn').addEventListener('click', () => this.cleanupOldFiles(60));
        document.getElementById('cleanup-90-btn').addEventListener('click', () => this.cleanupOldFiles(90));
        
        // Show modal
        document.getElementById('storage-info-modal').showModal();
    }

    /**
     * Pre-validate file before upload
     */
    async preValidateFile(file) {
        try {
            const formData = new FormData();
            formData.append('image', file);
            
            const validation = await apiValidateFileUpload(formData);
            
            if (!validation.valid) {
                // Show validation errors
                validation.errors.forEach(error => {
                    uiShowToast(error, 'error');
                });
                return false;
            }
            
            // Show validation warnings
            if (validation.warnings && validation.warnings.length > 0) {
                validation.warnings.forEach(warning => {
                    uiShowToast(warning, 'warning');
                });
            }
            
            return true;
        } catch (error) {
            console.error('Pre-validation failed:', error);
            uiShowToast('File validation failed', 'error');
            return false;
        }
    }

    /**
     * Load AI medication interaction warnings
     */
    async loadMedicationInteractions() {
        try {
            // Extract medication names from prescriptions
            const medications = this.prescriptions.map(p => p.medication_name || p.name).filter(Boolean);
            
            if (medications.length === 0) return;

            // Get AI medication interaction warnings
            if (window.aiInsights) {
                this.medicationInteractions = await window.aiInsights.checkMedicationInteractions(medications);
                this.renderMedicationInteractions();
            }
        } catch (error) {
            console.warn('Failed to load medication interactions:', error);
        }
    }

    /**
     * Render medication interactions
     */
    renderMedicationInteractions() {
        if (!this.medicationInteractions || this.medicationInteractions.length === 0) return;

        const interactionsContainer = document.getElementById('medication-interactions');
        if (!interactionsContainer) return;

        const interactionsHTML = this.medicationInteractions.map(interaction => `
            <div class="alert alert-warning">
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                    <h3 class="font-bold">${interaction.type}</h3>
                    <div class="text-xs">${interaction.warning}</div>
                </div>
            </div>
        `).join('');

        interactionsContainer.innerHTML = interactionsHTML;
    }

    /**
     * Cleanup prescriptions page
     */
    destroy() {
        // Close scanner if open
        this.closeScanner();
        
        // Clear intervals
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
    }
}

// Export for use in router
export { PrescriptionsPage };
