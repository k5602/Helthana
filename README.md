# Helthana:Your Health Guide (دليلك الصحي)

A Progressive Web App (PWA) designed to transform healthcare management in Egypt by providing an intelligent, accessible digital health companion for patients with chronic conditions.

## 🩺 Problem Statement

Egyptian patients with chronic diseases face significant challenges:

- **📝 Illegible Prescriptions**: 78% of handwritten prescriptions contain at least one error, leading to medication mistakes
- **📊 Inconsistent Tracking**: 62% of patients don't track their vitals regularly, making disease management difficult
- **🏥 Inefficient Doctor Visits**: 85% of consultations rely on patient memory rather than accurate data
- **📱 Digital Divide**: 65% of elderly patients struggle with complex health apps, creating barriers to digital health adoption
- **🔌 Connectivity Issues**: Intermittent internet access in many areas prevents reliable use of cloud-based health solutions

## 💡 Our Solution

"Your Health Guide" is an offline-first Progressive Web App that combines AI capabilities with a simple, intuitive interface to solve these challenges:

### Key Differentiators

- **AI-Powered Prescription Scanner**: Convert handwritten prescriptions into digital records with 95%+ accuracy
- **Voice-First Interface**: Full support for Egyptian Arabic voice commands
- **Offline-First Design**: Works without internet connectivity using IndexedDB and background sync
- **Data Ownership**: Patients control who accesses their health information
- **Multigenerational Design**: Accessible to users of all ages and tech-literacy levels

## ✅ MVP Features Implemented

### 1. Intelligent Prescription Scanner

- Camera-based prescription scanning with image optimization
- OCR processing with medication name, dosage, and instruction extraction
- Manual editing capabilities for OCR results
- Secure image storage with encryption

### 2. Smart Vitals Tracker

- Quick logging of health metrics (blood pressure, glucose, etc.)
- Visual trend analysis with charts and graphs
- Abnormal reading detection and alerts
- Offline data storage with background sync

### 3. Health Report Generator

- PDF report generation with WeasyPrint
- Comprehensive health data visualization
- Doctor-friendly formatting
- Secure sharing options

### 4. Emergency SOS System

- One-tap emergency alerts with location sharing
- Automated messages to emergency contacts
- Medical ID access for first responders
- Alert history and status tracking

### 5. Offline-First Architecture

- Complete offline functionality with IndexedDB
- Intelligent sync with conflict resolution
- Offline queue management and prioritization
- Network status detection and user feedback

## 🚀 Planned Features

### 1. AI Health Insights

- Medication interaction warnings
- Health trend analysis with personalized recommendations
- Nutrition and lifestyle guidance
- Early warning detection for abnormal patterns

### 2. Voice Assistant Integration

- Egyptian Arabic voice command processing
- Voice-guided navigation for visually impaired users
- Voice-based vitals logging and medication reminders
- Natural language processing for health queries

### 3. Community Support Network

- Anonymous condition-specific support groups
- Verified healthcare professional Q&A
- Resource sharing and local healthcare information
- Caregiver coordination tools

## 🔧 Technical Architecture

### System Architecture Overview

```mermaid
graph TD
    A[User Devices] -->|HTTPS| B[Cloud CDN]
    B --> C[Cloud Storage - Frontend]
    B --> D[Cloud Run - Backend]
    D --> E[Cloud SQL - PostgreSQL]
    D --> F[Cloud Vision AI]
    D --> G[Vertex AI - MedGemma]
    D --> H[Twilio API]
    subgraph Frontend_PWA
        I[HTML/CSS/JS]
        J[Service Worker]
        K[IndexedDB]
        L[PWA Manifest]
    end
    subgraph Backend_Django
        M[Django REST Framework]
        N[JWT Authentication]
        O[ViewSets]
        P[Service Layer]
        Q[Serializers]
    end
    I --> J
    I --> K
    I --> L
    M --> N
    M --> O
    O --> P
    O --> Q
```

### Frontend Architecture (Vanilla JavaScript PWA)

```mermaid
graph TD
    A[index.html] --> B[main.js]
    B --> C[api.js]
    B --> D[ui.js]
    B --> E[auth.js]
    B --> F[offline.js]
    C --> G[API Client]
    D --> H[UI Components]
    E --> I[JWT Handler]
    F --> J[IndexedDB]
    F --> K[Service Worker]
    G --> L[Error Handler]
    G --> M[Request Queue]
    J --> N[Offline Data Store]
    K --> O[Cache API]
    K --> P[Background Sync]
    subgraph Core_Modules
        C
        D
        E
        F
    end
    subgraph Feature_Modules
        Q[prescriptions.js]
        R[vitals.js]
        S[reports.js]
        T[emergency.js]
    end
    B --> Q
    B --> R
    B --> S
    B --> T
```

