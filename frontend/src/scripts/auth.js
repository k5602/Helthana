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
            const response = await api.login(username, password);
            
            if (response.access) {
                api.setToken(response.access);
                localStorage.setItem('refresh_token', response.refresh);
                
                await this.loadUserProfile();
                this.redirectToDashboard();
                return { success: true };
            } else {
                return { success: false, error: 'Invalid credentials' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Login failed. Please try again.' };
        }
    }

    // Register new user
    async register(userData) {
        try {
            const response = await api.register(userData);
            
            if (response.id) {
                // Auto-login after successful registration
                return await this.login(userData.username, userData.password);
            } else {
                return { success: false, error: response.error || 'Registration failed' };
            }
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: 'Registration failed. Please try again.' };
        }
    }

    // Load user profile
    async loadUserProfile() {
        try {
            const response = await api.request('/auth/profile/');
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
        api.clearToken();
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
const auth = new AuthManager();

// Auth form handlers
function showLoginForm() {
    const modal = document.getElementById('auth-modal');
    const title = document.getElementById('modal-title');
    const fields = document.getElementById('auth-fields');
    
    title.textContent = 'Login';
    fields.innerHTML = `
        <div class="form-control">
            <label class="label">Username</label>
            <input type="text" name="username" class="input-custom" required>
        </div>
        <div class="form-control">
            <label class="label">Password</label>
            <input type="password" name="password" class="input-custom" required>
        </div>
    `;
    
    modal.classList.add('modal-open');
}

function showRegisterForm() {
    const modal = document.getElementById('auth-modal');
    const title = document.getElementById('modal-title');
    const fields = document.getElementById('auth-fields');
    
    title.textContent = 'Register';
    fields.innerHTML = `
        <div class="grid md:grid-cols-2 gap-4">
            <div class="form-control">
                <label class="label">First Name</label>
                <input type="text" name="first_name" class="input-custom" required>
            </div>
            <div class="form-control">
                <label class="label">Last Name</label>
                <input type="text" name="last_name" class="input-custom" required>
            </div>
        </div>
        <div class="form-control">
            <label class="label">Username</label>
            <input type="text" name="username" class="input-custom" required>
        </div>
        <div class="form-control">
            <label class="label">Email</label>
            <input type="email" name="email" class="input-custom" required>
        </div>
        <div class="form-control">
            <label class="label">Phone Number</label>
            <input type="tel" name="phone_number" class="input-custom">
        </div>
        <div class="form-control">
            <label class="label">Password</label>
            <input type="password" name="password" class="input-custom" required>
        </div>
        <div class="form-control">
            <label class="label">Confirm Password</label>
            <input type="password" name="password_confirm" class="input-custom" required>
        </div>
    `;
    
    modal.classList.add('modal-open');
}

function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    modal.classList.remove('modal-open');
}

// Handle auth form submission
document.addEventListener('DOMContentLoaded', () => {
    const authForm = document.getElementById('auth-form');
    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(authForm);
            const data = Object.fromEntries(formData);
            const isLogin = document.getElementById('modal-title').textContent === 'Login';
            
            let result;
            if (isLogin) {
                result = await auth.login(data.username, data.password);
            } else {
                result = await auth.register(data);
            }
            
            if (result.success) {
                closeAuthModal();
            } else {
                alert(result.error);
            }
        });
    }
    
    // Button event listeners
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    
    if (loginBtn) loginBtn.addEventListener('click', showLoginForm);
    if (registerBtn) registerBtn.addEventListener('click', showRegisterForm);
});