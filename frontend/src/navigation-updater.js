/**
 * Navigation Updater
 * Updates navigation links across all HTML files to work with hybrid router
 */

// Function to update navigation links in HTML content
function updateNavigationInHTML(htmlContent) {
    // Update sidebar navigation links
    htmlContent = htmlContent.replace(
        /href="prescriptions\.html"/g,
        'href="prescriptions.html" data-nav-route="/prescriptions"'
    );
    
    htmlContent = htmlContent.replace(
        /href="vitals\.html"/g,
        'href="vitals.html" data-nav-route="/vitals"'
    );
    
    htmlContent = htmlContent.replace(
        /href="reports\.html"/g,
        'href="reports.html" data-nav-route="/reports"'
    );
    
    htmlContent = htmlContent.replace(
        /href="emergency\.html"/g,
        'href="emergency.html" data-nav-route="/emergency"'
    );
    
    htmlContent = htmlContent.replace(
        /href="profile\.html"/g,
        'href="profile.html" data-nav-route="/profile"'
    );
    
    htmlContent = htmlContent.replace(
        /href="dashboard\.html"/g,
        'href="dashboard.html" data-nav-route="/dashboard"'
    );
    
    htmlContent = htmlContent.replace(
        /href="services\.html"/g,
        'href="services.html" data-nav-route="/services"'
    );
    
    htmlContent = htmlContent.replace(
        /href="about\.html"/g,
        'href="about.html" data-nav-route="/about"'
    );
    
    htmlContent = htmlContent.replace(
        /href="login\.html"/g,
        'href="login.html" data-nav-route="/login"'
    );
    
    htmlContent = htmlContent.replace(
        /href="signup\.html"/g,
        'href="signup.html" data-nav-route="/signup"'
    );
    
    htmlContent = htmlContent.replace(
        /href="index\.html"/g,
        'href="index.html" data-nav-route="/"'
    );
    
    // Update onclick handlers to use navigation functions
    htmlContent = htmlContent.replace(
        /onclick="showDashboard\(\)"/g,
        'onclick="navigateToPage(\'dashboard.html\')"'
    );
    
    htmlContent = htmlContent.replace(
        /onclick="showSettings\(\)"/g,
        'onclick="navigateToPage(\'profile.html\')"'
    );
    
    return htmlContent;
}

// Export for use in build process
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { updateNavigationInHTML };
}

// Browser-side navigation enhancement
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        // Add navigation data attributes to existing links
        const links = document.querySelectorAll('a[href$=".html"]');
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href) {
                const route = href.replace('.html', '');
                const routePath = route === 'index' ? '/' : '/' + route;
                link.setAttribute('data-nav-route', routePath);
            }
        });
        
        console.log('Navigation data attributes added to', links.length, 'links');
    });
}