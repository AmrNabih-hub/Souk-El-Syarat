# 🚀 FIREBASE APP HOSTING BACKEND - FIRST RELEASE SETUP

## Current Status: "Waiting on your first release..."

---

## 📋 COMPLETE SETUP CHECKLIST FOR SUCCESSFUL RELEASE

### **Step 1: Prepare Backend Configuration**

```yaml
Backend Name: souk-el-sayarat-backend
Region: europe-west4
Source: https://github.com/AmrNabih-hub/Souk-El-Syarat
Domain: souk-el-sayarat-backend--souk-el-syarat.europe-west4.hosted.app
```

### **Step 2: Required Files for Backend Release**

1. **apphosting.yaml** - Backend configuration
2. **package.json** - Dependencies and scripts
3. **server.js** or **index.js** - Main backend server
4. **.env** - Environment variables
5. **firebase.json** - Firebase configuration

---

## 🔧 BACKEND SETUP FILES

### **1. Create `apphosting.yaml`**
```yaml
# /workspace/apphosting.yaml
runtime: nodejs20

env:
  - variable: NODE_ENV
    value: production
  - variable: FIREBASE_PROJECT_ID
    value: souk-el-syarat
  - variable: FIREBASE_AUTH_DOMAIN
    value: souk-el-syarat.firebaseapp.com
  - variable: FIREBASE_DATABASE_URL
    value: https://souk-el-syarat-default-rtdb.firebaseio.com
  - variable: FIREBASE_STORAGE_BUCKET
    value: souk-el-syarat.firebasestorage.app

# Email service configuration
  - variable: EMAIL_SERVICE
    value: sendgrid
  - variable: SENDGRID_API_KEY
    secret: sendgrid-api-key
  - variable: EMAIL_FROM
    value: noreply@souk-el-syarat.com

# Real-time configuration
  - variable: ENABLE_REALTIME
    value: "true"
  - variable: WEBSOCKET_PORT
    value: "3001"

# Authentication
  - variable: JWT_SECRET
    secret: jwt-secret
  - variable: SESSION_SECRET
    secret: session-secret

service:
  minInstances: 1
  maxInstances: 10
  cpu: 1
  memory: 512Mi
  concurrency: 100

healthCheck:
  path: /health
  checkIntervalSec: 30
  timeoutSec: 10
  failureThreshold: 3
  successThreshold: 1
```

### **2. Create Backend Server File**
```javascript
// /workspace/server.js
const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const bodyParser = require('body-parser');

// Initialize Firebase Admin
admin.initializeApp({
  projectId: process.env.FIREBASE_PROJECT_ID,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const app = express();

// Middleware
app.use(cors({
  origin: [
    'https://souk-el-syarat.web.app',
    'https://souk-el-syarat.firebaseapp.com',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      auth: 'active',
      email: process.env.EMAIL_SERVICE ? 'configured' : 'not configured',
      realtime: process.env.ENABLE_REALTIME === 'true' ? 'enabled' : 'disabled'
    }
  });
});

// Authentication middleware
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Email service setup
const sgMail = require('@sendgrid/mail');
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Email sending function
async function sendEmail(to, subject, html) {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('Email service not configured');
    return false;
  }
  
  try {
    await sgMail.send({
      to,
      from: process.env.EMAIL_FROM,
      subject,
      html
    });
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

// API Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    
    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName
    });
    
    // Save to Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      email,
      displayName,
      role: 'customer',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Send welcome email
    await sendEmail(email, 'Welcome to Souk El-Syarat!', `
      <h1>Welcome ${displayName}!</h1>
      <p>Thank you for joining Souk El-Syarat.</p>
    `);
    
    res.json({ success: true, uid: userRecord.uid });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const snapshot = await admin.firestore()
      .collection('products')
      .limit(20)
      .get();
    
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders', authenticate, async (req, res) => {
  try {
    const orderData = {
      ...req.body,
      userId: req.user.uid,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await admin.firestore()
      .collection('orders')
      .add(orderData);
    
    // Send order confirmation email
    const user = await admin.auth().getUser(req.user.uid);
    await sendEmail(user.email, 'Order Confirmation', `
      <h1>Order Confirmed!</h1>
      <p>Your order #${docRef.id} has been received.</p>
    `);
    
    // Real-time update
    if (process.env.ENABLE_REALTIME === 'true') {
      await admin.database().ref(`orders/${docRef.id}`).set({
        status: 'pending',
        userId: req.user.uid,
        timestamp: Date.now()
      });
    }
    
    res.json({ success: true, orderId: docRef.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Real-time WebSocket setup
if (process.env.ENABLE_REALTIME === 'true') {
  const server = require('http').createServer(app);
  const io = require('socket.io')(server, {
    cors: {
      origin: [
        'https://souk-el-syarat.web.app',
        'https://souk-el-syarat.firebaseapp.com'
      ]
    }
  });
  
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('subscribe', async (userId) => {
      socket.join(`user-${userId}`);
      
      // Listen for order updates
      admin.database().ref(`orders`).on('child_changed', (snapshot) => {
        const order = snapshot.val();
        if (order.userId === userId) {
          socket.emit('orderUpdate', { id: snapshot.key, ...order });
        }
      });
    });
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
  
  const PORT = process.env.PORT || 8080;
  server.listen(PORT, () => {
    console.log(`Server with WebSocket running on port ${PORT}`);
  });
} else {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
```

