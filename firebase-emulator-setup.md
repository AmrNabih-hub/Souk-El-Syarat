# Firebase Emulator Setup for Local Development

## Overview
Since we don't have a service account key file, we can use Firebase Emulators for local development. This provides a fully functional Firebase environment locally without needing production credentials.

## Quick Start

### 1. Install Firebase Tools (if not installed)
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
```bash
firebase login
```

### 3. Initialize Emulators
```bash
firebase init emulators
```

Select the following emulators:
- Authentication Emulator
- Functions Emulator
- Firestore Emulator
- Database Emulator
- Hosting Emulator
- Storage Emulator

### 4. Start Emulators
```bash
firebase emulators:start
```

This will start:
- Firestore: http://localhost:8080
- Database: http://localhost:9000
- Authentication: http://localhost:9099
- Storage: http://localhost:9199
- Functions: http://localhost:5001
- Hosting: http://localhost:5000
- Emulator UI: http://localhost:4000

## Configure Backend to Use Emulators

Update your `server.js` to detect and use emulators:

```javascript
// Check if running with emulators
if (process.env.FIRESTORE_EMULATOR_HOST) {
  console.log('🔥 Using Firebase Emulators');
  // Emulators are auto-configured when environment variables are set
}
```

## Environment Variables for Emulators

When running with emulators, these are automatically set:
- `FIRESTORE_EMULATOR_HOST=localhost:8080`
- `FIREBASE_AUTH_EMULATOR_HOST=localhost:9099`
- `FIREBASE_DATABASE_EMULATOR_HOST=localhost:9000`
- `FIREBASE_STORAGE_EMULATOR_HOST=localhost:9199`

## Running the Application with Emulators

### Option 1: Two Terminal Windows
Terminal 1:
```bash
firebase emulators:start
```

Terminal 2:
```bash
npm run start
```

### Option 2: Single Command (create package.json script)
```json
{
  "scripts": {
    "dev:emulators": "firebase emulators:exec 'npm run start'"
  }
}
```

## Benefits of Using Emulators

1. **No Production Data Risk**: Complete isolation from production
2. **No Billing**: Everything runs locally
3. **Fast Development**: No network latency
4. **Testing**: Can test edge cases without affecting real data
5. **Team Development**: Each developer has their own environment

## Seed Data for Emulators

Create a file `emulator-seed.js`:

```javascript
const admin = require('firebase-admin');

// Initialize with emulator
admin.initializeApp();

async function seedData() {
  const db = admin.firestore();
  
  // Add sample products
  await db.collection('products').add({
    name: 'Sample Product',
    price: 100,
    category: 'Electronics',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  console.log('✅ Seed data added');
}

seedData();
```

## Troubleshooting

### Issue: Emulators not starting
- Check if ports are already in use
- Run: `lsof -i :8080` (or other ports)
- Kill processes if needed: `kill -9 <PID>`

### Issue: Backend not connecting to emulators
- Ensure environment variables are set
- Check Firebase Admin SDK initialization
- Verify emulator ports match configuration

## Next Steps

1. Start emulators: `firebase emulators:start`
2. Run backend: `npm run start`
3. Access Emulator UI: http://localhost:4000
4. Test your application locally!