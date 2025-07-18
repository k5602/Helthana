/**
 * Authentication Module
 * Handles user authentication and session management
 */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.checkAuthStatus();
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!localStorage.getItem('access_token');
    }

    // Check authentication status on page load
    checkAuthStatus() {
        if (this.isAuthenticated()) {
            this.loadUserProfile();
        }
    }

    // Login user
    async login(username, password) {
        try {
            const response = await window.api.login(username, password);
            
            if (response.access) {
                window.api.setToken(response.access);
                localStorage.setItem('refresh_token', response.refresh);
                
                await this.loadUserProfile();
                this.redirectToDashboard();
                return { success: true };
            } else {
                // Handle specific error messages from backend
                const errorMessage = response.detail || response.non_field_errors?.[0] || 'Invalid credentials';
                return { success: false, error: errorMessage };
            }
        } catch (error) {
            console.error('Login error:', error);
            const errorMessage = error.message || 'Login failed. Please try again.';
            return { success: false, error: errorMessage };
        }
    }

    // Register new user
    async register(userData) {
        try {
            const response = await window.api.register(userData);
            
            if (response.id) {
                // Auto-login after successful registration
                return await this.login(userData.username, userData.password);
            } else {
                // Handle validation errors from backend
                let errorMessage = 'Registration failed';
                if (response.username) {
                    errorMessage = `Username: ${response.username[0]}`;
                } else if (response.email) {
                    errorMessage = `Email: ${response.email[0]}`;
                } else if (response.password) {
                    errorMessage = `Password: ${response.password[0]}`;
                } else if (response.non_field_errors) {
                    errorMessage = response.non_field_errors[0];
                }
                return { success: false, error: errorMessage };
            }
        } catch (error) {
            console.error('Registration error:', error);
            const errorMessage = error.message || 'Registration failed. Please try again.';
            return { success: false, error: errorMessage };
        }
    }

    // Load user profile
    async loadUserProfile() {
        try {
            const response = await window.api.request('/auth/profile/');
            if (response.ok) {
                this.currentUser = await response.json();
                this.updateUIWithUser();
            }
        } catch (error) {
            console.error('Failed to load user profile:', error);
        }
    }

    // Update UI with user information
    updateUIWithUser() {
        if (this.currentUser) {
            const userInitial = document.getElementById('user-initial');
            if (userInitial) {
                userInitial.textContent = this.currentUser.first_name?.charAt(0) || 
                                         this.currentUser.username?.charAt(0) || 'U';
            }
        }
    }

    // Logout user
    logout() {
        window.api.clearToken();
        this.currentUser = null;
        window.location.href = '/';
    }

    // Redirect to dashboard
    redirectToDashboard() {
        window.location.href = '/dashboard.html';
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }
}

// Global auth manager instance
window.auth = new AuthManager();

// Auth form handlers
window.showLoginForm = function() {
    const modal = document.getElementById('auth-modal');
    const title = document.getElementById('modal-title');
    const fields = document.getElementById('auth-fields');
    
    if (!modal || !title || !fields) return;
    
    title.textContent = 'Login';
    fields.innerHTML = `
        <div class="form-control">
            <label class="label">Username</label>
            <input type="text" name="username" class="input input-bordered" required>
        </div>
        <div class="form-control">
            <label class="label">Password</label>
            <input type="password" name="password" class="input input-bordered" required>
        </div>
    `;
    
    modal.classList.add('modal-open');
}

window.showRegisterForm = function() {
    const modal = document.getElementById('auth-modal');
    const title = document.getElementById('modal-title');
    const fields = document.getElementById('auth-fields');
    
    if (!modal || !title || !fields) return;
    
    title.textContent = 'Register';
    fields.innerHTML = `
        <div class="grid md:grid-cols-2 gap-4">
            <div class="form-control">
                <label class="label">First Name</label>
                <input type="text" name="first_name" class="input input-bordered" required>
            </div>
            <div class="form-control">
                <label class="label">Last Name</label>
                <input type="text" name="last_name" class="input input-bordered" required>
            </div>
        </div>
        <div class="form-control">
            <label class="label">Username</label>
            <input type="text" name="username" class="input input-bordered" required>
        </div>
        <div class="form-control">
            <label class="label">Email</label>
            <input type="email" name="email" class="input input-bordered" required>
        </div>
        <div class="form-control">
            <label class="label">Phone Number</label>
            <input type="tel" name="phone_number" class="input input-bordered">
        </div>
        <div class="form-control">
            <label class="label">Password</label>
            <input type="password" name="password" class="input input-bordered" required>
        </div>
        <div class="form-control">
            <label class="label">Confirm Password</label>
            <input type="password" name="password_confirm" class="input input-bordered" required>
        </div>
    `;
    
    modal.classList.add('modal-open');
}

window.closeAuthModal = function() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.remove('modal-open');
}

// Display error message in modal
window.showAuthError = function(message) {
    let errorDiv = document.getElementById('auth-error');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'auth-error';
        errorDiv.className = 'alert alert-error mb-4';
        const authFields = document.getElementById('auth-fields');
        if (authFields && authFields.parentNode) {
            authFields.parentNode.insertBefore(errorDiv, authFields);
        }
    }
    errorDiv.innerHTML = `<span>${message}</span>`;
    errorDiv.style.display = 'block';
}

// Hide error message
window.hideAuthError = function() {
    const errorDiv = document.getElementById('auth-error');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

// Handle auth form submission
document.addEventListener('DOMContentLoaded', () => {
    const authForm = document.getElementById('auth-form');
    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Hide any previous errors
            window.hideAuthError();
            
            // Show loading state
            const submitBtn = authForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Loading...';
            submitBtn.disabled = true;
            
            try {
                const formData = new FormData(authForm);
                const data = Object.fromEntries(formData);
                const isLogin = document.getElementById('modal-title').textContent === 'Login';
                
                let result;
                if (isLogin) {
                    result = await window.auth.login(data.username, data.password);
                } else {
                    result = await window.auth.register(data);
                }
                
                if (result.success) {
                    window.closeAuthModal();
                } else {
                    window.showAuthError(result.error);
                }
            } catch (error) {
                window.showAuthError('An unexpected error occurred. Please try again.');
            } finally {
                // Reset button state
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    // Button event listeners
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    
    if (loginBtn) loginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.showLoginForm();
    });
    if (registerBtn) registerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.showRegisterForm();
    });
});