---
inclusion: always
---

# Product Overview & Development Guidelines

## Your Health Guide (دليلك الصحي)

A Progressive Web App (PWA) designed to transform healthcare management in Egypt by providing an intelligent, accessible digital health companion for patients with chronic conditions.

### Core Problem
Egyptian patients face challenges with illegible prescriptions (78% contain errors), inconsistent health tracking (62% don't track vitals), inefficient doctor visits (85% rely on memory), and digital accessibility barriers (65% of elderly struggle with complex apps).

### Key Features
- **AI-Powered Prescription Scanner**: Convert handwritten prescriptions to digital records with 95%+ accuracy
- **Smart Vitals Tracker**: Log and visualize health metrics over time
- **Voice-First Interface**: Egyptian Arabic voice command support
- **Offline-First Design**: Works without internet connectivity
- **Health Report Generator**: PDF reports for doctor visits
- **Emergency SOS System**: One-tap emergency alerts

### Target Users
- Patients with chronic conditions (diabetes, hypertension, etc.)
- Elderly patients requiring simple, accessible interfaces
- Caregivers managing health for family members
- Healthcare providers needing structured patient data

### Success Metrics
- Prescription scanning accuracy >95%
- User engagement with daily vitals tracking
- Reduction in medication errors
- Improved doctor-patient communication through structured reports

## Development Guidelines

### Accessibility Requirements
- All UI components must be WCAG 2.1 AA compliant
- Minimum text contrast ratio of 4.5:1
- Support screen readers (ARIA attributes required)
- Support text scaling up to 200%
- All interactive elements must be keyboard accessible

### Localization Standards
- All user-facing text must use translation keys in `localization.js`
- Right-to-left (RTL) layout support for Arabic interface
- Date formats: DD/MM/YYYY (Egyptian standard)
- Time formats: 12-hour with AM/PM
- Numbers should display in Western Arabic numerals (0-9)

### Performance Targets
- Initial load < 3 seconds on 3G connections
- Time to Interactive < 5 seconds
- Offline functionality for core features
- PWA Lighthouse score > 90
- Bundle size < 200KB (compressed)

### Security Requirements
- All API endpoints must validate JWT tokens
- Implement CSRF protection on forms
- Store sensitive data only in secure storage
- Use Content Security Policy headers
- Implement rate limiting on authentication endpoints
- No sensitive data in localStorage (use IndexedDB with encryption)

### Code Style & Patterns
- Follow Django REST Framework viewset pattern for APIs
- Use service layer pattern for business logic
- Implement repository pattern for data access
- Follow atomic design for UI components
- Use event-driven architecture for frontend interactions
- Implement feature flags for gradual rollout

### Medical Data Handling
- All health data must be encrypted at rest
- Comply with Egyptian health data regulations
- Implement data retention policies
- Provide data export functionality
- Use standard medical coding where applicable