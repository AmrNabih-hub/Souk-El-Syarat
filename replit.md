# Souk El-Sayarat - Arabic Car Marketplace

## Overview

Souk El-Sayarat is a professional Arabic car marketplace platform built as a comprehensive e-commerce solution targeting the Egyptian and Middle Eastern automotive industry. The platform operates as a multi-sided marketplace connecting customers, vendors, and administrators in a unified ecosystem for buying and selling cars, spare parts, and automotive services.

## User Preferences

Preferred communication style: Simple, everyday language.

## Local Development Setup

### Critical Issues Resolved
This project had significant local setup issues that took 6+ hours to resolve. All issues have been fixed and documented.

**Root Causes Identified:**
1. **PostCSS Version Lock**: Hard-pinned to 8.5.6 causing Tailwind CSS conflicts (Fixed: Updated to ^8.4.47)
2. **Vitest Version Mismatch**: v3.2.4 conflicted with @vitest packages at v2.1.8 (Fixed: Synchronized to ^2.1.8)
3. **AWS Amplify Configuration**: App required AWS in development (Fixed: Skip Amplify in dev mode)
4. **Peer Dependency Warnings**: Multiple unmet peer dependencies (Fixed: Added overrides and updated versions)
5. **Missing Documentation**: No clear setup instructions (Fixed: Created LOCAL_DEVELOPMENT_GUIDE.md)

**Quick Local Setup:**
```bash
# Prerequisites: Node.js 20.x.x, npm 10.x.x
cp .env.local.example .env
npm install
npm run dev
# Visit: http://localhost:5000
```

**Documentation:**
- `LOCAL_DEVELOPMENT_GUIDE.md` - Comprehensive setup guide with troubleshooting
- `QUICK_START.md` - Quick 3-minute setup
- `.env.local.example` - Complete environment configuration template

**Success Criteria:**
- ✅ npm install completes in 2-5 minutes (down from 6+ hours)
- ✅ No installation errors or hangs
- ✅ Development server starts in < 10 seconds
- ✅ Homepage loads correctly with styling (no blank pages)
- ✅ Build completes in 25-35 seconds
- ✅ 100% reproducible setup process

## Replit Environment Setup

### Development Configuration
- **Frontend Server**: Runs on port 5000 using Vite dev server
- **Host Configuration**: 0.0.0.0 with allowedHosts: true (required for Replit proxy)
- **Development Mode**: Uses mock services for auth simulation (no AWS Amplify required for development)
- **Environment**: Node.js 20 with all dependencies installed via npm
- **Environment Variables**: Uses .env.development for development settings
- **TypeScript**: Configured with strict mode and proper type definitions
- **Real-time System**: WebSocket service available but disabled by default (set VITE_ENABLE_REAL_TIME=true to enable)

### Environment Variables Reference
```bash
# Core Development
VITE_APP_NAME=سوق السيارات
VITE_APP_ENV=development

# Real-time Features (WebSocket)
VITE_ENABLE_REAL_TIME=false  # Set to 'true' to enable real-time notifications

# Mock Data Toggles
VITE_USE_MOCK_AUTH=true
VITE_USE_MOCK_PRODUCTS=true
VITE_USE_MOCK_ORDERS=true

# AWS Amplify (Production Only)
VITE_AWS_REGION=us-east-1
VITE_AWS_USER_POOL_ID=<your-pool-id>
VITE_AWS_USER_POOL_WEB_CLIENT_ID=<your-client-id>
```

**Important Notes:**
- Real-time WebSocket requires `VITE_ENABLE_REAL_TIME=true` for bidirectional notifications
- Development mode works without AWS Amplify (mock auth enabled by default)
- Production deployment requires proper AWS Amplify configuration

### Deployment Configuration  
- **Deployment Target**: Autoscale (stateless web application)
- **Build Command**: npm run build:production
- **Run Command**: npx vite preview --host 0.0.0.0 --port 5000
- **Port**: 5000 (both development and production)
- **Production Environment**: Can be configured with AWS Amplify credentials for production deployment

### Recent Setup (October 2025)
- ✅ Dependencies installed successfully (1334 packages)
- ✅ TypeScript environment definitions updated with AWS variable types
- ✅ Vite configuration verified (port 5000, host 0.0.0.0, allowedHosts: true)
- ✅ Development workflow configured and running
- ✅ Deployment configuration set for autoscale deployment
- ✅ Application verified working with Arabic RTL layout

### Recent Enhancements (October 1, 2025)
#### Real-time Infrastructure (Architect Approved ✅)
- ✅ WebSocket-based real-time service with bidirectional communication
- ✅ RealtimeContext with proper lifecycle management and memory leak prevention
- ✅ Type-safe subscription API with automatic cleanup on unmount
- ✅ Event constants (REALTIME_EVENTS) to prevent typos and ensure consistency
- ✅ Feature flag controlled (VITE_ENABLE_REAL_TIME) - currently disabled by default
- 📍 Files: `src/contexts/RealtimeContext.tsx`, `src/services/realtime-websocket.service.ts`, `src/constants/realtime-events.ts`

