# Souk El-Syarat - سوق السيارات

![Egyptian Flag](https://img.shields.io/badge/Made_in-Egypt_🇪🇬-red.svg) ![React](https://img.shields.io/badge/React-18.3.1-blue.svg) ![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-blue.svg) ![AWS Amplify](https://img.shields.io/badge/AWS_Amplify-6.6.3-orange.svg) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.17-blue.svg)

## 🚗 Project Overview

**Souk El-Syarat** is a modern, professional e-commerce marketplace platform specifically designed for the Egyptian automotive market. The platform enables users to buy and sell cars, automotive parts, and services from trusted vendors across Egypt.

### ✨ Key Features

- **🔐 Multi-Role Authentication:** Customer, Vendor, and Admin roles with AWS Cognito
- **🏪 Vendor Management:** Complete application system with admin approval workflow  
- **🚗 Automotive Focus:** Specialized for cars, parts, and services
- **🇪🇬 Egyptian Market:** Localized for Egyptian customers with Arabic support
- **🎨 Modern UI/UX:** Responsive design with Egyptian-themed styling
- **☁️ AWS Amplify Integration:** Authentication, DataStore, AppSync GraphQL API
- **✨ Advanced Animations:** Framer Motion powered interactions
- **🌐 Bilingual Support:** Arabic (RTL) and English (LTR) support
- **⚡ Real-time Updates:** WebSocket and AWS AppSync subscriptions

## 🏗️ Architecture

### Frontend Stack
- **React 18.3.1** with TypeScript for type safety
- **Vite 6.0** for fast development and optimized builds
- **Tailwind CSS 3.4** with custom Egyptian-themed design system
- **Framer Motion** for smooth animations and interactions
- **React Router v7** for client-side routing
- **Zustand** for state management
- **React Hook Form** with Yup validation
- **React Query** for server state management

### Backend Services (AWS Amplify)
- **AWS Cognito** for authentication and user management
- **AWS AppSync** for GraphQL API with real-time subscriptions
- **AWS Amplify DataStore** for offline-first data synchronization
- **Amazon S3** for file storage (images, documents)
- **AWS Lambda** for serverless business logic
- **Amazon CloudFront** for CDN and global content delivery

### Development Tools
- **ESLint + Prettier** for code quality
- **Vitest** for unit testing
- **Playwright** for end-to-end testing
- **TypeScript** strict mode for type safety
- **Hot Module Replacement** for fast development

## ⚡ Quick Start

### Prerequisites
- **Node.js 20.x** (LTS) and npm 10.x
- **Git**
- **AWS Account** (for production deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AmrNabih-hub/Souk-El-Syarat.git
   cd Souk-El-Syarat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env
   ```

   For local development, the default `.env` file works out of the box with mock services.

4. **Start development server**
   ```bash
   npm run dev
   ```

   Visit: `http://localhost:5000`

### Production AWS Configuration

For production deployment, update `.env.production` with your AWS Amplify configuration:

```env
# AWS Amplify Configuration
VITE_AWS_REGION=us-east-1
VITE_AWS_USER_POOLS_ID=your-cognito-user-pool-id
VITE_AWS_USER_POOLS_WEB_CLIENT_ID=your-cognito-client-id
VITE_AWS_COGNITO_IDENTITY_POOL_ID=your-identity-pool-id
VITE_AWS_APPSYNC_GRAPHQL_ENDPOINT=your-appsync-endpoint

# Application Configuration
VITE_APP_NAME="Souk El-Syarat Marketplace"
VITE_CURRENCY=EGP
VITE_DEFAULT_LANGUAGE=ar
```

## 👥 User Roles & Permissions

### 🛒 Customer
- Browse and search products
- View vendor profiles and reviews
- Add products to cart and favorites
- Place orders and track status in real-time
- Write product/vendor reviews
- Manage profile and preferences

### 🏪 Vendor
- Apply to become a verified vendor through comprehensive wizard
- Manage product listings (CRUD operations)
- View real-time sales analytics and orders
- Respond to customer reviews
- Upload product images and documents
- Access vendor dashboard with business insights
- Receive real-time order notifications

### ⚙️ Admin
- Review and approve/reject vendor applications
- Moderate products and reviews
- View platform analytics and metrics
- Manage users and vendors
- System configuration and monitoring
- Content moderation tools
- Access to secure admin dashboard

### 🔐 Admin Account

**Production Admin Credentials:**
- **Email:** `admin@soukel-syarat.com`
- **Password:** `SoukAdmin2024!@#`
- **Role:** Administrator (full platform access)

*Note: Change these credentials in production by updating `src/services/admin-auth.service.ts`*

## 🎨 Design System

### Color Palette (Egyptian Theme)
- **Primary Gold**: `#f59e0b` - Inspired by Egyptian golden heritage
- **Secondary Blue**: `#0ea5e9` - Representing the Nile River
- **Accent Red**: `#ef4444` - For important actions and alerts
- **Success Green**: `#22c55e` - For confirmations and success states
- **Neutral Grays**: Modern neutral palette for UI elements

### Typography
- **Arabic**: Cairo font family for Arabic text
- **English**: Inter for English text
- **Display**: Poppins for headers and branding

### Animations
- Custom Egyptian-themed animations (pyramid patterns, gold shimmer)
- Smooth page transitions with Framer Motion
- Hover effects and micro-interactions
- Loading states with cultural elements

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build:production
npm run preview
```

### Deploy to Replit (Autoscale)
The project is pre-configured for Replit deployment with autoscale:
- Build: `npm run build:production`
- Run: `npx vite preview --host 0.0.0.0 --port 5000`

### Deploy to AWS Amplify Hosting

1. **Install Amplify CLI**
   ```bash
   npm install -g @aws-amplify/cli
   ```

2. **Configure Amplify**
   ```bash
   amplify configure
   ```

3. **Initialize Amplify in project**
   ```bash
   amplify init
   ```

4. **Add hosting**
   ```bash
   amplify add hosting
   ```

5. **Deploy**
   ```bash
   npm run build:production
   amplify publish
   ```

## 📁 Project Structure

```
souk-el-syarat/
├── src/
│   ├── components/                    # Reusable UI components
│   │   ├── ui/                        # Basic UI components
│   │   ├── layout/                    # Layout components
│   │   ├── forms/                     # Form components
│   │   ├── auth/                      # Authentication components
│   │   └── dashboard/                 # Dashboard components
│   ├── pages/                         # Page components
│   │   ├── auth/                      # Authentication pages
│   │   ├── admin/                     # Admin pages
│   │   ├── vendor/                    # Vendor pages
│   │   └── customer/                  # Customer pages
│   ├── services/                      # API and AWS Amplify services
│   │   ├── auth.service.ts            # Authentication service
│   │   ├── admin.service.ts           # Admin operations
│   │   ├── vendor.service.ts          # Vendor operations
│   │   └── realtime-websocket.service.ts  # WebSocket service
│   ├── stores/                        # Zustand state stores
│   ├── hooks/                         # Custom React hooks
│   ├── utils/                         # Utility functions
│   ├── types/                         # TypeScript type definitions
│   └── assets/                        # Static assets
├── public/                            # Public assets
├── docs/                              # Documentation
│   ├── LOCAL_DEVELOPMENT_GUIDE.md     # Comprehensive setup guide
│   ├── QUICK_START.md                 # Quick 3-minute setup
│   └── AI_AGENT_CHECKLIST.md          # AI assistant guidelines
└── .env.local.example                 # Environment template
```

## 🔒 Security Features

- **Role-based access control** with AWS Cognito and AppSync
- **Input validation** on both client and server side
- **Secure file uploads** with S3 pre-signed URLs
- **Authentication required** for all user actions
- **Admin approval** for vendor applications
- **Content moderation** systems
- **HTTPS enforcement** in production
- **API rate limiting** via AWS AppSync

## 🌍 Internationalization (i18n)

- **RTL/LTR Support**: Full support for Arabic (RTL) and English (LTR)
- **Dynamic Direction**: Automatic text direction based on selected language
- **Cultural Adaptation**: Egyptian cultural elements and preferences
- **Currency Support**: Egyptian Pound (EGP) and US Dollar (USD)

## ⚡ Performance Optimizations

- **Code Splitting**: Lazy loading of route components
- **Image Optimization**: WebP format with fallbacks
- **Caching Strategy**: Aggressive caching for static assets via CloudFront
- **Bundle Optimization**: Tree shaking and minification with Terser
- **Database Optimization**: Efficient GraphQL queries with DataStore
- **Real-time Updates**: AWS AppSync subscriptions for live data
- **Offline Support**: Amplify DataStore for offline-first architecture

## 📊 Real-Time Features

- **Live Order Updates**: WebSocket integration for instant notifications
- **Real-time Analytics**: Dashboard updates via AppSync subscriptions
- **Instant Messaging**: Vendor-customer communication
- **Live Inventory**: Stock updates across all clients
- **Notification System**: Push notifications for critical events

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use semantic commit messages
- Write tests for new features
- Ensure responsive design
- Maintain accessibility standards
- Follow the established design system
- Document AWS Amplify schema changes

## 🗺️ Roadmap

### Phase 1: Foundation ✅
- [x] Project setup and architecture
- [x] Authentication system with multiple roles
- [x] AWS Amplify integration
- [x] Responsive UI with Egyptian theme
- [x] Advanced routing and navigation

### Phase 2: Core Features ✅
- [x] Vendor application system with wizard
- [x] Product management (CRUD)
- [x] Admin dashboard with real-time analytics
- [x] Vendor dashboard with live updates
- [x] Customer marketplace interface

### Phase 3: Advanced Features 🚧
- [ ] Advanced search and filtering system
- [ ] Order management and tracking
- [ ] Review and rating system
- [ ] Payment integration (Stripe/PayPal)
- [ ] Push notification system
- [ ] Chat system for buyer-seller communication

### Phase 4: Optimization 📋
- [ ] Performance optimization
- [ ] SEO optimization
- [ ] Progressive Web App (PWA) features
- [ ] Advanced analytics dashboard
- [ ] Comprehensive automated testing suite

## 📚 Documentation

- **[LOCAL_DEVELOPMENT_GUIDE.md](./LOCAL_DEVELOPMENT_GUIDE.md)**: Comprehensive setup guide with troubleshooting
- **[QUICK_START.md](./QUICK_START.md)**: Quick 3-minute setup guide
- **[AI_AGENT_CHECKLIST.md](./AI_AGENT_CHECKLIST.md)**: Guidelines for AI assistants
- **[CHANGES_SUMMARY.md](./CHANGES_SUMMARY.md)**: Recent changes and improvements

## 📞 Support & Contact

- **GitHub Issues**: For bug reports and feature requests
- **Documentation**: Comprehensive guides in `/docs` folder
- **Email**: Contact through GitHub profile

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Egyptian Heritage**: Inspired by Egypt's rich cultural heritage
- **Open Source Community**: Built with amazing open-source tools
- **AWS Amplify Team**: For providing excellent cloud infrastructure
- **React Community**: For the robust frontend ecosystem
- **Tailwind CSS**: For the utility-first styling approach

---

<div align="center">
    <strong>Built with ❤️ for Egypt's Automotive Community</strong>
    <br>
    <sub>سوق السيارات - أكبر منصة للتجارة الإلكترونية للسيارات في مصر</sub>
</div>
