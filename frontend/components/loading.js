/**
 * Loading Component
 * Reusable loading indicators
 */

class LoadingSpinner {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.options = {
            size: options.size || 'md',
            color: options.color || 'primary',
            text: options.text || '',
            overlay: options.overlay || false,
            ...options
        };
        this.isVisible = false;
    }

    /**
     * Show loading spinner
     */
    show(text = null) {
        if (!this.container) return;

        const loadingText = text || this.options.text;
        const sizeClass = this.getSizeClass();
        const colorClass = this.getColorClass();

        const spinnerHTML = `
            <div class="loading-spinner ${this.options.overlay ? 'loading-overlay' : ''}" data-loading="${this.containerId}">
                <div class="flex flex-col items-center justify-center p-4">
                    <span class="loading loading-spinner ${sizeClass} ${colorClass}"></span>
                    ${loadingText ? `<p class="mt-2 text-sm text-base-content/70">${loadingText}</p>` : ''}
                </div>
            </div>
        `;

        if (this.options.overlay) {
            // Create overlay
            const overlay = document.createElement('div');
            overlay.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
            overlay.setAttribute('data-loading', this.containerId);
            overlay.innerHTML = spinnerHTML;
            document.body.appendChild(overlay);
        } else {
            // Add to container
            this.container.insertAdjacentHTML('beforeend', spinnerHTML);
        }

        this.isVisible = true;
    }

    /**
     * Hide loading spinner
     */
    hide() {
        const spinners = document.querySelectorAll(`[data-loading="${this.containerId}"]`);
        spinners.forEach(spinner => spinner.remove());
        this.isVisible = false;
    }

    /**
     * Update loading text
     */
    updateText(text) {
        const spinner = document.querySelector(`[data-loading="${this.containerId}"] p`);
        if (spinner) {
            spinner.textContent = text;
        }
    }

    /**
     * Get size class
     */
    getSizeClass() {
        const sizes = {
            'xs': 'loading-xs',
            'sm': 'loading-sm',
            'md': 'loading-md',
            'lg': 'loading-lg'
        };
        return sizes[this.options.size] || 'loading-md';
    }

    /**
     * Get color class
     */
    getColorClass() {
        const colors = {
            'primary': 'text-primary',
            'secondary': 'text-secondary',
            'accent': 'text-accent',
            'neutral': 'text-neutral',
            'info': 'text-info',
            'success': 'text-success',
            'warning': 'text-warning',
            'error': 'text-error'
        };
        return colors[this.options.color] || 'text-primary';
    }
}

/**
 * Progress Bar Component
 */
class ProgressBar {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.options = {
            color: options.color || 'primary',
            showPercentage: options.showPercentage !== false,
            animated: options.animated !== false,
            ...options
        };
        this.currentValue = 0;
    }

    /**
     * Show progress bar
     */
    show(value = 0, text = '') {
        if (!this.container) return;

        const colorClass = this.getColorClass();
        const animatedClass = this.options.animated ? 'progress-animated' : '';

        const progressHTML = `
            <div class="progress-container" data-progress="${this.containerId}">
                ${text ? `<div class="text-sm font-medium mb-2">${text}</div>` : ''}
                <div class="progress ${colorClass} ${animatedClass}" data-progress-bar>
                    <div class="progress-bar" style="width: ${value}%"></div>
                </div>
                ${this.options.showPercentage ? `<div class="text-xs text-right mt-1" data-progress-text>${value}%</div>` : ''}
            </div>
        `;

        this.container.innerHTML = progressHTML;
        this.currentValue = value;
    }

    /**
     * Update progress value
     */
    update(value, text = null) {
        const progressBar = document.querySelector(`[data-progress="${this.containerId}"] .progress-bar`);
        const progressText = document.querySelector(`[data-progress="${this.containerId}"] [data-progress-text]`);
        const progressLabel = document.querySelector(`[data-progress="${this.containerId}"] .text-sm`);

        if (progressBar) {
            progressBar.style.width = `${value}%`;
        }

        if (progressText && this.options.showPercentage) {
            progressText.textContent = `${value}%`;
        }

        if (progressLabel && text) {
            progressLabel.textContent = text;
        }

        this.currentValue = value;
    }

    /**
     * Hide progress bar
     */
    hide() {
        const progress = document.querySelector(`[data-progress="${this.containerId}"]`);
        if (progress) {
            progress.remove();
        }
    }

    /**
     * Get color class
     */
    getColorClass() {
        const colors = {
            'primary': 'progress-primary',
            'secondary': 'progress-secondary',
            'accent': 'progress-accent',
            'info': 'progress-info',
            'success': 'progress-success',
            'warning': 'progress-warning',
            'error': 'progress-error'
        };
        return colors[this.options.color] || 'progress-primary';
    }
}

/**
 * Skeleton Loader Component
 */
class SkeletonLoader {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.options = {
            lines: options.lines || 3,
            avatar: options.avatar || false,
            card: options.card || false,
            ...options
        };
    }

    /**
     * Show skeleton loader
     */
    show() {
        if (!this.container) return;

        let skeletonHTML = '';

        if (this.options.card) {
            skeletonHTML = this.getCardSkeleton();
        } else if (this.options.avatar) {
            skeletonHTML = this.getAvatarSkeleton();
        } else {
            skeletonHTML = this.getLineSkeleton();
        }

        this.container.innerHTML = `
            <div class="skeleton-loader animate-pulse" data-skeleton="${this.containerId}">
                ${skeletonHTML}
            </div>
        `;
    }

    /**
     * Hide skeleton loader
     */
    hide() {
        const skeleton = document.querySelector(`[data-skeleton="${this.containerId}"]`);
        if (skeleton) {
            skeleton.remove();
        }
    }

    /**
     * Get line skeleton
     */
    getLineSkeleton() {
        const lines = Array.from({ length: this.options.lines }, (_, i) => {
            const width = i === this.options.lines - 1 ? 'w-3/4' : 'w-full';
            return `<div class="h-4 bg-base-300 rounded ${width} mb-2"></div>`;
        }).join('');

        return `<div class="space-y-2">${lines}</div>`;
    }

    /**
     * Get avatar skeleton
     */
    getAvatarSkeleton() {
        return `
            <div class="flex items-center space-x-4">
                <div class="w-12 h-12 bg-base-300 rounded-full"></div>
                <div class="flex-1 space-y-2">
                    <div class="h-4 bg-base-300 rounded w-1/2"></div>
                    <div class="h-3 bg-base-300 rounded w-1/3"></div>
                </div>
            </div>
        `;
    }

    /**
     * Get card skeleton
     */
    getCardSkeleton() {
        return `
            <div class="card bg-base-100 shadow">
                <div class="card-body">
                    <div class="h-6 bg-base-300 rounded w-3/4 mb-4"></div>
                    <div class="space-y-2">
                        <div class="h-4 bg-base-300 rounded"></div>
                        <div class="h-4 bg-base-300 rounded w-5/6"></div>
                        <div class="h-4 bg-base-300 rounded w-4/6"></div>
                    </div>
                    <div class="card-actions justify-end mt-4">
                        <div class="h-8 bg-base-300 rounded w-20"></div>
                        <div class="h-8 bg-base-300 rounded w-16"></div>
                    </div>
                </div>
            </div>
        `;
    }
}

export { LoadingSpinner, ProgressBar, SkeletonLoader };