#### Navbar UI Improvements (Architect Approved ✅)
- ✅ Full-width responsive navbar (removed max-w-7xl constraint)
- ✅ Customer-only "بيع عربيتك" (Sell Your Car) button with gradient hover effects
- ✅ Smaller, more compact search bar (max-w-xs)
- ✅ Gradient hover effects on navigation buttons with backlight shadows
- ✅ Removed active underlines for cleaner aesthetic
- 📍 Files: `src/components/layout/Navbar.tsx`

#### Customer "Sell Your Car" Feature (Architect Approved ✅)
- ✅ Protected route `/sell-your-car` with customer-only access control
- ✅ Comprehensive form validation (minimum 6 images, complete specs, location data)
- ✅ Integration with existing UsedCarSellingPage component
- ✅ Role-based routing guard preventing non-customer access
- 📍 Files: `src/App.tsx`, `src/pages/customer/UsedCarSellingPage.tsx`

#### Vendor Application Real-time Workflow (Architect Approved ✅)
- ✅ Real-time notifications for new vendor applications (vendor → admin)
- ✅ Real-time approval notifications (admin → vendor)
- ✅ Real-time rejection notifications (admin → vendor)
- ✅ Email notifications via ReplitMail for all workflow events
- ✅ Event-driven architecture with centralized event constants
- 📍 Files: `src/services/vendor-application.service.ts`

#### Remaining Work (Pending Implementation)
- 🔲 Used car listing workflow with admin approval (similar to vendor workflow)
- 🔲 Replace mock data with live queries in dashboards and user profiles
- 🔲 Environment/config hardening for local, Replit, and production deployments
- 🔲 Professional QA documentation for AI agents to prevent environment errors

## System Architecture

### Frontend Architecture
The application is built with React 18.3.1 and TypeScript using Vite as the build tool. The UI framework leverages Tailwind CSS for styling with dark mode support and professional Egyptian-themed color schemes. The frontend follows a component-based architecture with:

- **Component Structure**: Modular components organized by feature areas (pages, components, hooks)
- **State Management**: Zustand for client-side state with React Query for server state management
- **Routing**: React Router DOM v7 with lazy loading and role-based route protection
- **UI Components**: Headless UI and Heroicons for accessibility-compliant interface elements
- **Animations**: Framer Motion for smooth transitions and interactive effects
- **Form Handling**: React Hook Form with Yup validation for robust form management

### Backend Architecture
The backend is powered by Firebase services providing a serverless, scalable infrastructure:

- **Authentication**: Firebase Auth with multi-role support (customer, vendor, admin) and OAuth integration
- **Database**: Firestore for document storage with real-time synchronization capabilities
- **Cloud Functions**: 8+ deployed functions handling business logic including vendor applications, order processing, and analytics
- **Storage**: Firebase Storage for media files and document management
- **Hosting**: Firebase Hosting with CDN for optimized content delivery

### Data Architecture
The system uses a NoSQL document-based approach with Firestore, implementing:

- **Real-time Updates**: Live synchronization across all connected clients
- **Role-based Security**: Comprehensive security rules protecting data access by user roles
- **Document Relationships**: Structured collections for users, products, orders, and vendor applications
- **Analytics Integration**: Built-in analytics for business intelligence and performance monitoring

### Authentication and Authorization
Multi-layered security system implementing:

- **Enhanced Auth Service**: Custom authentication wrapper extending Firebase Auth
- **Role-based Access Control**: Three distinct user roles with specific permissions
- **Real-time Auth State**: Live authentication state synchronization across components
- **Session Management**: Secure session handling with automatic renewal

### Development and Testing Infrastructure
Professional development setup with comprehensive testing and quality assurance:

- **Testing Framework**: Vitest for unit/integration testing, Playwright for E2E testing
- **Code Quality**: ESLint with security plugins, Prettier for formatting, TypeScript strict mode
- **CI/CD Pipeline**: GitHub Actions with automated deployment and quality gates
- **Performance Monitoring**: Lighthouse CI integration and bundle size analysis

## External Dependencies

### Core Firebase Services
- **Firebase SDK v10+**: Authentication, Firestore, Cloud Functions, Storage, Hosting
- **Firebase Analytics**: User behavior tracking and performance monitoring
- **Firebase Security Rules**: Database and storage access control

### AWS Integration
- **AWS Amplify v6**: Supplementary backend services and enhanced API capabilities
- **AWS SDK**: Additional cloud service integrations

### Development and Build Tools
- **Vite**: Modern build tool with hot module replacement and optimized production builds
- **TypeScript**: Static type checking with strict mode configuration
- **Tailwind CSS**: Utility-first CSS framework with custom Egyptian theme extensions
- **PostCSS**: CSS processing with autoprefixer and optimization plugins

### UI and User Experience
- **Framer Motion**: Animation library for smooth transitions and interactive elements
- **Headless UI**: Unstyled, accessible UI components
- **Heroicons & Lucide React**: Professional icon libraries
- **React Hook Form**: Performant form library with validation

### Quality Assurance and Testing
- **Vitest**: Modern testing framework replacing Jest
- **Playwright**: Cross-browser end-to-end testing
- **Testing Library**: React component testing utilities
- **ESLint**: Code linting with security and best practices rules
- **Prettier**: Code formatting and consistency

### Monitoring and Analytics
- **Firebase Performance**: Real-time performance monitoring
- **Lighthouse CI**: Automated performance auditing
- **Bundle Analyzer**: Build size optimization and analysis tools