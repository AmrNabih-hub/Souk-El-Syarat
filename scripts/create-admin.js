const admin = require('firebase-admin');

// Initialize admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'souk-el-syarat'
  });
}

async function createStaticAdmin() {
  try {
    // Create user in Authentication
    const userRecord = await admin.auth().createUser({
      email: 'master.admin@soukelsyarat.com',
      password: 'SoukAdmin#2025$Secure!',
      displayName: 'Master Administrator',
      emailVerified: true
    });
    
    // Set custom claims
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: 'super_admin',
      static: true,
      permissions: ['*']
    });
    
    // Add to Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: 'master.admin@soukelsyarat.com',
      name: 'Master Administrator',
      role: 'super_admin',
      static: true,
      permissions: ['*'],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'system',
      emailVerified: true,
      twoFactorEnabled: false, // Will be enabled on first login
      lastLogin: null,
      isActive: true
    });
    
    console.log('✅ Static admin created:', userRecord.uid);
    return userRecord;
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log('⚠️ Admin already exists');
      // Update existing admin
      const user = await admin.auth().getUserByEmail('master.admin@soukelsyarat.com');
      await admin.auth().setCustomUserClaims(user.uid, {
        role: 'super_admin',
        static: true,
        permissions: ['*']
      });
      return user;
    }
    throw error;
  }
}

createStaticAdmin().then(() => process.exit(0)).catch(console.error);
