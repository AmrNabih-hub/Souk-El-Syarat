# Souk El-Syarat - Car Marketplace

## Overview
Professional Arabic car marketplace platform built with React, TypeScript, and AWS Amplify. Targeting the Egyptian and Middle Eastern automotive market.

## Key Features
- **Multi-Role System**: Customer, Vendor, and Admin roles
- **Arabic/English Support**: Full RTL/LTR language support
- **Real-time Features**: Live chat, notifications, and updates
- **Secure Authentication**: AWS Amplify Auth with role-based access
- **Modern UI/UX**: Egyptian-themed design with Tailwind CSS
- **Mobile Responsive**: Optimized for all device sizes

## Tech Stack
- **Frontend**: React 18.3, TypeScript, Vite, Tailwind CSS
- **Backend**: AWS Amplify, GraphQL, Lambda Functions
- **Database**: DynamoDB via DataStore
- **Authentication**: AWS Cognito
- **Storage**: AWS S3
- **Deployment**: Replit (Development), AWS Amplify (Production)

## Project Structure
```
src/
├── components/          # Reusable UI components
├── pages/              # Application pages
├── services/           # API and business logic
├── stores/             # State management (Zustand)
├── hooks/              # Custom React hooks
├── types/              # TypeScript definitions
├── utils/              # Helper functions
└── styles/             # Global styles
```

## Getting Started
1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Build for production: `npm run build`
4. Run tests: `npm test`

## Environment Setup
- Node.js 18+ required
- AWS Amplify CLI for backend operations
- Environment variables configured in `.env`

## User Roles
- **Customer**: Browse, purchase, and manage orders
- **Vendor**: Sell products and manage inventory
- **Admin**: Platform management and analytics

## Current Status
✅ Core functionality implemented
✅ Authentication system complete
✅ UI/UX polished and responsive
🔄 Production deployment configured