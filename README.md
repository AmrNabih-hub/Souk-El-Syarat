# Firebase CI/CD Setup for GitHub Actions

## 🚀 Required GitHub Repository Secrets

To enable automatic deployment, you need to configure the following secrets in your GitHub repository settings:

### Method 1: Firebase Token Authentication (Recommended for personal projects)

1. **Get Firebase Token:**
   ```bash
   # Install Firebase CLI globally
   npm install -g firebase-tools
   
   # Login to your Firebase account
   firebase login
   
   # Generate CI token
   firebase login:ci
   ```
   
2. **Add to GitHub Secrets:**
   - Go to your repository on GitHub
   - Navigate to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Add these secrets:

   | Secret Name | Value | Description |
   |------------|--------|------------|
   | `FIREBASE_TOKEN` | Your Firebase CI token | Token from `firebase login:ci` command |
   | `FIREBASE_PROJECT_ID` | your-project-id | Your Firebase project ID (without -staging suffix) |

### Method 2: Service Account Authentication (Recommended for production)

1. **Create Service Account:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Select your Firebase project
   - Navigate to "IAM & Admin" → "Service Accounts"
   - Click "Create Service Account"
   - Give it a name like "GitHub Actions Deploy"
   - Grant these roles:
     - Firebase Hosting Admin
     - Cloud Functions Admin (if using functions)
     - Project Viewer

2. **Generate Key:**
   - Click on the created service account
   - Go to "Keys" tab
   - Click "Add Key" → "Create new key"
   - Choose JSON format
   - Download the key file

3. **Add to GitHub Secrets:**
   | Secret Name | Value | Description |
   |------------|--------|------------|
   | `GOOGLE_APPLICATION_CREDENTIALS_JSON` | Full JSON content of the service account key | Copy the entire JSON file content |
   | `FIREBASE_PROJECT_ID` | your-project-id | Your Firebase project ID |

## 🔧 Firebase Project Setup

### 1. Create Firebase Projects

You'll need separate Firebase projects for staging and production:

- **Production:** `your-project-id`
- **Staging:** `your-project-id-staging`

### 2. Configure Firebase Hosting

For each project:
1. Go to Firebase Console → Hosting
2. Get started with Firebase Hosting
3. Deploy once manually to initialize:
   ```bash
   firebase use --add your-project-id
   firebase deploy --only hosting
   ```

### 3. Set Up Firebase Functions (Optional)

If you're using Firebase Functions:
1. Enable Cloud Functions in Firebase Console
2. Ensure your service account has "Cloud Functions Admin" role
3. Functions will be deployed automatically with hosting

## 🚦 Deployment Workflow

The CI/CD pipeline will:

1. **On push to `develop` branch:** Deploy to staging environment
2. **On push to `main` branch:** Deploy to production environment
3. **Manual deployment:** Use workflow dispatch to deploy to specific environment

## 🛠️ Troubleshooting

### Common Issues:

1. **"FIREBASE_TOKEN or GCP_SA_KEY required" error:**
   - Ensure you've set either `FIREBASE_TOKEN` or `GOOGLE_APPLICATION_CREDENTIALS_JSON` in GitHub secrets
   - Check that secret names are exact matches (case-sensitive)

2. **"Project not found" error:**
   - Verify `FIREBASE_PROJECT_ID` is correct
   - Ensure Firebase projects exist for both production and staging

3. **Permission denied errors:**
   - Check service account roles
   - Ensure Firebase CLI token has proper permissions

4. **Build artifacts not found:**
   - The workflow automatically handles build artifact extraction
   - Check build job completed successfully

### Debug Mode:

To enable debug logging in the workflow, the deployment steps include detailed logging that shows:
- Available files after artifact download
- Firebase CLI version
- Authentication method being used
- Deployment progress

## 📁 Project Structure Requirements

Ensure your project has:
```
your-repo/
├── firebase.json          # Firebase configuration
├── dist/                  # Built files (auto-generated)
├── functions/            # Firebase Functions (optional)
│   ├── package.json
│   └── index.js
├── firestore.rules       # Firestore security rules
└── storage.rules         # Storage security rules
```

The `firebase.json` should point to `dist/` as the public directory:
```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{"source": "**", "destination": "/index.html"}]
  }
}
```

## 🔐 Security Best Practices

1. **Use Service Accounts for production environments**
2. **Regularly rotate Firebase tokens**
3. **Set up separate staging and production projects**
4. **Review Firebase security rules regularly**
5. **Monitor deployment logs for security issues**

---

# Souk El-Syarat - سوق السيارات