### Backend Architecture (Django REST Framework)

```mermaid
graph TD
    A[URLs/Routes] --> B[ViewSets]
    B --> C[Serializers]
    B --> D[Service Layer]
    D --> E[Models]
    E --> F[PostgreSQL]
    subgraph Authentication_App
        G[UserViewSet]
        H[JWTAuthentication]
        I[Permissions]
    end
    subgraph Prescriptions_App
        J[PrescriptionViewSet]
        K[OCR Service]
        L[File Storage]
    end
    subgraph Vitals_App
        M[VitalsViewSet]
        N[Analytics Service]
    end
    subgraph Reports_App
        O[ReportsViewSet]
        P[PDF Generator]
    end
    subgraph Emergency_App
        Q[EmergencyViewSet]
        R[SMS Service]
    end
    B --> G
    B --> J
    B --> M
    B --> O
    B --> Q
    G --> H
    G --> I
    J --> K
    J --> L
    M --> N
    O --> P
    Q --> R
```

### Data Flow Diagrams

#### 1. Prescription Processing Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant VisionAI
    participant MedGemma
    participant Database
    User->>Frontend: Take photo of prescription
    Frontend->>Frontend: Compress & optimize image
    Frontend->>Backend: Upload image (multipart/form-data)
    Backend->>Backend: Validate file (type, size, security)
    Backend->>VisionAI: Send for OCR processing
    VisionAI-->>Backend: Return extracted text
    Backend->>MedGemma: Extract medication entities
    MedGemma-->>Backend: Return structured medication data
    Backend->>Database: Store prescription & medication data
    Backend-->>Frontend: Return structured medication info
    Frontend->>Frontend: Store in IndexedDB
    Frontend->>User: Display medication list for confirmation
```

#### 2. Offline Synchronization Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant ServiceWorker
    participant SyncManager
    participant Backend
    participant Database
    User->>Frontend: Log vital reading while offline
    Frontend->>Frontend: Store in IndexedDB
    Frontend->>ServiceWorker: Register sync task
    Note over Frontend,ServiceWorker: Device goes online
    ServiceWorker->>SyncManager: Trigger sync event
    SyncManager->>Frontend: Process sync queue
    Frontend->>Backend: Send pending vital readings
    Backend->>Backend: Validate data
    Backend->>Database: Store vital readings
    Backend-->>Frontend: Confirm successful sync
    Frontend->>Frontend: Update sync status in IndexedDB
    Frontend->>User: Show sync confirmation
```

#### 3. Emergency Alert Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant TwilioAPI
    participant EmergencyContacts
    User->>Frontend: Trigger SOS button
    Frontend->>Frontend: Get current location
    Frontend->>Backend: Send emergency alert with location
    Backend->>Backend: Generate emergency report
    Backend->>TwilioAPI: Send SMS alerts
    TwilioAPI->>EmergencyContacts: Deliver SMS with location link
    Backend-->>Frontend: Confirm alert sent
    Frontend->>User: Show alert confirmation
    Backend->>Backend: Log emergency event
```

### Technology Stack Details

#### Frontend (Vanilla JavaScript PWA)

- **Framework**: Vanilla JavaScript (ES6+) with Vite for bundling
- **Styling**: Tailwind CSS with DaisyUI component library
- **PWA Features**:
  - Service Workers for offline caching
  - IndexedDB for structured data storage
  - Background Sync for offline operations
  - Push API for notifications
  - Web App Manifest for installation
- **Architecture**: Modular component-based structure with ES6 modules

#### Backend (Django REST Framework)

- **Framework**: Django 4.2 with Django REST Framework
- **Database**: PostgreSQL with row-level security and encryption
- **Authentication**: JWT + OAuth 2.0 with token refresh
- **Cache**: Redis for session management and rate limiting
- **AI/ML**:
  - Google Cloud Vision API for OCR
  - MedGemma via Vertex AI for medical entity extraction
  - Speech-to-Text API for voice commands
- **File Storage**: Cloud Storage with secure access controls
- **Messaging**: Twilio API for emergency SMS alerts

### Performance Optimization

```mermaid
graph TD
    A[Performance Optimizations] --> B[Frontend]
    A --> C[Backend]
    A --> D[Network]
    B --> B1[Code Splitting]
    B --> B2[Asset Optimization]
    B --> B3[Lazy Loading]
    B --> B4[Virtual Scrolling]
    C --> C1[Query Optimization]
    C --> C2[Caching]
    C --> C3[Async Processing]
    C --> C4[Database Indexing]
    D --> D1[CDN Distribution]
    D --> D2[Compression]
    D --> D3[HTTP/2]
    D --> D4[Resource Hints]
