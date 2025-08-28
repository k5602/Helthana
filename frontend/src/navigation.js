/**
 * Enhanced Navigation Helper
 * Works with hybrid router for both static and dynamic hosting
 */

// Navigation helper for different environments
export function navigateToPage(pageName) {
  if (window.router) {
    // Use hybrid router if available
    const path = pageName.replace('.html', '');
    window.router.navigate('/' + path);
  } else {
    // Fallback to traditional navigation
    const isGitHubPages = window.location.hostname === 'gasse4.github.io';
    const baseUrl = isGitHubPages ? '/Hakathon/' : '/';
    const fullUrl = baseUrl + pageName;
    window.location.href = fullUrl;
  }
}

// Enhanced navigation functions for specific pages
window.showDashboard = function() {
  navigateToPage('dashboard.html');
}

window.showPrescriptions = function() {
  navigateToPage('prescriptions.html');
}

window.showVitals = function() {
  navigateToPage('vitals.html');
}

window.showReports = function() {
  navigateToPage('reports.html');
}

window.showEmergency = function() {
  navigateToPage('emergency.html');
}

window.showProfile = function() {
  navigateToPage('profile.html');
}

window.showServices = function() {
  navigateToPage('services.html');
}

window.showAbout = function() {
  navigateToPage('about.html');
}

// Update navigation links for hybrid routing
document.addEventListener('DOMContentLoaded', function() {
  console.log('Enhanced navigation initialized');
  
  // Wait for router to be available
  setTimeout(() => {
    updateNavigationLinks();
  }, 100);
});

function updateNavigationLinks() {
  if (!window.router) {
    console.log('Router not available, using traditional navigation');
    updateTraditionalNavigation();
    return;
  }
  
  console.log('Updating navigation for hybrid routing');
  
  // Update all navigation links to work with hybrid router
  const links = document.querySelectorAll('a[href$=".html"]');
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
      // Convert HTML links to router paths
      const path = href.replace('.html', '');
      const routerPath = path.startsWith('/') ? path : '/' + path;
      
      // Update href for static hosting compatibility
      link.setAttribute('href', href);
      
      // Add click handler for dynamic routing
      link.addEventListener('click', (e) => {
        e.preventDefault();
        window.router.navigate(routerPath);
      });
      
      console.log('Updated navigation link:', href, '->', routerPath);
    }
  });
  
  // Update sidebar navigation specifically
  updateSidebarNavigation();
  
  // Update form redirects
  updateFormRedirects();
}

function updateTraditionalNavigation() {
  const isGitHubPages = window.location.hostname === 'gasse4.github.io';
  const baseUrl = isGitHubPages ? '/Hakathon/' : '/';
  
  console.log('Traditional navigation for:', window.location.hostname);
  console.log('Base URL:', baseUrl);
  
  // Update all href attributes to include base path
  const links = document.querySelectorAll('a[href$=".html"]');
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith(baseUrl)) {
      const newHref = baseUrl + href;
      link.setAttribute('href', newHref);
      console.log('Updated traditional link:', href, '->', newHref);
    }
  });
  
  // Update form actions if any
  const forms = document.querySelectorAll('form[action$=".html"]');
  forms.forEach(form => {
    const action = form.getAttribute('action');
    if (action && !action.startsWith('http') && !action.startsWith('#') && !action.startsWith(baseUrl)) {
      form.setAttribute('action', baseUrl + action);
    }
  });
}

function updateSidebarNavigation() {
  // Update sidebar navigation links specifically
  const sidebarLinks = document.querySelectorAll('aside a[href], .sidebar a[href]');
  sidebarLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.endsWith('.html')) {
      const path = href.replace('.html', '');
      const routerPath = path.startsWith('/') ? path : '/' + path;
      
      link.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.router) {
          window.router.navigate(routerPath);
        } else {
          window.location.href = href;
        }
      });
    }
  });
}

function updateFormRedirects() {
  // Update form redirects to use router
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    const originalSubmit = form.onsubmit;
    
    form.addEventListener('submit', (e) => {
      // Let the original submit handler run first
      if (originalSubmit) {
        const result = originalSubmit.call(form, e);
        if (result === false) return false;
      }
      
      // Check for redirect after form submission
      const redirectTo = form.dataset.redirectTo;
      if (redirectTo && window.router) {
        setTimeout(() => {
          const path = redirectTo.replace('.html', '');
          const routerPath = path.startsWith('/') ? path : '/' + path;
          window.router.navigate(routerPath);
        }, 100);
      }
    });
  });
}

// Handle theme toggle
document.addEventListener('DOMContentLoaded', function() {
  const themeToggle = document.querySelector('.theme-controller');
  if (themeToggle) {
    themeToggle.addEventListener('change', function() {
  const theme = this.checked ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    });
    
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  if (savedTheme === 'dark') {
      themeToggle.checked = true;
    }
  }
});
