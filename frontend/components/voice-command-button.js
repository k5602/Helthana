/**
 * Voice Command Button Component
 * Provides a UI button for voice command activation
 */

class VoiceCommandButton {
    constructor(container) {
        this.container = container;
        this.button = null;
        this.isInitialized = false;
        
        this.init();
    }
    
    init() {
        if (this.isInitialized) return;
        
        this.createButton();
        this.setupEventListeners();
        this.updateButtonState();
        
        this.isInitialized = true;
    }
    
    createButton() {
        this.button = document.createElement('button');
        this.button.className = 'voice-command-btn btn btn-circle btn-primary';
        this.button.setAttribute('data-action', 'voice-command');
        this.button.setAttribute('title', 'Voice Commands (Click to start listening)');
        this.button.innerHTML = `
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z">
                </path>
            </svg>
            <span class="voice-text">Voice</span>
        `;
        
        // Add styles for the button
        this.addStyles();
        
        if (this.container) {
            this.container.appendChild(this.button);
        }
    }
    
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .voice-command-btn {
                position: relative;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.75rem 1rem;
                border-radius: 2rem;
                transition: all 0.3s ease;
                font-weight: 500;
            }
            
            .voice-command-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
            
            .voice-command-btn.listening {
                background: linear-gradient(45deg, #ef4444, #f97316);
                animation: pulse-listening 1.5s infinite;
            }
            
            .voice-command-btn.listening .voice-text {
                animation: fade-in-out 1.5s infinite;
            }
            
            .voice-command-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none;
            }
            
            .voice-command-btn .voice-text {
                font-size: 0.875rem;
            }
            
            @keyframes pulse-listening {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
            
            @keyframes fade-in-out {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
            
            .voice-command-floating {
                position: fixed;
                bottom: 2rem;
                right: 2rem;
                z-index: 1000;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            }
            
            @media (max-width: 768px) {
                .voice-command-floating {
                    bottom: 1rem;
                    right: 1rem;
                }
            }
        `;
        
        if (!document.querySelector('#voice-command-styles')) {
            style.id = 'voice-command-styles';
            document.head.appendChild(style);
        }
    }
    
    setupEventListeners() {
        if (!this.button) return;
        
        this.button.addEventListener('click', async (e) => {
            e.preventDefault();
            await this.handleVoiceCommand();
        });
        
        // Listen for voice command processor events
        if (window.voiceCommands) {
            // Update button state when listening starts/stops
            const originalOnListeningStart = window.voiceCommands.onListeningStart.bind(window.voiceCommands);
            const originalOnListeningEnd = window.voiceCommands.onListeningEnd.bind(window.voiceCommands);
            
            window.voiceCommands.onListeningStart = () => {
                originalOnListeningStart();
                this.setListeningState(true);
            };
            
            window.voiceCommands.onListeningEnd = () => {
                originalOnListeningEnd();
                this.setListeningState(false);
            };
        }
    }
    
    async handleVoiceCommand() {
        if (!window.voiceCommands) {
            this.showError('Voice commands not available');
            return;
        }
        
        if (!window.voiceCommands.isVoiceSupported()) {
            this.showUnsupportedMessage();
            return;
        }
        
        if (window.voiceCommands.isListeningActive()) {
            // Stop listening if currently active
            window.voiceCommands.stopListening();
        } else {
            // Start listening
            const started = await window.voiceCommands.startListening();
            if (!started) {
                this.setListeningState(false);
            }
        }
    }
    
    setListeningState(isListening) {
        if (!this.button) return;
        
        this.button.classList.toggle('listening', isListening);
        
        if (isListening) {
            this.button.innerHTML = `
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
                <span class="voice-text">Listening...</span>
            `;
            this.button.setAttribute('title', 'Click to stop listening');
        } else {
            this.button.innerHTML = `
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z">
                    </path>
                </svg>
                <span class="voice-text">Voice</span>
            `;
            this.button.setAttribute('title', 'Voice Commands (Click to start listening)');
        }
    }
    
    updateButtonState() {
        if (!this.button || !window.voiceCommands) return;
        
        const isSupported = window.voiceCommands.isVoiceSupported();
        this.button.disabled = !isSupported;
        
        if (!isSupported) {
            this.button.setAttribute('title', 'Voice commands not supported in this browser');
            this.button.classList.add('opacity-50');
        }
    }
    
    showError(message) {
        if (window.ui && window.ui.showToast) {
            window.ui.showToast(message, 'error');
        } else {
            console.error('Voice Command Error:', message);
        }
    }
    
    showUnsupportedMessage() {
        const message = 'Voice commands require a modern browser with microphone support. Please use Chrome, Edge, or Safari.';
        if (window.ui && window.ui.showToast) {
            window.ui.showToast(message, 'warning');
        } else {
            alert(message);
        }
    }
    
    // Public methods
    show() {
        if (this.button) {
            this.button.style.display = 'flex';
        }
    }
    
    hide() {
        if (this.button) {
            this.button.style.display = 'none';
        }
    }
    
    setFloating(floating = true) {
        if (this.button) {
            this.button.classList.toggle('voice-command-floating', floating);
        }
    }
    
    destroy() {
        if (this.button && this.button.parentNode) {
            this.button.parentNode.removeChild(this.button);
        }
        this.isInitialized = false;
    }
}

// Auto-initialize if container exists
document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('[data-voice-command-container]');
    if (container) {
        new VoiceCommandButton(container);
    }
});

// Export for manual initialization
export { VoiceCommandButton };
