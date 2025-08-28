/**
 * Hybrid Router
 * Supports both static hosting (GitHub Pages) and dynamic hosting
 */

import { DashboardPage } from './pages/dashboard.js';
import { PrescriptionsPage } from './pages/prescriptions.js';
import { VitalsPage } from './pages/vitals.js';
import { ReportsPage } from './pages/reports.js';
import { EmergencyPage } from './pages/emergency.js';
import { ProfilePage } from './pages/profile.js';

class HybridRouter {
    constructor() {
        this.routes = new Map();
        this.currentPage = null;
        this.currentPageInstance = null;
        this.isStaticHosting = this.detectStaticHosting();
        this.baseUrl = this.getBaseUrl();
        
        this.setupRoutes();
        this.init();
    }

    /**
     * Detect if running on static hosting
     */
    detectStaticHosting() {
        const hostname = window.location.hostname;
        const pathname = window.location.pathname;
        
        // Common static hosting patterns
        const staticHostingPatterns = [
            'github.io',
            'pages.dev',
            'netlify.app',
            'vercel.app',
            'surge.sh',
            'firebase.app'
        ];
        
        // Check if hostname matches static hosting patterns
        const isStaticHost = staticHostingPatterns.some(pattern => hostname.includes(pattern));
        
        // Check if we're serving static files (no server-side routing)
        const hasStaticFiles = pathname.includes('.html') || pathname === '/' || pathname.endsWith('/');
        
        // If we can't detect API endpoints, assume static hosting
        const hasApiEndpoint = window.location.origin.includes('/api/') || 
                              document.querySelector('meta[name="api-base"]');
        
        return isStaticHost || (hasStaticFiles && !hasApiEndpoint);
    }

    /**
     * Get base URL for routing
     */
    getBaseUrl() {
        if (this.isStaticHosting) {
            // For static hosting, use the current directory
            const path = window.location.pathname;
            return path.substring(0, path.lastIndexOf('/') + 1);
        } else {
            // For dynamic hosting, use root
            return '/';
        }
    }

    /**
     * Set up route definitions
     */
    setupRoutes() {
        this.routes.set('/', {
            page: 'index',
            module: null,
            title: 'Your Health Guide'
        });
        
        this.routes.set('/dashboard', {
            page: 'dashboard',
            module: DashboardPage,
            title: 'Dashboard | Your Health Guide'
        });
        
        this.routes.set('/prescriptions', {
            page: 'prescriptions',
            module: PrescriptionsPage,
            title: 'Prescriptions | Your Health Guide'
        });
        
        this.routes.set('/vitals', {
            page: 'vitals',
            module: VitalsPage,
            title: 'Vitals | Your Health Guide'
        });
        
        this.routes.set('/reports', {
            page: 'reports',
            module: ReportsPage,
            title: 'Reports | Your Health Guide'
        });
        
        this.routes.set('/emergency', {
            page: 'emergency',
            module: EmergencyPage,
            title: 'Emergency | Your Health Guide'
        });
        
        this.routes.set('/profile', {
            page: 'profile',
            module: ProfilePage,
            title: 'Profile | Your Health Guide'
        });
        
        this.routes.set('/login', {
            page: 'login',
            module: null,
            title: 'Login | Your Health Guide'
        });
        
        this.routes.set('/signup', {
            page: 'signup',
            module: null,
            title: 'Sign Up | Your Health Guide'
        });
    }

    /**
     * Initialize router
     */
    init() {
        console.log(`Router initialized - Static hosting: ${this.isStaticHosting}`);
        
        if (this.isStaticHosting) {
            // For static hosting, initialize page-specific modules
            this.initializeCurrentPage();
        } else {
            // For dynamic hosting, set up client-side routing
            this.setupClientSideRouting();
        }
        
        // Set up navigation event listeners
        this.setupNavigationListeners();
    }

    /**
     * Initialize current page module for static hosting
     */
    initializeCurrentPage() {
        const currentPath = this.getCurrentPath();
        const route = this.findRouteForCurrentPage();
        
        if (route && route.module) {
            this.loadPageModule(route);
        }
        
        // Update page title
        if (route) {
            document.title = route.title;
        }
    }

    /**
     * Get current path for static hosting
     */
    getCurrentPath() {
        const pathname = window.location.pathname;
        const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
        
        // Convert HTML filename to route path
        if (filename === 'index.html' || filename === '') {
            return '/';
        } else if (filename.endsWith('.html')) {
            return '/' + filename.replace('.html', '');
        }
        
        return pathname;
    }

    /**
     * Find route for current page
     */
    findRouteForCurrentPage() {
        const currentPath = this.getCurrentPath();
        return this.routes.get(currentPath);
    }

