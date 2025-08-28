/**
 * Voice Command Processing System
 * Provides speech recognition and command processing for health-related actions
 */

class VoiceCommandProcessor {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.isSupported = false;
        this.commands = new Map();
        this.lastCommand = null;
        this.confidenceThreshold = 0.7;
        
        this.init();
        this.setupCommands();
    }
    
    init() {
        // Check for Web Speech API support
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.isSupported = true;
            
            // Configure speech recognition
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US'; // Can be made configurable
            this.recognition.maxAlternatives = 3;
            
            this.setupEventListeners();
        } else {
            console.warn('Speech recognition not supported in this browser');
            this.showUnsupportedMessage();
        }
    }
    
    setupEventListeners() {
        if (!this.recognition) return;
        
        this.recognition.onstart = () => {
            this.isListening = true;
            this.onListeningStart();
        };
        
        this.recognition.onend = () => {
            this.isListening = false;
            this.onListeningEnd();
        };
        
        this.recognition.onresult = (event) => {
            this.handleSpeechResult(event);
        };
        
        this.recognition.onerror = (event) => {
            this.handleSpeechError(event);
        };
        
        this.recognition.onnomatch = () => {
            this.showMessage('No command recognized. Try again.', 'warning');
        };
    }
    
    setupCommands() {
        // Health-related voice commands
        this.commands.set('scan prescription', {
            action: () => this.openPrescriptionScanner(),
            description: 'Open prescription scanner',
            aliases: ['scan medicine', 'scan medication', 'take prescription photo']
        });
        
        this.commands.set('log vitals', {
            action: () => this.openVitalsForm(),
            description: 'Open vitals logging form',
            aliases: ['record vitals', 'add vitals', 'log health data']
        });
        
        this.commands.set('emergency', {
            action: () => this.triggerEmergencyAlert(),
            description: 'Trigger emergency alert',
            aliases: ['emergency alert', 'call for help', 'send emergency']
        });
        
        this.commands.set('generate report', {
            action: () => this.generateHealthReport(),
            description: 'Generate health report',
            aliases: ['create report', 'health report', 'medical report']
        });
        
        this.commands.set('dashboard', {
            action: () => this.navigateToDashboard(),
            description: 'Go to dashboard',
            aliases: ['home', 'main page', 'go home']
        });
        
        this.commands.set('help', {
            action: () => this.showCommandHelp(),
            description: 'Show available commands',
            aliases: ['what can you do', 'commands', 'voice help']
        });
        
        this.commands.set('stop listening', {
            action: () => this.stopListening(),
            description: 'Stop voice recognition',
            aliases: ['stop', 'cancel', 'quit']
        });
    }
    
    async startListening() {
        if (!this.isSupported) {
            this.showUnsupportedMessage();
            return false;
        }
        
        if (this.isListening) {
            this.showMessage('Already listening...', 'info');
            return false;
        }
        
        try {
            // Request microphone permission using PermissionManager
            const hasPermission = window.permissions ? 
                await window.permissions.requestMicrophonePermission() :
                await this.requestMicrophonePermission();
                
            if (!hasPermission) {
                this.showPermissionDeniedMessage();
                return false;
            }
            
            this.recognition.start();
            return true;
        } catch (error) {
            console.error('Error starting voice recognition:', error);
            this.showMessage('Failed to start voice recognition', 'error');
            return false;
        }
    }
    
    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }
    
    async requestMicrophonePermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Stop the stream immediately as we only needed permission
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (error) {
            console.warn('Microphone permission denied:', error);
            return false;
        }
    }
    
    handleSpeechResult(event) {
        const results = Array.from(event.results);
        const lastResult = results[results.length - 1];
        
        if (lastResult.isFinal) {
            const transcript = lastResult[0].transcript.toLowerCase().trim();
            const confidence = lastResult[0].confidence;
            
            console.log('Voice command:', transcript, 'Confidence:', confidence);
            
            if (confidence >= this.confidenceThreshold) {
                this.processCommand(transcript);
            } else {
                this.showMessage(`Command unclear (${Math.round(confidence * 100)}% confidence). Please try again.`, 'warning');
                this.showCommandSuggestions(transcript);
            }
        }
    }
    
    processCommand(transcript) {
        const command = this.findBestMatch(transcript);
        
        if (command) {
            this.lastCommand = { transcript, command: command.key, timestamp: Date.now() };
            this.showMessage(`Executing: ${command.description}`, 'success');
            
            try {
                command.action();
            } catch (error) {
                console.error('Error executing voice command:', error);
                this.showMessage('Failed to execute command', 'error');
            }
        } else {
            this.showMessage('Command not recognized', 'warning');
            this.showCommandSuggestions(transcript);
        }
    }
    
    findBestMatch(transcript) {
        // Direct command match
        for (const [key, command] of this.commands) {
            if (transcript.includes(key)) {
                return { key, ...command };
            }
        }
        
        // Alias match
        for (const [key, command] of this.commands) {
            for (const alias of command.aliases) {
                if (transcript.includes(alias)) {
                    return { key, ...command };
                }
            }
        }
        
        // Fuzzy matching for partial matches
        const words = transcript.split(' ');
        for (const [key, command] of this.commands) {
            const commandWords = key.split(' ');
            const matchCount = commandWords.filter(word => 
                words.some(w => w.includes(word) || word.includes(w))
            ).length;
            
            if (matchCount >= Math.ceil(commandWords.length / 2)) {
                return { key, ...command };
            }
        }
        
        return null;
    }
    
    handleSpeechError(event) {
        console.error('Speech recognition error:', event.error);
        
        const errorMessages = {
            'no-speech': 'No speech detected. Please try again.',
            'audio-capture': 'Microphone not accessible. Please check permissions.',
            'not-allowed': 'Microphone permission denied.',
            'network': 'Network error. Please check your connection.',
            'service-not-allowed': 'Speech recognition service not available.',
            'bad-grammar': 'Speech not recognized. Please try again.',
            'language-not-supported': 'Language not supported.'
        };
        
        const message = errorMessages[event.error] || 'Speech recognition error occurred.';
        this.showMessage(message, 'error');
        
        if (event.error === 'not-allowed') {
            this.showPermissionDeniedMessage();
        }
    }
    
    // Command Actions
    openPrescriptionScanner() {
        if (window.location.pathname.includes('prescriptions.html')) {
            // If already on prescriptions page, trigger scanner
            const scanButton = document.querySelector('[data-action="scan-prescription"]');
            if (scanButton) {
                scanButton.click();
            } else {
                this.showMessage('Scanner not available on this page', 'warning');
            }
        } else {
            // Navigate to prescriptions page
            window.location.href = 'prescriptions.html';
        }
    }
    
    openVitalsForm() {
        if (window.location.pathname.includes('vitals.html')) {
            // If already on vitals page, focus on form
            const addButton = document.querySelector('[data-action="add-vital"]');
            if (addButton) {
                addButton.click();
            } else {
                this.showMessage('Vitals form not available on this page', 'warning');
            }
        } else {
            // Navigate to vitals page
            window.location.href = 'vitals.html';
        }
    }
    
    triggerEmergencyAlert() {
        if (window.location.pathname.includes('emergency.html')) {
            // If already on emergency page, trigger alert
            const alertButton = document.querySelector('[data-action="send-alert"]');
            if (alertButton) {
                alertButton.click();
            } else {
                this.showMessage('Emergency alert not available on this page', 'warning');
            }
        } else {
            // Navigate to emergency page
            window.location.href = 'emergency.html';
        }
    }
    
    generateHealthReport() {
        if (window.location.pathname.includes('reports.html')) {
            // If already on reports page, trigger generation
            const generateButton = document.querySelector('[data-action="generate-report"]');
            if (generateButton) {
                generateButton.click();
            } else {
                this.showMessage('Report generation not available on this page', 'warning');
            }
        } else {
            // Navigate to reports page
            window.location.href = 'reports.html';
        }
    }
    
    navigateToDashboard() {
        window.location.href = 'dashboard.html';
    }
    
    showCommandHelp() {
        const commandList = Array.from(this.commands.entries())
            .map(([key, command]) => `• "${key}" - ${command.description}`)
            .join('\n');
        
        const helpMessage = `Available voice commands:\n\n${commandList}\n\nSay "stop listening" to end voice recognition.`;
        
        if (window.ui && window.ui.showModal) {
            window.ui.showModal('Voice Commands Help', helpMessage.replace(/\n/g, '<br>'));
        } else {
            alert(helpMessage);
        }
    }
    
    showCommandSuggestions(transcript) {
        const suggestions = Array.from(this.commands.keys())
            .slice(0, 3)
            .map(cmd => `"${cmd}"`)
            .join(', ');
        
        this.showMessage(`Try commands like: ${suggestions}`, 'info');
    }
    
    // UI Feedback Methods
    onListeningStart() {
        this.showMessage('Listening... Speak your command', 'info');
        this.updateVoiceButton(true);
    }
    
    onListeningEnd() {
        this.showMessage('Processing command...', 'info');
        this.updateVoiceButton(false);
    }
    
    updateVoiceButton(isListening) {
        const voiceButton = document.querySelector('[data-action="voice-command"]');
        if (voiceButton) {
            voiceButton.classList.toggle('listening', isListening);
            voiceButton.textContent = isListening ? '🎤 Listening...' : '🎤 Voice';
        }
    }
    
    showMessage(message, type = 'info') {
        if (window.ui && window.ui.showToast) {
            window.ui.showToast(message, type);
        } else {
            console.log(`Voice Command [${type}]:`, message);
        }
    }
    
    showUnsupportedMessage() {
        this.showMessage('Voice commands are not supported in this browser. Please use Chrome, Edge, or Safari.', 'warning');
    }
    
    showPermissionDeniedMessage() {
        const message = 'Microphone access is required for voice commands. Please enable microphone permissions in your browser settings.';
        this.showMessage(message, 'warning');
    }
    
    // Public API
    isListeningActive() {
        return this.isListening;
    }
    
    isVoiceSupported() {
        return this.isSupported;
    }
    
    getLastCommand() {
        return this.lastCommand;
    }
    
    getAvailableCommands() {
        return Array.from(this.commands.entries()).map(([key, command]) => ({
            command: key,
            description: command.description,
            aliases: command.aliases
        }));
    }
}

// Export for use in other modules
export { VoiceCommandProcessor };

// Global instance for easy access
window.voiceCommands = new VoiceCommandProcessor();