![Egyptian Flag](https://img.shields.io/badge/Made_in-Egypt_🇪🇬-red.svg) ![React](https://img.shields.io/badge/React-18.2.0-blue.svg) ![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-blue.svg) ![Firebase](https://img.shields.io/badge/Firebase-10.7.1-orange.svg) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.3.6-blue.svg)

## 🚗 Project Overview

**Souk El-Syarat** is a modern, professional e-commerce marketplace platform specifically designed for the Egyptian automotive market. The platform enables users to buy and sell cars, automotive parts, and services from trusted vendors across Egypt.

### ✨ Key Features

- **🔐 Multi-Role Authentication:** Customer, Vendor, and Admin roles with Firebase Auth
- **🏪 Vendor Management:** Application system with admin approval workflow  
- **🚗 Automotive Focus:** Specialized for cars, parts, and services
- **🇪🇬 Egyptian Market:** Localized for Egyptian customers with Arabic support
- **🎨 Modern UI/UX:** Responsive design with Egyptian-themed styling
- **🔥 Firebase Integration:** Authentication, Firestore database, and Cloud Storage
- **✨ Advanced Animations:** Framer Motion powered interactions
- **🌐 Bilingual Support:** Arabic (RTL) and English (LTR) support

## 🏗️ Architecture

### Frontend Stack
- **React 18.2** with TypeScript for type safety
- **Vite** for fast development and optimized builds
- **Tailwind CSS** with custom Egyptian-themed design system
- **Framer Motion** for smooth animations and interactions
- **React Router** for client-side routing
- **Zustand** for state management
- **React Hook Form** with Yup validation
- **React Query** for server state management

### Backend Services (Firebase)
- **Firebase Authentication** for user management
- **Cloud Firestore** for database with role-based security rules
- **Cloud Storage** for file uploads (images, documents)
- **Firebase Hosting** for deployment
- **Firebase Functions** (planned for advanced features)

### Development Tools
- **ESLint + Prettier** for code quality
- **Vitest** for unit testing
- **TypeScript** for type safety
- **Hot Module Replacement** for fast development

## ⚡ Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Firebase CLI (for deployment)
- Git

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
   cp .env.example .env
   ```

   Fill in your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your-api-key-here
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abc123
   VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 🔥 Firebase Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project named `souk-el-syarat`
3. Enable Authentication, Firestore, and Storage

### 2. Configure Authentication
1. Enable Email/Password and Google sign-in methods
2. Add your domain to authorized domains

### 3. Deploy Security Rules
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in project
firebase init

# Deploy Firestore and Storage rules
firebase deploy --only firestore:rules,storage
```

### 4. Local Development with Emulators
```bash
# Start Firebase emulators
firebase emulators:start

# In another terminal, start the app
npm run dev
```

## 👥 User Roles & Permissions

### 🛒 Customer
- Browse and search products
- View vendor profiles and reviews
- Add products to cart and favorites
- Place orders and track status
- Write product/vendor reviews
- Manage profile and preferences

### 🏪 Vendor
- Apply to become a verified vendor
- Manage product listings (CRUD)
- View sales analytics and orders
- Respond to customer reviews
- Upload product images and documents
- Dashboard with business insights

### ⚙️ Admin
- Approve/reject vendor applications
- Moderate products and reviews
- View platform analytics
- Manage users and vendors
- System configuration
- Content moderation tools

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
```

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

### Firebase Deployment
```bash
# Build and deploy
npm run build
firebase deploy
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
│   ├── services/                      # API and Firebase services
│   ├── stores/                        # Zustand state stores
│   ├── hooks/                         # Custom React hooks
│   ├── utils/                         # Utility functions
│   ├── types/                         # TypeScript type definitions
│   └── assets/                        # Static assets
├── public/                            # Public assets
├── firebase/                          # Firebase configuration files
│   ├── firestore.rules                # Firestore security rules
│   ├── storage.rules                  # Storage security rules
│   └── firestore.indexes.json         # Firestore indexes
└── docs/                              # Documentation
```

## 🔒 Security Features

- **Role-based access control** with Firebase security rules
- **Input validation** on both client and server side
- **Secure file uploads** with type and size restrictions
- **Authentication required** for all user actions
- **Admin approval** for vendor applications
- **Content moderation** systems

## 🌍 Internationalization (i18n)

- **RTL/LTR Support**: Full support for Arabic (RTL) and English (LTR)
- **Dynamic Direction**: Automatic text direction based on selected language
- **Cultural Adaptation**: Egyptian cultural elements and preferences
- **Currency Support**: Egyptian Pound (EGP) and US Dollar (USD)

## ⚡ Performance Optimizations

- **Code Splitting**: Lazy loading of route components
- **Image Optimization**: WebP format with fallbacks
- **Caching Strategy**: Aggressive caching for static assets
- **Bundle Optimization**: Tree shaking and minification
- **Database Indexing**: Optimized Firestore queries

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

## 🗺️ Roadmap

### Phase 1: Foundation ✅
- [x] Project setup and architecture
- [x] Authentication system with multiple roles
- [x] Firebase integration and security rules
- [x] Responsive UI with Egyptian theme
- [x] Basic routing and navigation

### Phase 2: Core Features 🚧
- [ ] Vendor application system
- [ ] Product management (CRUD)
- [ ] Admin dashboard with analytics
- [ ] Vendor dashboard
- [ ] Customer marketplace interface

### Phase 3: Advanced Features 📋
- [ ] Search and filtering system
- [ ] Order management and tracking
- [ ] Review and rating system
- [ ] Payment integration
- [ ] Notification system
- [ ] Chat system for buyer-seller communication

### Phase 4: Optimization 🔧
- [ ] Performance optimization
- [ ] SEO optimization
- [ ] Progressive Web App (PWA) features
- [ ] Advanced analytics
- [ ] Automated testing suite

## 📞 Support & Contact

- **GitHub Issues**: For bug reports and feature requests
- **Email**: Contact through GitHub profile

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Egyptian Heritage**: Inspired by Egypt's rich cultural heritage
- **Open Source Community**: Built with amazing open-source tools
- **Firebase Team**: For providing excellent backend services
- **React Community**: For the robust frontend ecosystem
- **Tailwind CSS**: For the utility-first styling approach

---

<div align="center">
    <strong>Built with ❤️ for Egypt's Automotive Community</strong>
    <br>
    <sub>سوق السيارات - أكبر منصة للتجارة الإلكترونية للسيارات في مصر</sub>
</div>🚀 Firebase deployment test