```

### Security Architecture

```mermaid
graph TD
    A[Security Layers] --> B[Authentication]
    A --> C[Authorization]
    A --> D[Data Protection]
    A --> E[Network Security]
    A --> F[Input Validation]
    B --> B1[JWT Tokens]
    B --> B2[OAuth 2.0]
    B --> B3[Rate Limiting]
    C --> C1[Role-Based Access]
    C --> C2[Row-Level Security]
    C --> C3[Permission Classes]
    D --> D1[Encryption at Rest]
    D --> D2[Secure Storage]
    D --> D3[Data Minimization]
    E --> E1[HTTPS]
    E --> E2[CORS]
    E --> E3[CSP Headers]
    F --> F1[Serializer Validation]
    F --> F2[File Upload Scanning]
    F --> F3[Input Sanitization]
```

## 🛠️ Project Structure

```text
your-health-guide/
├── backend/                 # Django REST API
│   ├── health_guide/       # Main Django project
│   │   ├── settings/       # Environment-specific settings
│   │   └── ...
│   ├── apps/               # Django applications
│   │   ├── authentication/ # User auth & JWT
│   │   ├── prescriptions/  # Prescription scanning
│   │   ├── vitals/         # Health metrics tracking
│   │   ├── reports/        # PDF generation
│   │   └── emergency/      # SOS functionality
│   ├── pyproject.toml
│   └── uv.lock
├── frontend/               # PWA frontend
│   ├── public/            # Static HTML files
│   │   ├── index.html     # Landing page
│   │   ├── dashboard.html # Main app interface
│   │   └── manifest.json  # PWA manifest
│   └── src/
│       ├── styles/        # Tailwind CSS
│       └── scripts/       # JavaScript modules
├── docs/                  # Documentation
├── docker-compose.yml     # Local development
├── Dockerfile            # Container configuration
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Python 3.12+
- uv
- Node.js 16+
- PostgreSQL (for production)
- Docker (optional)

### Backend Setup

```bash
# Install dependencies and create virtual environment
uv sync

# Run migrations
uv run python manage.py makemigrations
uv run python manage.py migrate

# Create superuser (optional)
uv run python manage.py createsuperuser

# Run development server
uv run python manage.py runserver
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run development server with Vite
npm run dev

# Or build for production
npm run build
npm run preview
```

### Docker Setup (Alternative)

```bash
# Build and run with Docker Compose
docker-compose up --build

# Access the application
# Frontend: http://localhost:8080
# Backend API: http://localhost:8000
# Admin Panel: http://localhost:8000/admin
```

## 📱 PWA Features

- **Offline Support**: Complete functionality without internet connection
- **Installable**: Add to home screen for app-like experience
- **Responsive**: Works on all device sizes
- **Push Notifications**: Medication reminders and alerts
- **Background Sync**: Data synchronization when connection is restored
- **File Access**: Camera and storage access for prescription scanning
- **Geolocation**: Location sharing for emergency alerts

## 🔒 Security Features

- **Data Encryption**: Sensitive health information encrypted at rest
- **JWT Authentication**: Secure token-based authentication
- **Permission Management**: Fine-grained access control
- **Input Validation**: Comprehensive validation for all user inputs
- **File Upload Security**: Secure file handling and validation
- **CSRF Protection**: Cross-site request forgery prevention
- **Content Security Policy**: Protection against XSS attacks

## 🌐 Deployment Options

### GitHub Docker Deployment

- Automated Docker builds for both backend and frontend
- GitHub Container Registry (GHCR) for image storage
- Integration testing with full application stack
- Release management with tagged Docker images

### Google Cloud Platform

- Cloud Run for containerized backend
- Cloud Storage for static frontend hosting
- Cloud SQL for PostgreSQL database
- Vision AI and Vertex AI for AI/ML features
- Cloud CDN for global content delivery

## 👥 Team

- **Khaled Mahmoud**: Project Lead & Backend Developer & Ai Engineer &software Archticet
- **Gasser Mohammed**: Frontend Developer & Deployment engineer & UX Designer

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Cloud Platform for AI/ML services
- Tailwind CSS and DaisyUI for the beautiful UI
- Django and Django REST Framework for the robust backend
- The open-source community for the amazing tools and libraries

---

Made with ❤️ for the people of Egypt.
