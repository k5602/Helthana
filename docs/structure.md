---
inclusion: always
---

# Project Structure & Code Organization

## Architecture Patterns
- **Backend**: Django REST API with domain-based apps (`authentication`, `prescriptions`, `vitals`, `emergency`, `reports`)
- **Frontend**: Vanilla JS PWA with Tailwind CSS + DaisyUI
- **API**: RESTful endpoints following `/api/v1/{resource}/` pattern
- **Database**: PostgreSQL with standardized naming conventions

## Code Organization Rules

### Django App Structure
- One app per domain area (authentication, prescriptions, vitals, etc.)
- Each app contains: `models.py`, `views.py`, `serializers.py`, `urls.py`, `admin.py`
- Use class-based views with DRF ViewSets
- Keep views thin, move business logic to service classes
- All models must include `created_at` and `updated_at` timestamps

### Model Conventions
- Use singular names: `Prescription`, `VitalReading`, `EmergencyContact`
- Foreign keys: `{model}_id` format
- Soft deletes: `is_active` boolean field
- Table names: lowercase with underscores

### API Standards
- All endpoints: `/api/v1/{resource}/`
- Use DRF serializers for all responses
- Implement proper error handling and validation
- JWT authentication required for protected endpoints

## Naming Conventions

### Python Files
- Models: Singular class names (`Prescription`, not `Prescriptions`)
- Functions: snake_case
- Constants: UPPER_SNAKE_CASE
- Test files: `test_*.py`

### JavaScript Files
- Files: kebab-case (`api-client.js`)
- Functions: camelCase
- API functions: prefix with `api` (`apiGetPrescriptions`)
- UI functions: prefix with `ui` (`uiShowModal`)
- Constants: UPPER_SNAKE_CASE

### CSS Classes
- Use Tailwind utility classes first
- DaisyUI components when available
- Custom classes: kebab-case

## File Structure Guidelines

### Backend (`/backend/`)
```
apps/{domain}/
├── models.py          # Domain models
├── views.py           # API viewsets
├── serializers.py     # DRF serializers
├── urls.py           # URL routing
└── admin.py          # Django admin
```

### Frontend (`/frontend/`)
```
src/
├── api.js            # API communication
├── auth.js           # Authentication logic
├── ui.js             # UI interactions
├── offline.js        # PWA offline support
└── main.js           # App initialization
```

## Development Patterns
- Use environment-specific settings in `settings/` directory
- Implement feature flags for gradual rollout
- Follow atomic design for UI components
- Use event-driven architecture for frontend interactions
- All health data must be encrypted at rest