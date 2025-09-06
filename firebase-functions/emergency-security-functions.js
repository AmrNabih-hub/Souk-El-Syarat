/**
 * Emergency Firebase Security Functions
 * CRITICAL: Immediate implementation of role-based access control
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

// Set custom claims for user roles
exports.setUserRole = functions.https.onCall(async (data, context) => {
  // Verify admin access
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
  
  const { uid, role } = data;
  
  // Validate role
  const validRoles = ['admin', 'vendor', 'user'];
  if (!validRoles.includes(role)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid role');
  }
  
  try {
    // Set custom claims
    await admin.auth().setCustomUserClaims(uid, { role: role });
    
    return { success: true, message: `User ${uid} assigned role ${role}` };
  } catch (error) {
    throw new functions.https.HttpsError('internal', 'Failed to set user role');
  }
});

// Verify user role on database access
exports.verifyUserRole = functions.database.ref('/{path=**}').onWrite(async (change, context) => {
  const { auth } = context;
  
  if (!auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }
  
  // Check if user has required role for the path
  const path = context.params.path;
  const userRole = auth.token.role;
  
  // Define role requirements for different paths
  const roleRequirements = {
    'admin': ['admin'],
    'vendorApplications': ['admin'],
    'analytics': ['admin'],
    'products': ['admin', 'vendor'],
    'orders': ['admin', 'user'],
    'users': ['admin', 'user']
  };
  
  // Check if user has required role
  const requiredRoles = roleRequirements[path] || ['user'];
  if (!requiredRoles.includes(userRole)) {
    throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
  }
  
  return null;
});

// Monitor database access patterns
exports.monitorDatabaseAccess = functions.database.ref('/{path=**}').onWrite(async (change, context) => {
  const { auth, params } = context;
  const path = params.path;
  
  // Log access attempt
  const accessLog = {
    timestamp: admin.database.ServerValue.TIMESTAMP,
    userId: auth ? auth.uid : 'anonymous',
    path: path,
    action: change.after.exists() ? 'write' : 'delete',
    userAgent: context.rawRequest.headers['user-agent'],
    ip: context.rawRequest.connection.remoteAddress
  };
  
  // Store access log
  await admin.database().ref('security/logs/access').push(accessLog);
  
  // Check for suspicious patterns
  if (auth) {
    const userRole = auth.token.role || 'user';
    
    // Alert on admin actions by non-admin users
    if (path.includes('admin') && userRole !== 'admin') {
      await admin.database().ref('security/alerts').push({
        type: 'unauthorized_admin_access',
        severity: 'critical',
        userId: auth.uid,
        path: path,
        timestamp: admin.database.ServerValue.TIMESTAMP,
        message: 'Non-admin user attempted to access admin data'
      });
    }
    
    // Alert on bulk data access
    if (path.includes('users') && userRole !== 'admin') {
      await admin.database().ref('security/alerts').push({
        type: 'bulk_data_access',
        severity: 'high',
        userId: auth.uid,
        path: path,
        timestamp: admin.database.ServerValue.TIMESTAMP,
        message: 'User attempted bulk data access'
      });
    }
  }
  
  return null;
});

// Monitor authentication events
exports.monitorAuthEvents = functions.auth.user().onCreate(async (user) => {
  const authLog = {
    type: 'user_created',
    userId: user.uid,
    email: user.email,
    timestamp: admin.database.ServerValue.TIMESTAMP,
    ip: user.metadata.creationTime
  };
  
  await admin.database().ref('security/logs/auth').push(authLog);
});

// Monitor failed authentication attempts
exports.monitorFailedAuth = functions.auth.user().onDelete(async (user) => {
  const authLog = {
    type: 'user_deleted',
    userId: user.uid,
    email: user.email,
    timestamp: admin.database.ServerValue.TIMESTAMP
  };
  
  await admin.database().ref('security/logs/auth').push(authLog);
});

// Security alert notification
exports.sendSecurityAlert = functions.database.ref('security/alerts/{alertId}').onCreate(async (snapshot, context) => {
  const alert = snapshot.val();
  
  // Send email notification for critical alerts
  if (alert.severity === 'critical') {
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: functions.config().email.user,
        pass: functions.config().email.pass
      }
    });
    
    const mailOptions = {
      from: functions.config().email.user,
      to: functions.config().email.admin,
      subject: 'CRITICAL Firebase Security Alert',
      html: `
        <h2>Critical Security Alert</h2>
        <p><strong>Type:</strong> ${alert.type}</p>
        <p><strong>Severity:</strong> ${alert.severity}</p>
        <p><strong>User ID:</strong> ${alert.userId}</p>
        <p><strong>Path:</strong> ${alert.path}</p>
        <p><strong>Message:</strong> ${alert.message}</p>
        <p><strong>Timestamp:</strong> ${new Date(alert.timestamp).toISOString()}</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
  }
  
  return null;
});

// Emergency security check
exports.emergencySecurityCheck = functions.https.onRequest(async (req, res) => {
  try {
    // Check for insecure rules
    const rules = await admin.database().ref('.settings/rules').once('value');
    
    if (rules.val() && rules.val().includes('"read": true') && rules.val().includes('"write": true')) {
      res.status(500).json({
        status: 'CRITICAL',
        message: 'Insecure rules detected! Immediate action required.',
        risk: 'HIGH'
      });
    } else {
      res.status(200).json({
        status: 'SECURE',
        message: 'Security rules are properly configured.',
        risk: 'LOW'
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Failed to check security rules.',
      error: error.message
    });
  }
});