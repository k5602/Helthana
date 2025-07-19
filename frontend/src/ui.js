/**
 * UI Components and Interactions Module
 * Handles dynamic UI updates and component management
 */

class UIManager {
    constructor() {
        this.modals = new Map();
        this.components = new Map();
    }

    // Show loading state
    showLoading(element, text = 'Loading...') {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        
        if (element) {
            element.innerHTML = `
                <div class="flex items-center justify-center p-8">
                    <div class="loading-spinner"></div>
                    <span class="ml-2">${text}</span>
                </div>
            `;
        }
    }

    // Show error message
    showError(element, message) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        
        if (element) {
            element.innerHTML = `
                <div class="alert alert-error">
                    <span>${message}</span>
                </div>
            `;
        }
    }

    // Show success message
    showSuccess(message) {
        this.showToast(message, 'success');
    }

    // Show toast notification
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-top toast-end`;
        toast.innerHTML = `
            <div class="alert alert-${type}">
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // Create modal
    createModal(id, title, content, actions = []) {
        const modal = document.createElement('div');
        modal.id = id;
        modal.className = 'modal';
        
        const actionsHTML = actions.map(action => 
            `<button class="btn ${action.class || 'btn-primary'}" onclick="${action.onclick}">${action.text}</button>`
        ).join('');
        
        modal.innerHTML = `
            <div class="modal-box">
                <h3 class="font-bold text-lg mb-4">${title}</h3>
                <div class="modal-content">${content}</div>
                <div class="modal-action">
                    <button class="btn" onclick="window.ui.closeModal('${id}')">Close</button>
                    ${actionsHTML}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.modals.set(id, modal);
        return modal;
    }

    // Show modal
    showModal(id) {
        const modal = this.modals.get(id) || document.getElementById(id);
        if (modal) {
            modal.classList.add('modal-open');
        }
    }

    // Close modal
    closeModal(id) {
        const modal = this.modals.get(id) || document.getElementById(id);
        if (modal) {
            modal.classList.remove('modal-open');
        }
    }

    // Create prescription scanner modal
    createPrescriptionScanner() {
        const content = `
            <div class="space-y-4">
                <div class="form-control">
                    <label class="label">Doctor Name</label>
                    <input type="text" id="doctor-name" class="input input-bordered" required>
                </div>
                <div class="form-control">
                    <label class="label">Clinic Name</label>
                    <input type="text" id="clinic-name" class="input input-bordered">
                </div>
                <div class="form-control">
                    <label class="label">Prescription Date</label>
                    <input type="date" id="prescription-date" class="input input-bordered" required>
                </div>
                <div class="form-control">
                    <label class="label">Prescription Image</label>
                    <input type="file" id="prescription-image" class="file-input file-input-bordered w-full" accept="image/*" capture="camera" required>
                </div>
                <div id="image-preview" class="hidden">
                    <img id="preview-img" class="w-full max-w-md mx-auto rounded-lg" alt="Preview">
                </div>
            </div>
        `;
        
        return this.createModal('prescription-scanner', 'Scan Prescription', content, [
            { text: 'Upload & Process', class: 'btn-primary', onclick: 'window.uploadPrescription()' }
        ]);
    }

    // Create vitals form modal
    createVitalsForm() {
        const content = `
            <div class="space-y-4">
                <div class="form-control">
                    <label class="label">Vital Type</label>
                    <select id="vital-type" class="select select-bordered w-full">
                        <option value="blood_pressure">Blood Pressure</option>
                        <option value="glucose">Blood Glucose</option>
                        <option value="weight">Weight</option>
                        <option value="heart_rate">Heart Rate</option>
                        <option value="temperature">Temperature</option>
                    </select>
                </div>
                <div class="form-control">
                    <label class="label">Value</label>
                    <input type="text" id="vital-value" class="input input-bordered" placeholder="e.g., 120/80, 95, 70kg" required>
                </div>
                <div class="form-control">
                    <label class="label">Unit</label>
                    <input type="text" id="vital-unit" class="input input-bordered" placeholder="e.g., mmHg, mg/dL, kg" required>
                </div>
                <div class="form-control">
                    <label class="label">Date & Time</label>
                    <input type="datetime-local" id="vital-datetime" class="input input-bordered" required>
                </div>
                <div class="form-control">
                    <label class="label">Notes (Optional)</label>
                    <textarea id="vital-notes" class="textarea textarea-bordered" placeholder="Any additional notes..."></textarea>
                </div>
            </div>
        `;
        
        return this.createModal('vitals-form', 'Log Vital Signs', content, [
            { text: 'Save Vital', class: 'btn-primary', onclick: 'window.saveVital()' }
        ]);
    }

    // Update dashboard stats
    updateDashboardStats(stats) {
        const elements = {
            'prescription-count': stats.prescriptions || 0,
            'vitals-count': stats.vitals || 0,
            'reports-count': stats.reports || 0
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    // Render recent activity
    renderRecentActivity(activities) {
        const container = document.getElementById('recent-activity');
        if (!container) return;
        
        if (activities.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">No recent activity</p>';
            return;
        }
        
        container.innerHTML = activities.map(activity => `
            <div class="flex items-center space-x-4 p-4 bg-white rounded-lg border">
                <div class="text-2xl">${activity.icon}</div>
                <div class="flex-1">
                    <h4 class="font-semibold">${activity.title}</h4>
                    <p class="text-sm text-gray-600">${activity.description}</p>
                    <p class="text-xs text-gray-400">${activity.timestamp}</p>
                </div>
            </div>
        `).join('');
    }
}

// Global UI manager instance
const ui = new UIManager();
window.ui = ui;

// Export individual functions for module imports
export const uiShowToast = (message, type) => ui.showToast(message, type);
export const uiShowLoading = (element, text) => ui.showLoading(element, text);
export const uiHideLoading = (element) => {
    if (typeof element === 'string') {
        element = document.getElementById(element);
    }
    if (element) {
        element.innerHTML = '';
    }
};
export const uiShowModal = (id) => ui.showModal(id);
export const uiHideModal = (id) => ui.closeModal(id);
export const uiShowError = (element, message) => ui.showError(element, message);
export const uiShowSuccess = (message) => ui.showSuccess(message);

// Export the UI manager class and instance
export { UIManager, ui };

// Global UI functions
window.showPrescriptionScanner = function() {
    if (!window.ui.modals.has('prescription-scanner')) {
        window.ui.createPrescriptionScanner();
    }
    window.ui.showModal('prescription-scanner');
    
    // Set up image preview
    const imageInput = document.getElementById('prescription-image');
    const preview = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    
    if (imageInput && preview && previewImg) {
        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewImg.src = e.target.result;
                    preview.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

window.showVitalsForm = function() {
    if (!window.ui.modals.has('vitals-form')) {
        window.ui.createVitalsForm();
    }
    window.ui.showModal('vitals-form');
    
    // Set current datetime
    const datetimeInput = document.getElementById('vital-datetime');
    if (datetimeInput) {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        datetimeInput.value = now.toISOString().slice(0, 16);
    }
}

window.uploadPrescription = async function() {
    const doctorName = document.getElementById('doctor-name')?.value;
    const clinicName = document.getElementById('clinic-name')?.value;
    const prescriptionDate = document.getElementById('prescription-date')?.value;
    const imageFile = document.getElementById('prescription-image')?.files[0];
    
    if (!doctorName || !prescriptionDate || !imageFile) {
        window.ui.showToast('Please fill in all required fields', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('doctor_name', doctorName);
    formData.append('clinic_name', clinicName);
    formData.append('prescription_date', prescriptionDate);
    formData.append('image', imageFile);
    
    try {
        window.ui.showLoading('prescription-scanner .modal-content', 'Processing prescription...');
        const result = await window.api.uploadPrescription(formData);
        window.ui.closeModal('prescription-scanner');
        window.ui.showSuccess('Prescription uploaded successfully!');
        
        // Refresh dashboard if we're on it
        if (window.location.pathname.includes('dashboard') && window.loadDashboardData) {
            window.loadDashboardData();
        }
    } catch (error) {
        window.ui.showError('prescription-scanner .modal-content', 'Failed to upload prescription');
    }
}

window.saveVital = async function() {
    const vitalData = {
        vital_type: document.getElementById('vital-type')?.value,
        value: document.getElementById('vital-value')?.value,
        unit: document.getElementById('vital-unit')?.value,
        recorded_at: document.getElementById('vital-datetime')?.value,
        notes: document.getElementById('vital-notes')?.value
    };
    
    if (!vitalData.value || !vitalData.unit || !vitalData.recorded_at) {
        window.ui.showToast('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        await window.api.addVital(vitalData);
        window.ui.closeModal('vitals-form');
        window.ui.showSuccess('Vital signs logged successfully!');
        
        // Refresh dashboard if we're on it
        if (window.location.pathname.includes('dashboard') && window.loadDashboardData) {
            window.loadDashboardData();
        }
    } catch (error) {
        window.ui.showToast('Failed to save vital signs', 'error');
    }
}