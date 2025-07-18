// Navigation helper for GitHub Pages
function navigateToPage(pageName) {
  const isGitHubPages = window.location.hostname === 'gasse4.github.io';
  const baseUrl = isGitHubPages ? '/Hakathon/' : '/';
  const fullUrl = baseUrl + pageName;
  window.location.href = fullUrl;
}

// Update all navigation links
document.addEventListener('DOMContentLoaded', function() {
  const isGitHubPages = window.location.hostname === 'gasse4.github.io';
  const baseUrl = isGitHubPages ? '/Hakathon/' : '/';
  
  console.log('Navigation initialized for:', window.location.hostname);
  console.log('Base URL:', baseUrl);
  
  // Update all href attributes to include base path
  const links = document.querySelectorAll('a[href$=".html"]');
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith(baseUrl)) {
      const newHref = baseUrl + href;
      link.setAttribute('href', newHref);
      console.log('Updated link:', href, '->', newHref);
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
});

// Handle theme toggle
document.addEventListener('DOMContentLoaded', function() {
  const themeToggle = document.querySelector('.theme-controller');
  if (themeToggle) {
    themeToggle.addEventListener('change', function() {
      const theme = this.checked ? 'synthwave' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    });
    
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (savedTheme === 'synthwave') {
      themeToggle.checked = true;
    }
  }
});
