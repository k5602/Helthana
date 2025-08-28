/**
 * Secure File Upload Utility
 * Handles file validation, compression, progress tracking, and secure upload
 */

import { uiShowToast, uiShowLoading, uiHideLoading } from './ui.js';
import { getTranslation } from './localization.js';

class SecureFileUpload {
    constructor() {
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        this.compressionQuality = 0.8;
        this.maxDimension = 2048;
    }

    /**
     * Validate file before upload
     * @param {File} file - File to validate
     * @returns {Object} Validation result
     */
    validateFile(file) {
        const errors = [];
        const warnings = [];

        // Check if file exists
        if (!file) {
            errors.push(getTranslation('fileUpload.noFile'));
            return { valid: false, errors, warnings };
        }

        // Check file size
        if (file.size > this.maxFileSize) {
            errors.push(getTranslation('fileUpload.fileTooLarge', { 
                size: this.formatFileSize(file.size),
                maxSize: this.formatFileSize(this.maxFileSize)
            }));
        }

        // Check file type
        if (!this.allowedTypes.includes(file.type)) {
            errors.push(getTranslation('fileUpload.invalidType', {
                type: file.type,
                allowedTypes: this.allowedTypes.join(', ')
            }));
        }

        // Check file name
        if (file.name.length > 255) {
            warnings.push(getTranslation('fileUpload.filenameTooLong'));
        }

        // Check for potentially dangerous extensions
        const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.vbs', '.js'];
        const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        if (dangerousExtensions.includes(fileExtension)) {
            errors.push(getTranslation('fileUpload.dangerousFile'));
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings,
            fileInfo: {
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified
            }
        };
    }