    /**
     * Set up client-side routing for dynamic hosting
     */
    setupClientSideRouting() {
        // Handle browser back/forward buttons
        window.addEventListener('popstate', (event) => {
            const path = event.state?.path || window.location.pathname;
            this.navigateToPath(path, false);
        });
        
        // Initialize current route
        const currentPath = window.location.pathname;
        this.navigateToPath(currentPath, false);
    }

    /**
     * Set up navigation event listeners
     */
    setupNavigationListeners() {
        // Intercept link clicks for hybrid navigation
        document.addEventListener('click', (event) => {
            const link = event.target.closest('a[href]');
            if (!link) return;
            
            const href = link.getAttribute('href');
            
            // Skip external links and special links
            if (this.isExternalLink(href) || this.isSpecialLink(href)) {
                return;
            }
            
            // Handle navigation
            event.preventDefault();
            this.navigate(href);
        });
    }

    /**
     * Check if link is external
     */
    isExternalLink(href) {
        return href.startsWith('http://') || 
               href.startsWith('https://') || 
               href.startsWith('mailto:') || 
               href.startsWith('tel:');
    }

    /**
     * Check if link is special (hash, etc.)
     */
    isSpecialLink(href) {
        return href.startsWith('#') || href.startsWith('javascript:');
    }

    /**
     * Navigate to a route
     */
    navigate(path) {
        if (this.isStaticHosting) {
            this.navigateStatic(path);
        } else {
            this.navigateDynamic(path);
        }
    }

    /**
     * Navigate for static hosting
     */
    navigateStatic(path) {
        let targetUrl;
        
        if (path === '/' || path === '/index') {
            targetUrl = this.baseUrl + 'index.html';
        } else if (path.startsWith('/')) {
            targetUrl = this.baseUrl + path.substring(1) + '.html';
        } else if (path.endsWith('.html')) {
            targetUrl = this.baseUrl + path;
        } else {
            targetUrl = this.baseUrl + path + '.html';
        }
        
        window.location.href = targetUrl;
    }

    /**
     * Navigate for dynamic hosting
     */
    navigateDynamic(path) {
        this.navigateToPath(path, true);
    }

    /**
     * Navigate to path (dynamic hosting)
     */
    navigateToPath(path, pushState = true) {
        const route = this.routes.get(path);
        
        if (!route) {
            console.warn(`Route not found: ${path}`);
            return;
        }
        
        // Update browser history
        if (pushState) {
            history.pushState({ path }, route.title, path);
        }
        
        // Update page title
        document.title = route.title;
        
        // Load page module
        this.loadPageModule(route);
        
        // Update current page
        this.currentPage = path;
    }

    /**
     * Load page module
     */
    async loadPageModule(route) {
        try {
            // Cleanup previous page instance
            if (this.currentPageInstance && typeof this.currentPageInstance.destroy === 'function') {
                this.currentPageInstance.destroy();
            }
            
            // Load new page module
            if (route.module) {
                this.currentPageInstance = new route.module();
                
                // Initialize page if it has init method
                if (typeof this.currentPageInstance.init === 'function') {
                    await this.currentPageInstance.init();
                }
                
                // Make page instance globally available for debugging
                window[route.page + 'Page'] = this.currentPageInstance;
            }
            
        } catch (error) {
            console.error(`Failed to load page module for ${route.page}:`, error);
        }
    }

    /**
     * Get current route
     */
    getCurrentRoute() {
        if (this.isStaticHosting) {
            return this.findRouteForCurrentPage();
        } else {
            return this.routes.get(this.currentPage);
        }
    }

    /**
     * Check if route exists
     */
    hasRoute(path) {
        return this.routes.has(path);
    }

    /**
     * Add route dynamically
     */
    addRoute(path, config) {
        this.routes.set(path, config);
    }

    /**
     * Remove route
     */
    removeRoute(path) {
        this.routes.delete(path);
    }

    /**
     * Get all routes
     */
    getRoutes() {
        return Array.from(this.routes.entries());
    }

    /**
     * Refresh current page
     */
    refresh() {
        if (this.isStaticHosting) {
            window.location.reload();
        } else {
            const currentPath = this.currentPage || window.location.pathname;
            this.navigateToPath(currentPath, false);
        }
    }

    /**
     * Go back in history
     */
    back() {
        if (this.isStaticHosting) {
            window.history.back();
        } else {
            window.history.back();
        }
    }

    /**
     * Go forward in history
     */
    forward() {
        if (this.isStaticHosting) {
            window.history.forward();
        } else {
            window.history.forward();
        }
    }
}

// Create global router instance
const router = new HybridRouter();

// Make router globally available
window.router = router;

export { HybridRouter, router };