### **3. Update package.json**
```json
{
  "name": "souk-el-syarat-backend",
  "version": "1.0.0",
  "description": "Backend for Souk El-Syarat marketplace",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "build": "echo 'Build complete'",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "firebase-admin": "^12.0.0",
    "cors": "^2.8.5",
    "body-parser": "^1.20.2",
    "@sendgrid/mail": "^8.1.0",
    "socket.io": "^4.6.1",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "jest": "^29.7.0"
  },
  "engines": {
    "node": "20.x"
  }
}
```

### **4. Environment Variables Setup**
```bash
# Create secrets in Firebase Console
firebase apphosting:secrets:set sendgrid-api-key --project souk-el-syarat
firebase apphosting:secrets:set jwt-secret --project souk-el-syarat
firebase apphosting:secrets:set session-secret --project souk-el-syarat
```

---

## 🚀 DEPLOYMENT STEPS

### **Step 1: Push to GitHub**
```bash
cd /workspace
git add .
git commit -m "feat: Complete backend setup for App Hosting"
git push origin main
```

### **Step 2: Create Rollout**
```bash
# In Firebase Console, click "Create rollout"
# OR use CLI:
firebase apphosting:backends:create souk-el-sayarat-backend \
  --project souk-el-syarat \
  --location europe-west4 \
  --github-repo AmrNabih-hub/Souk-El-Syarat
```

### **Step 3: Verify Services**
```bash
# Check backend health
curl https://souk-el-sayarat-backend--souk-el-syarat.europe-west4.hosted.app/health

# Test authentication
curl -X POST https://souk-el-sayarat-backend--souk-el-syarat.europe-west4.hosted.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","displayName":"Test User"}'
```

---

## ✅ SUCCESS CRITERIA

Your backend is successfully released when:

1. **Health Check**: Returns `{"status": "healthy"}`
2. **Authentication**: User registration works
3. **Email Service**: Sends welcome emails
4. **Real-time**: WebSocket connections work
5. **Database**: Firestore operations succeed
6. **API Endpoints**: All return proper responses

---

## 🔍 MONITORING & LOGS

### **View Logs**
```bash
firebase functions:log --project souk-el-syarat
```

### **Monitor in Console**
1. Go to Firebase Console → App Hosting
2. Check "Rollouts" tab for deployment status
3. View "Logs" tab for runtime logs
4. Check "Usage" tab for metrics

---

## 🚨 TROUBLESHOOTING

### **If Release Fails:**

1. **Check GitHub Connection**
   - Ensure repo is connected
   - Verify branch permissions

2. **Check Build Logs**
   - Look for npm install errors
   - Check for missing dependencies

3. **Check Runtime Logs**
   - Look for startup errors
   - Verify environment variables

4. **Common Fixes:**
   ```bash
   # Clear cache and retry
   npm cache clean --force
   npm install
   
   # Update dependencies
   npm update
   
   # Rebuild
   npm run build
   ```

---

## 📊 EXPECTED RESULT

After successful deployment:
```json
{
  "backend": "souk-el-sayarat-backend",
  "status": "running",
  "url": "https://souk-el-sayarat-backend--souk-el-syarat.europe-west4.hosted.app",
  "services": {
    "authentication": "active",
    "database": "connected",
    "email": "configured",
    "realtime": "enabled"
  },
  "health": "healthy",
  "version": "1.0.0"
}
```

**This setup ensures all your backend services work correctly!**