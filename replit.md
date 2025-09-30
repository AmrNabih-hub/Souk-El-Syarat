# Souk El-Sayarat - Arabic Car Marketplace

## Overview

Souk El-Sayarat is a professional Arabic car marketplace platform built as a comprehensive e-commerce solution targeting the Egyptian and Middle Eastern automotive industry. The platform operates as a multi-sided marketplace connecting customers, vendors, and administrators in a unified ecosystem for buying and selling cars, spare parts, and automotive services.

## User Preferences

Preferred communication style: Simple, everyday language.

## Replit Environment Setup

### Development Configuration
- **Frontend Server**: Runs on port 5000 using Vite dev server
- **Host Configuration**: 0.0.0.0 with allowedHosts: true (required for Replit proxy)
- **Development Mode**: Uses localStorage for auth simulation (no Firebase required for development)
- **Environment**: Node.js 20 with all dependencies installed via npm

### Deployment Configuration
- **Deployment Target**: Autoscale (stateless web application)
- **Build Command**: npm run build:production
- **Run Command**: npm run preview (Vite preview server on port 5000)
- **Port**: 5000 (both development and production)

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