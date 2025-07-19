/**
 * Modal Component
 * Reusable modal functionality
 */

class Modal {
    constructor(modalId) {
        this.modalId = modalId;
        this.modal = document.getElementById(modalId);
        this.isOpen = false;
        
        if (this.modal) {
            this.setupEventListeners();
        }
    }

    /**
     * Set up modal event listeners
     */
    setupEventListeners() {
        // Close button
        const closeBtn = this.modal.querySelector('.modal-close, [data-modal-close]');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Backdrop click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    /**
     * Open modal
     */
    open() {
        if (!this.modal) return;
        
        this.modal.classList.add('modal-open');
        this.isOpen = true;
        
        // Focus first input if available
        const firstInput = this.modal.querySelector('input, textarea, select');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close modal
     */
    close() {
        if (!this.modal) return;
        
        this.modal.classList.remove('modal-open');
        this.isOpen = false;
        
        // Restore body scroll
        document.body.style.overflow = '';
    }

    /**
     * Toggle modal
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    /**
     * Set modal content
     */
    setContent(content) {
        const modalBody = this.modal.querySelector('.modal-body, .modal-box');
        if (modalBody) {
            modalBody.innerHTML = content;
        }
    }

    /**
     * Set modal title
     */
    setTitle(title) {
        const modalTitle = this.modal.querySelector('.modal-title, h3');
        if (modalTitle) {
            modalTitle.textContent = title;
        }
    }
}

export { Modal };