    /**
     * Compress image before upload
     * @param {File} file - Image file to compress
     * @returns {Promise<Blob>} Compressed image blob
     */
    async compressImage(file) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                try {
                    // Calculate new dimensions
                    let { width, height } = img;
                    
                    if (width > this.maxDimension || height > this.maxDimension) {
                        const ratio = Math.min(this.maxDimension / width, this.maxDimension / height);
                        width *= ratio;
                        height *= ratio;
                    }

                    // Set canvas dimensions
                    canvas.width = width;
                    canvas.height = height;

                    // Draw and compress image
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                resolve(blob);
                            } else {
                                reject(new Error('Image compression failed'));
                            }
                        },
                        'image/jpeg',
                        this.compressionQuality
                    );
                } catch (error) {
                    reject(error);
                }
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Upload file with progress tracking
     * @param {File|Blob} file - File to upload
     * @param {string} endpoint - Upload endpoint
     * @param {Object} options - Upload options
     * @returns {Promise<Object>} Upload result
     */
    async uploadFile(file, endpoint, options = {}) {
        const {
            onProgress = () => {},
            onValidation = () => {},
            additionalData = {},
            validateBeforeUpload = true
        } = options;

        try {
            // Pre-upload validation
            if (validateBeforeUpload && file instanceof File) {
                const validation = this.validateFile(file);
                onValidation(validation);
                
                if (!validation.valid) {
                    throw new Error(validation.errors.join(', '));
                }

                // Show warnings if any
                if (validation.warnings.length > 0) {
                    validation.warnings.forEach(warning => {
                        uiShowToast(warning, 'warning');
                    });
                }
            }

            // Compress image if it's an image file
            let uploadFile = file;
            if (file instanceof File && file.type.startsWith('image/')) {
                onProgress({ stage: 'compressing', progress: 10 });
                uploadFile = await this.compressImage(file);
                
                // Show compression info
                const compressionRatio = ((file.size - uploadFile.size) / file.size * 100).toFixed(1);
                if (compressionRatio > 0) {
                    uiShowToast(getTranslation('fileUpload.compressed', {
                        originalSize: this.formatFileSize(file.size),
                        newSize: this.formatFileSize(uploadFile.size),
                        ratio: compressionRatio
                    }), 'info');
                }
            }

            // Prepare form data
            const formData = new FormData();
            formData.append('image', uploadFile, file.name || 'upload.jpg');
            
            // Add additional data
            Object.keys(additionalData).forEach(key => {
                formData.append(key, additionalData[key]);
            });

            // Create XMLHttpRequest for progress tracking
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                // Track upload progress
                xhr.upload.addEventListener('progress', (event) => {
                    if (event.lengthComputable) {
                        const progress = Math.round((event.loaded / event.total) * 100);
                        onProgress({ 
                            stage: 'uploading', 
                            progress: Math.min(progress, 95), // Reserve 5% for processing
                            loaded: event.loaded,
                            total: event.total
                        });
                    }
                });

                // Handle response
                xhr.addEventListener('load', () => {
                    try {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            const response = JSON.parse(xhr.responseText);
                            onProgress({ stage: 'completed', progress: 100 });
                            resolve(response);
                        } else {
                            const errorResponse = JSON.parse(xhr.responseText);
                            reject(new Error(errorResponse.error || `HTTP ${xhr.status}`));
                        }
                    } catch (error) {
                        reject(new Error('Invalid server response'));
                    }
                });

                // Handle errors
                xhr.addEventListener('error', () => {
                    reject(new Error('Network error occurred'));
                });

                xhr.addEventListener('timeout', () => {
                    reject(new Error('Upload timeout'));
                });

                // Configure request
                xhr.open('POST', endpoint);
                xhr.timeout = 60000; // 60 second timeout
                
                // Add authentication header if available
                const token = localStorage.getItem('access_token');
                if (token) {
                    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                }

                // Start upload
                onProgress({ stage: 'starting', progress: 5 });
                xhr.send(formData);
            });

        } catch (error) {
            throw new Error(`Upload failed: ${error.message}`);
        }
    }

    /**
     * Pre-validate file via API
     * @param {File} file - File to validate
     * @returns {Promise<Object>} Validation result from server
     */
    async preValidateFile(file) {
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch('/api/v1/prescriptions/validate_upload/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            throw new Error(`Pre-validation failed: ${error.message}`);
        }
    }

    /**
     * Get user storage usage
     * @returns {Promise<Object>} Storage usage information
     */
    async getStorageUsage() {
        try {
            const response = await fetch('/api/v1/prescriptions/storage_usage/', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            throw new Error(`Failed to get storage usage: ${error.message}`);
        }
    }

    /**
     * Clean up old files
     * @param {number} daysOld - Delete files older than this many days
     * @returns {Promise<Object>} Cleanup result
     */
    async cleanupFiles(daysOld = 30) {
        try {
            const response = await fetch('/api/v1/prescriptions/cleanup_files/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ days_old: daysOld })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            throw new Error(`File cleanup failed: ${error.message}`);
        }
    }

    /**
     * Format file size in human readable format
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Create file upload progress UI
     * @param {string} containerId - Container element ID
     * @returns {Object} Progress UI elements
     */
    createProgressUI(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return null;

        const progressHTML = `
            <div id="upload-progress-container" class="hidden">
                <div class="card bg-base-100 shadow-lg">
                    <div class="card-body">
                        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
                            <span class="loading loading-spinner loading-sm"></span>
                            <span id="upload-stage-text">Preparing upload...</span>
                        </h3>
                        
                        <div class="space-y-4">
                            <div>
                                <div class="flex justify-between text-sm mb-1">
                                    <span id="upload-progress-text">0%</span>
                                    <span id="upload-speed-text"></span>
                                </div>
                                <progress id="upload-progress-bar" class="progress progress-primary w-full" value="0" max="100"></progress>
                            </div>
                            
                            <div id="upload-details" class="text-sm text-base-content/70 space-y-1">
                                <div id="file-info"></div>
                                <div id="compression-info" class="hidden"></div>
                            </div>
                            
                            <div class="flex justify-end">
                                <button id="cancel-upload-btn" class="btn btn-sm btn-outline">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', progressHTML);

        return {
            container: document.getElementById('upload-progress-container'),
            progressBar: document.getElementById('upload-progress-bar'),
            progressText: document.getElementById('upload-progress-text'),
            stageText: document.getElementById('upload-stage-text'),
            speedText: document.getElementById('upload-speed-text'),
            fileInfo: document.getElementById('file-info'),
            compressionInfo: document.getElementById('compression-info'),
            cancelBtn: document.getElementById('cancel-upload-btn')
        };
    }

    /**
     * Update progress UI
     * @param {Object} progressUI - Progress UI elements
     * @param {Object} progressData - Progress data
     */
    updateProgressUI(progressUI, progressData) {
        if (!progressUI) return;

        const { stage, progress, loaded, total } = progressData;

        // Update progress bar and text
        if (progressUI.progressBar) {
            progressUI.progressBar.value = progress;
        }
        
        if (progressUI.progressText) {
            progressUI.progressText.textContent = `${progress}%`;
        }

        // Update stage text
        if (progressUI.stageText) {
            const stageTexts = {
                'starting': getTranslation('fileUpload.stages.starting'),
                'compressing': getTranslation('fileUpload.stages.compressing'),
                'uploading': getTranslation('fileUpload.stages.uploading'),
                'processing': getTranslation('fileUpload.stages.processing'),
                'completed': getTranslation('fileUpload.stages.completed')
            };
            progressUI.stageText.textContent = stageTexts[stage] || stage;
        }

        // Update speed text for upload stage
        if (progressUI.speedText && stage === 'uploading' && loaded && total) {
            const speed = this.calculateUploadSpeed(loaded, total);
            progressUI.speedText.textContent = speed;
        }

        // Show container if hidden
        if (progressUI.container && progressUI.container.classList.contains('hidden')) {
            progressUI.container.classList.remove('hidden');
        }
    }

    /**
     * Calculate upload speed
     * @param {number} loaded - Bytes loaded
     * @param {number} total - Total bytes
     * @returns {string} Upload speed text
     */
    calculateUploadSpeed(loaded, total) {
        if (!this.uploadStartTime) {
            this.uploadStartTime = Date.now();
            return '';
        }

        const elapsed = (Date.now() - this.uploadStartTime) / 1000; // seconds
        const speed = loaded / elapsed; // bytes per second
        const remaining = (total - loaded) / speed; // seconds remaining

        return `${this.formatFileSize(speed)}/s • ${Math.round(remaining)}s remaining`;
    }

    /**
     * Hide progress UI
     * @param {Object} progressUI - Progress UI elements
     */
    hideProgressUI(progressUI) {
        if (progressUI && progressUI.container) {
            setTimeout(() => {
                progressUI.container.classList.add('hidden');
                // Reset progress
                if (progressUI.progressBar) progressUI.progressBar.value = 0;
                if (progressUI.progressText) progressUI.progressText.textContent = '0%';
            }, 1000);
        }
        
        // Reset upload start time
        this.uploadStartTime = null;
    }
}

// Create global instance
const secureFileUpload = new SecureFileUpload();

export { secureFileUpload, SecureFileUpload };
