---
inclusion: always
---

# Technology Stack & Development Guidelines

## Technology Constraints

### Frontend Rules
- **NO JavaScript frameworks** - Use vanilla ES6+ only
- **Styling**: Tailwind CSS utilities first, DaisyUI components second, custom CSS last
- **PWA Requirements**: All features must work offline using IndexedDB
- **Bundle Size**: Keep total JS bundle under 200KB compressed
- **Browser Support**: Modern browsers only (ES6+ features allowed)

### Backend Rules
- **Python 3.10+** required - use type hints for all functions
- **Django REST Framework** - use ViewSets, not function-based views
- **Database**: PostgreSQL only - no SQLite even for development
- **Authentication**: JWT tokens only - no session-based auth
- **API Versioning**: All endpoints must use `/api/v1/` prefix

## Development Patterns

### Django Backend Patterns
- Use class-based views with DRF ViewSets exclusively
- Implement business logic in separate service classes, not in views
- All models must inherit from a base model with `created_at`/`updated_at`
- Use Django's built-in validation - avoid custom validators unless necessary
- Implement soft deletes with `is_active` boolean field

### JavaScript Frontend Patterns
- Use ES6 modules - import/export syntax required
- Prefix API functions with `api` (e.g., `apiGetPrescriptions`)
- Prefix UI functions with `ui` (e.g., `uiShowModal`)
- Use event delegation for dynamic content
- Store app state in a single global object, not scattered variables

### API Integration Patterns
- All API calls must handle offline scenarios
- Use fetch API with proper error handling and timeouts
- Implement exponential backoff for failed requests
- Cache API responses in IndexedDB for offline access

## File Organization Rules

### Backend Files (`/backend/`)
- Place business logic in `services/` directory within each app
- Use `serializers.py` for all API input/output validation
- Keep `views.py` thin - delegate to service classes
- Place shared utilities in `health_guide/utils/`

### Frontend Files (`/frontend/src/`)
- `api.js` - All backend communication functions
- `auth.js` - Authentication and JWT handling
- `ui.js` - DOM manipulation and UI interactions
- `offline.js` - Service worker and offline functionality
- `main.js` - App initialization and routing

## Technology-Specific Guidelines

### Django REST Framework
- Use `ModelViewSet` for CRUD operations
- Use `@action` decorator for custom endpoints
- Implement pagination on all list endpoints
- Use `permission_classes` on all protected views

### Tailwind CSS + DaisyUI
- Use utility classes for spacing, colors, typography
- Use DaisyUI components for complex UI elements (modals, dropdowns)
- Avoid custom CSS unless absolutely necessary
- Use responsive prefixes (sm:, md:, lg:) for mobile-first design

### PWA Implementation
- Register service worker in `main.js`
- Cache static assets and API responses
- Implement background sync for offline actions
- Use IndexedDB for structured data storage

## Quality Checks

### Before Committing Code
- Run `python manage.py check` for Django issues
- Verify all API endpoints return proper HTTP status codes
- Test offline functionality in browser dev tools
- Validate HTML with semantic markup
- Check Tailwind classes are properly purged

### Performance Validation
- Lighthouse PWA score must be >90
- API response times under 500ms
- Frontend bundle size under 200KB
- Database queries optimized (use `select_related`/`prefetch_related`)

## Development Commands

### Initial Setup
```bash
# Backend setup
cd backend && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate

# Frontend setup  
cd frontend && npm install && npm run build-css
```

### Daily Development
```bash
# Start backend (from /backend/)
python manage.py runserver

# Watch Tailwind changes (from /frontend/)
npm run watch-css

# Run tests
python manage.py test  # Backend tests
```

### Deployment Preparation
```bash
# Build production assets
npm run build-css

# Collect static files
python manage.py collectstatic

# Run security checks
python manage.py check --deploy
```

## Environment Configuration

### Required Environment Variables
- `SECRET_KEY` - Django secret (generate new for each environment)
- `DATABASE_URL` - PostgreSQL connection string
- `DEBUG` - Set to `False` in production
- `ALLOWED_HOSTS` - Comma-separated list of allowed domains
- `GOOGLE_CLOUD_PROJECT` - GCP project ID for AI services

### Optional Environment Variables
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` - For SMS notifications
- `REDIS_URL` - For caching (defaults to local Redis)