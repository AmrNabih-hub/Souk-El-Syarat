"use strict";
/**
 * PROFESSIONAL PRODUCTION-READY BACKEND
 * Souk El-Syarat Marketplace
 * Complete Real-time Implementation
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSubscriptions = exports.onNewMessage = exports.onOrderStatusUpdate = exports.onUserCreated = exports.api = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();
const realtimeDb = admin.database();
const storage = admin.storage();
// Create Express app with proper typing
const app = (0, express_1.default)();
// Configure CORS for production
app.use((0, cors_1.default)({
    origin: [
        'https://souk-el-syarat.web.app',
        'https://souk-el-syarat.firebaseapp.com',
        'http://localhost:5173',
        'http://localhost:3000'
    ],
    credentials: true
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// ============================================
// MIDDLEWARE
// ============================================
// Auth middleware
const authenticateUser = async (req, res, next) => {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split('Bearer ')[1];
        if (!token) {
            return res.status(401).json({ success: false, error: 'No token provided' });
        }
        const decodedToken = await auth.verifyIdToken(token);
        req.user = decodedToken;
        next();
    }
    catch (error) {
        return res.status(401).json({ success: false, error: 'Invalid token' });
    }
};
// Admin middleware
const requireAdmin = async (req, res, next) => {
    const user = req.user;
    if (!user) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const userDoc = await db.collection('users').doc(user.uid).get();
    const userData = userDoc.data();
    if ((userData === null || userData === void 0 ? void 0 : userData.role) !== 'admin') {
        return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    next();
};
// ============================================
// AUTHENTICATION ENDPOINTS - COMPLETE
// ============================================
// Register new user with real-time sync
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName, phoneNumber, role = 'customer' } = req.body;
        // Validate input
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }
        // Create user in Firebase Auth
        const userRecord = await auth.createUser({
            email,
            password,
            displayName: `${firstName} ${lastName}`,
            phoneNumber: phoneNumber || undefined
        });
        // Create user profile in Firestore
        const userProfile = {
            email,
            firstName,
            lastName,
            phoneNumber: phoneNumber || null,
            role,
            displayName: `${firstName} ${lastName}`,
            isActive: true,
            emailVerified: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            preferences: {
                language: 'ar',
                currency: 'EGP',
                notifications: {
                    email: true,
                    sms: false,
                    push: true
                }
            }
        };
        await db.collection('users').doc(userRecord.uid).set(userProfile);
        // Sync to Realtime Database for instant updates
        await realtimeDb.ref(`users/${userRecord.uid}`).set({
            displayName: `${firstName} ${lastName}`,
            email,
            role,
            status: 'online',
            lastSeen: admin.database.ServerValue.TIMESTAMP
        });
        // Update stats
        await realtimeDb.ref('stats/users/total').transaction((current) => (current || 0) + 1);
        await realtimeDb.ref(`stats/users/by-role/${role}`).transaction((current) => (current || 0) + 1);
        // Create custom token for immediate login
        const customToken = await auth.createCustomToken(userRecord.uid);
        // Log registration event
        await db.collection('audit_logs').add({
            action: 'user_registered',
            userId: userRecord.uid,
            email,
            role,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                uid: userRecord.uid,
                email: userRecord.email,
                displayName: userRecord.displayName,
                customToken
            }
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Registration failed'
        });
    }
});
// Login endpoint (for custom login if needed)
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        // Note: Firebase handles login on client-side
        // This endpoint is for server-side validation if needed
        // Get user by email
        const userRecord = await auth.getUserByEmail(email);
        // Update last login
        await db.collection('users').doc(userRecord.uid).update({
            lastLogin: admin.firestore.FieldValue.serverTimestamp()
        });
        // Update realtime status
        await realtimeDb.ref(`users/${userRecord.uid}/status`).set('online');
        await realtimeDb.ref(`users/${userRecord.uid}/lastSeen`).set(admin.database.ServerValue.TIMESTAMP);
        // Create custom token
        const customToken = await auth.createCustomToken(userRecord.uid);
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                uid: userRecord.uid,
                email: userRecord.email,
                customToken
            }
        });
    }
    catch (error) {
        res.status(401).json({
            success: false,
            error: 'Invalid credentials'
        });
    }
});
// Get user profile with real-time data
app.get('/api/auth/profile/:userId', authenticateUser, async (req, res) => {
    try {
        const { userId } = req.params;
        // Get from Firestore
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        // Get real-time status
        const realtimeSnapshot = await realtimeDb.ref(`users/${userId}`).once('value');
        const realtimeData = realtimeSnapshot.val();
        res.json({
            success: true,
            data: Object.assign(Object.assign({ id: userDoc.id }, userDoc.data()), { onlineStatus: (realtimeData === null || realtimeData === void 0 ? void 0 : realtimeData.status) || 'offline', lastSeen: realtimeData === null || realtimeData === void 0 ? void 0 : realtimeData.lastSeen })
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Update user profile
app.put('/api/auth/profile', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.uid;
        const updates = req.body;
        // Remove sensitive fields
        delete updates.role;
        delete updates.uid;
        delete updates.email;
        // Update Firestore
        await db.collection('users').doc(userId).update(Object.assign(Object.assign({}, updates), { updatedAt: admin.firestore.FieldValue.serverTimestamp() }));
        // Update Realtime Database
        if (updates.displayName) {
            await realtimeDb.ref(`users/${userId}/displayName`).set(updates.displayName);
        }
        res.json({
            success: true,
            message: 'Profile updated successfully'
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
// ============================================
// VENDOR MANAGEMENT - COMPLETE WORKFLOW
// ============================================
// Apply as vendor with real-time tracking
app.post('/api/vendors/apply', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.uid;
        const { businessName, businessType, nationalId, commercialRegister, taxNumber, businessAddress, bankAccount, subscriptionPlan, instaPayProof // Base64 image of InstaPay transaction
         } = req.body;
        // Create vendor application
        const applicationData = {
            userId,
            businessName,
            businessType,
            nationalId,
            commercialRegister,
            taxNumber,
            businessAddress,
            bankAccount,
            subscriptionPlan,
            instaPayProof,
            status: 'pending',
            submittedAt: admin.firestore.FieldValue.serverTimestamp(),
            reviewedAt: null,
            reviewedBy: null,
            rejectionReason: null
        };
        const applicationRef = await db.collection('vendor_applications').add(applicationData);
        // Create real-time tracking
        await realtimeDb.ref(`vendor_applications/${applicationRef.id}`).set({
            applicationId: applicationRef.id,
            userId,
            businessName,
            status: 'pending',
            submittedAt: Date.now(),
            updates: []
        });
        // Notify all admins in real-time
        await realtimeDb.ref('admin/notifications').push({
            type: 'new_vendor_application',
            applicationId: applicationRef.id,
            businessName,
            userId,
            timestamp: admin.database.ServerValue.TIMESTAMP,
            read: false,
            priority: 'high'
        });
        // Send email to admin
        await db.collection('email_queue').add({
            to: 'admin@souk-elsyarat.com',
            template: 'vendor_application',
            data: {
                businessName,
                applicationId: applicationRef.id
            },
            status: 'pending'
        });
        res.status(201).json({
            success: true,
            message: 'Vendor application submitted successfully',
            data: {
                applicationId: applicationRef.id,
                status: 'pending'
            }
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
// Get vendor application status with real-time updates
app.get('/api/vendors/application/:applicationId', authenticateUser, async (req, res) => {
    try {
        const { applicationId } = req.params;
        const userId = req.user.uid;
        // Get application
        const appDoc = await db.collection('vendor_applications').doc(applicationId).get();
        if (!appDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Application not found'
            });
        }
        const appData = appDoc.data();
        // Verify ownership
        if ((appData === null || appData === void 0 ? void 0 : appData.userId) !== userId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized'
            });
        }
        // Get real-time updates
        const realtimeSnapshot = await realtimeDb.ref(`vendor_applications/${applicationId}`).once('value');
        const realtimeData = realtimeSnapshot.val();
        res.json({
            success: true,
            data: Object.assign(Object.assign({ id: appDoc.id }, appData), { realtimeUpdates: (realtimeData === null || realtimeData === void 0 ? void 0 : realtimeData.updates) || [] })
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Admin approve/reject vendor application
app.put('/api/vendors/application/:applicationId/review', authenticateUser, requireAdmin, async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { status, rejectionReason } = req.body;
        const adminId = req.user.uid;
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status'
            });
        }
        // Get application
        const appDoc = await db.collection('vendor_applications').doc(applicationId).get();
        if (!appDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Application not found'
            });
        }
        const appData = appDoc.data();
        // Update application
        const updateData = {
            status,
            reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
            reviewedBy: adminId
        };
        if (status === 'rejected') {
            updateData.rejectionReason = rejectionReason;
        }
        await db.collection('vendor_applications').doc(applicationId).update(updateData);
        // If approved, create vendor account
        if (status === 'approved') {
            const vendorData = {
                userId: appData.userId,
                businessName: appData.businessName,
                businessType: appData.businessType,
                nationalId: appData.nationalId,
                commercialRegister: appData.commercialRegister,
                taxNumber: appData.taxNumber,
                businessAddress: appData.businessAddress,
                bankAccount: appData.bankAccount,
                subscriptionPlan: appData.subscriptionPlan,
                subscriptionStatus: 'active',
                subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                isActive: true,
                isVerified: true,
                rating: 0,
                totalSales: 0,
                totalProducts: 0,
                joinedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            await db.collection('vendors').doc(appData.userId).set(vendorData);
            // Update user role
            await db.collection('users').doc(appData.userId).update({
                role: 'vendor',
                vendorId: appData.userId
            });
            // Update auth custom claims
            await auth.setCustomUserClaims(appData.userId, { role: 'vendor' });
        }
        // Update real-time status
        await realtimeDb.ref(`vendor_applications/${applicationId}`).update({
            status,
            reviewedAt: Date.now(),
            reviewedBy: adminId
        });
        // Add to updates history
        await realtimeDb.ref(`vendor_applications/${applicationId}/updates`).push({
            status,
            timestamp: admin.database.ServerValue.TIMESTAMP,
            by: adminId,
            reason: rejectionReason || null
        });
        // Notify user in real-time
        await realtimeDb.ref(`users/${appData.userId}/notifications`).push({
            type: 'vendor_application_reviewed',
            status,
            applicationId,
            timestamp: admin.database.ServerValue.TIMESTAMP,
            read: false
        });
        res.json({
            success: true,
            message: `Application ${status} successfully`
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
// ============================================
// SELL CAR APPROVAL SYSTEM
// ============================================
// Submit car for sale
app.post('/api/cars/sell', authenticateUser, async (req, res) => {
    try {
        const userId = req.user.uid;
        const { brand, model, year, mileage, condition, price, description, images, // Array of base64 images
        location, contactNumber } = req.body;
        // Create car listing (pending approval)
        const carData = {
            userId,
            brand,
            model,
            year,
            mileage,
            condition,
            price,
            description,
            images,
            location,
            contactNumber,
            status: 'pending_approval',
            isActive: false,
            views: 0,
            inquiries: 0,
            submittedAt: admin.firestore.FieldValue.serverTimestamp(),
            approvedAt: null,
            approvedBy: null,
            rejectionReason: null
        };
        const carRef = await db.collection('car_listings').add(carData);
        // Create real-time tracking
        await realtimeDb.ref(`car_listings/${carRef.id}`).set({
            listingId: carRef.id,
            userId,
            status: 'pending_approval',
            brand,
            model,
            price,
            submittedAt: Date.now()
        });
        // Notify admins
        await realtimeDb.ref('admin/notifications').push({
            type: 'new_car_listing',
            listingId: carRef.id,
            userId,
            carInfo: `${brand} ${model} ${year}`,
            price,
            timestamp: admin.database.ServerValue.TIMESTAMP,
            read: false,
            priority: 'medium'
        });
        res.status(201).json({
            success: true,
            message: 'Car listing submitted for approval',
            data: {
                listingId: carRef.id,
                status: 'pending_approval'
            }
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
// Get car listing status
app.get('/api/cars/listing/:listingId/status', authenticateUser, async (req, res) => {
    try {
        const { listingId } = req.params;
        // Get real-time status
        const realtimeSnapshot = await realtimeDb.ref(`car_listings/${listingId}`).once('value');
        const realtimeData = realtimeSnapshot.val();
        if (!realtimeData) {
            return res.status(404).json({
                success: false,
                error: 'Listing not found'
            });
        }
        res.json({
            success: true,
            data: realtimeData
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Admin approve/reject car listing
app.put('/api/cars/listing/:listingId/review', authenticateUser, requireAdmin, async (req, res) => {
    try {
        const { listingId } = req.params;
        const { status, rejectionReason } = req.body;
        const adminId = req.user.uid;
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status'
            });
        }
        // Update listing
        const updateData = {
            status,
            reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
            reviewedBy: adminId
        };
        if (status === 'approved') {
            updateData.isActive = true;
            updateData.approvedAt = admin.firestore.FieldValue.serverTimestamp();
            updateData.approvedBy = adminId;
        }
        else {
            updateData.rejectionReason = rejectionReason;
        }
        await db.collection('car_listings').doc(listingId).update(updateData);
        // Update real-time
        await realtimeDb.ref(`car_listings/${listingId}`).update({
            status,
            reviewedAt: Date.now(),
            reviewedBy: adminId
        });
        // Get listing data for notification
        const listingDoc = await db.collection('car_listings').doc(listingId).get();
        const listingData = listingDoc.data();
        // Notify user
        await realtimeDb.ref(`users/${listingData.userId}/notifications`).push({
            type: 'car_listing_reviewed',
            status,
            listingId,
            carInfo: `${listingData.brand} ${listingData.model}`,
            timestamp: admin.database.ServerValue.TIMESTAMP,
            read: false
        });
        res.json({
            success: true,
            message: `Car listing ${status} successfully`
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
// ============================================
// REAL-TIME CHAT SYSTEM (Admin2)
// ============================================
// Send message
app.post('/api/chat/send', authenticateUser, async (req, res) => {
    var _a;
    try {
        const senderId = req.user.uid;
        const { receiverId, message, type = 'text' } = req.body;
        // Create or get conversation
        const conversationId = [senderId, receiverId].sort().join('_');
        // Save to Realtime Database for instant delivery
        const messageRef = await realtimeDb.ref(`chats/${conversationId}/messages`).push({
            senderId,
            receiverId,
            message,
            type,
            timestamp: admin.database.ServerValue.TIMESTAMP,
            read: false
        });
        // Also save to Firestore for persistence
        await db.collection('conversations').doc(conversationId).set({
            participants: [senderId, receiverId],
            lastMessage: message,
            lastMessageTime: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        await db.collection('conversations').doc(conversationId)
            .collection('messages').doc(messageRef.key).set({
            senderId,
            receiverId,
            message,
            type,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            read: false
        });
        // Notify receiver in real-time
        await realtimeDb.ref(`users/${receiverId}/unread_messages`).transaction((current) => (current || 0) + 1);
        // If receiver is admin2, send special notification
        const receiverDoc = await db.collection('users').doc(receiverId).get();
        if (((_a = receiverDoc.data()) === null || _a === void 0 ? void 0 : _a.role) === 'admin2') {
            await realtimeDb.ref('admin2/new_messages').push({
                from: senderId,
                message,
                timestamp: admin.database.ServerValue.TIMESTAMP,
                conversationId
            });
        }
        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: {
                messageId: messageRef.key,
                conversationId
            }
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
// Get conversations for admin2
app.get('/api/chat/admin2/conversations', authenticateUser, async (req, res) => {
    var _a;
    try {
        const userId = req.user.uid;
        // Verify admin2 role
        const userDoc = await db.collection('users').doc(userId).get();
        if (((_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.role) !== 'admin2') {
            return res.status(403).json({
                success: false,
                error: 'Admin2 access required'
            });
        }
        // Get all conversations where admin2 is participant
        const snapshot = await db.collection('conversations')
            .where('participants', 'array-contains', userId)
            .orderBy('lastMessageTime', 'desc')
            .get();
        const conversations = await Promise.all(snapshot.docs.map(async (doc) => {
            const data = doc.data();
            const otherUserId = data.participants.find((p) => p !== userId);
            // Get other user info
            const otherUserDoc = await db.collection('users').doc(otherUserId).get();
            const otherUser = otherUserDoc.data();
            // Get unread count from realtime
            const unreadSnapshot = await realtimeDb.ref(`chats/${doc.id}/messages`)
                .orderByChild('read')
                .equalTo(false)
                .once('value');
            const unreadMessages = unreadSnapshot.val() || {};
            const unreadCount = Object.values(unreadMessages).filter((msg) => msg.receiverId === userId).length;
            return Object.assign(Object.assign({ id: doc.id }, data), { otherUser: {
                    id: otherUserId,
                    displayName: otherUser === null || otherUser === void 0 ? void 0 : otherUser.displayName,
                    photoURL: otherUser === null || otherUser === void 0 ? void 0 : otherUser.photoURL,
                    role: otherUser === null || otherUser === void 0 ? void 0 : otherUser.role
                }, unreadCount });
        }));
        res.json({
            success: true,
            data: conversations
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Mark messages as read
app.put('/api/chat/read/:conversationId', authenticateUser, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.uid;
        // Update all unread messages in realtime
        const messagesRef = realtimeDb.ref(`chats/${conversationId}/messages`);
        const snapshot = await messagesRef.once('value');
        const messages = snapshot.val() || {};
        const updates = {};
        Object.keys(messages).forEach(key => {
            if (messages[key].receiverId === userId && !messages[key].read) {
                updates[`${key}/read`] = true;
            }
        });
        if (Object.keys(updates).length > 0) {
            await messagesRef.update(updates);
            // Reset unread counter
            await realtimeDb.ref(`users/${userId}/unread_messages`).set(0);
        }
        res.json({
            success: true,
            message: 'Messages marked as read'
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
// ============================================
// PRODUCTS ENDPOINTS - FULL CRUD OPERATIONS
// ============================================
// Get all products with pagination
app.get('/api/products', async (req, res) => {
    try {
        const { page = 1, limit = 20, category, brand, minPrice, maxPrice, condition, governorate, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        let query = db.collection('products');
        // Apply filters
        if (category)
            query = query.where('category', '==', category);
        if (brand)
            query = query.where('brand', '==', brand);
        if (condition)
            query = query.where('condition', '==', condition);
        if (governorate)
            query = query.where('governorate', '==', governorate);
        if (minPrice)
            query = query.where('price', '>=', Number(minPrice));
        if (maxPrice)
            query = query.where('price', '<=', Number(maxPrice));
        // Apply sorting only if not default or if createdAt field exists
        if (sortBy !== 'createdAt') {
            try {
                query = query.orderBy(sortBy, sortOrder);
            }
            catch (error) {
                console.log('Sorting skipped:', error);
            }
        }
        // Apply pagination
        const startAt = (Number(page) - 1) * Number(limit);
        query = query.limit(Number(limit)).offset(startAt);
        const snapshot = await query.get();
        const products = snapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
        // Get total count for pagination
        const countSnapshot = await db.collection('products').count().get();
        const totalCount = countSnapshot.data().count;
        res.json({
            success: true,
            data: {
                products,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total: totalCount,
                    totalPages: Math.ceil(totalCount / Number(limit))
                }
            }
        });
    }
    catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch products'
        });
    }
});
// Get single product by ID
app.get('/api/products/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const productDoc = await db.collection('products').doc(productId).get();
        if (!productDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }
        // Increment view count
        await productDoc.ref.update({
            views: admin.firestore.FieldValue.increment(1)
        });
        // Get related products
        const productData = productDoc.data();
        const relatedSnapshot = await db.collection('products')
            .where('category', '==', productData === null || productData === void 0 ? void 0 : productData.category)
            .where('id', '!=', productId)
            .limit(4)
            .get();
        const relatedProducts = relatedSnapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        res.json({
            success: true,
            data: {
                product: Object.assign({ id: productDoc.id }, productData),
                relatedProducts
            }
        });
    }
    catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch product'
        });
    }
});
// Get categories
app.get('/api/categories', async (req, res) => {
    try {
        const snapshot = await db.collection('categories').orderBy('order', 'asc').get();
        const categories = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        res.json({
            success: true,
            data: categories
        });
    }
    catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch categories'
        });
    }
});
// ============================================
// ENHANCED SEARCH WITH REAL-TIME UPDATES
// ============================================
app.get('/api/search/products', async (req, res) => {
    try {
        const { q, category, minPrice, maxPrice, condition, year, brand, sortBy = 'relevance', limit = 20, offset = 0 } = req.query;
        // Build query
        let query = db.collection('products').where('isActive', '==', true);
        if (category) {
            query = query.where('category', '==', category);
        }
        if (minPrice) {
            query = query.where('price', '>=', Number(minPrice));
        }
        if (maxPrice) {
            query = query.where('price', '<=', Number(maxPrice));
        }
        if (condition) {
            query = query.where('condition', '==', condition);
        }
        if (year) {
            query = query.where('year', '==', Number(year));
        }
        if (brand) {
            query = query.where('brand', '==', brand);
        }
        // Add sorting
        switch (sortBy) {
            case 'price_asc':
                query = query.orderBy('price', 'asc');
                break;
            case 'price_desc':
                query = query.orderBy('price', 'desc');
                break;
            case 'newest':
                query = query.orderBy('createdAt', 'desc');
                break;
            case 'popular':
                query = query.orderBy('views', 'desc');
                break;
            default:
                query = query.orderBy('createdAt', 'desc');
        }
        // Execute query
        const snapshot = await query.limit(Number(limit)).get();
        let products = snapshot.docs.map(doc => (Object.assign(Object.assign({ id: doc.id }, doc.data()), { score: 1 })));
        // Text search if query provided
        if (q) {
            const searchTerm = String(q).toLowerCase();
            const searchTerms = searchTerm.split(' ').filter(t => t.length > 2);
            products = products.map((product) => {
                let score = 0;
                // Score based on title match
                searchTerms.forEach(term => {
                    var _a, _b, _c, _d;
                    if ((_a = product.title) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(term)) {
                        score += 10;
                    }
                    if ((_b = product.description) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(term)) {
                        score += 5;
                    }
                    if ((_c = product.brand) === null || _c === void 0 ? void 0 : _c.toLowerCase().includes(term)) {
                        score += 8;
                    }
                    if ((_d = product.model) === null || _d === void 0 ? void 0 : _d.toLowerCase().includes(term)) {
                        score += 8;
                    }
                });
                return Object.assign(Object.assign({}, product), { score });
            }).filter(p => p.score > 0)
                .sort((a, b) => b.score - a.score);
        }
        // Track search in real-time
        if (q) {
            await realtimeDb.ref('search_trends').push({
                query: q,
                results: products.length,
                timestamp: admin.database.ServerValue.TIMESTAMP
            });
        }
        res.json({
            success: true,
            query: q || '',
            total: products.length,
            data: products.slice(Number(offset), Number(offset) + Number(limit))
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Get trending searches
app.get('/api/search/trending', async (req, res) => {
    try {
        const snapshot = await realtimeDb.ref('search_trends')
            .orderByChild('timestamp')
            .limitToLast(100)
            .once('value');
        const searches = snapshot.val() || {};
        // Aggregate by query
        const trends = {};
        Object.values(searches).forEach((search) => {
            if (search.query) {
                trends[search.query] = (trends[search.query] || 0) + 1;
            }
        });
        // Sort by frequency
        const trendingSearches = Object.entries(trends)
            .map(([query, count]) => ({ query, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        res.json({
            success: true,
            data: trendingSearches
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// ============================================
// PAYMENT SYSTEM (Cash on Delivery + InstaPay)
// ============================================
// Create order with COD
app.post('/api/orders/create', authenticateUser, async (req, res) => {
    try {
        const customerId = req.user.uid;
        const { items, shippingAddress, paymentMethod = 'cod', notes } = req.body;
        // Calculate total
        let total = 0;
        const orderItems = await Promise.all(items.map(async (item) => {
            const productDoc = await db.collection('products').doc(item.productId).get();
            const product = productDoc.data();
            if (!product) {
                throw new Error(`Product ${item.productId} not found`);
            }
            const itemTotal = product.price * item.quantity;
            total += itemTotal;
            return {
                productId: item.productId,
                productName: product.title,
                vendorId: product.vendorId,
                price: product.price,
                quantity: item.quantity,
                total: itemTotal
            };
        }));
        // Create order
        const orderData = {
            customerId,
            orderNumber: `ORD-${Date.now()}`,
            items: orderItems,
            shippingAddress,
            paymentMethod,
            paymentStatus: paymentMethod === 'cod' ? 'pending' : 'awaiting_verification',
            orderStatus: 'pending',
            total,
            notes,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        const orderRef = await db.collection('orders').add(orderData);
        // Create real-time tracking
        await realtimeDb.ref(`orders/${orderRef.id}`).set({
            orderId: orderRef.id,
            customerId,
            orderNumber: orderData.orderNumber,
            status: 'pending',
            paymentMethod,
            total,
            createdAt: Date.now(),
            timeline: [{
                    status: 'pending',
                    timestamp: Date.now(),
                    message: 'Order placed successfully'
                }]
        });
        // Notify vendors
        const vendorIds = [...new Set(orderItems.map(item => item.vendorId))];
        for (const vendorId of vendorIds) {
            await realtimeDb.ref(`vendors/${vendorId}/new_orders`).push({
                orderId: orderRef.id,
                orderNumber: orderData.orderNumber,
                timestamp: admin.database.ServerValue.TIMESTAMP
            });
        }
        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: {
                orderId: orderRef.id,
                orderNumber: orderData.orderNumber,
                total,
                paymentMethod
            }
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
// Submit InstaPay proof for vendor subscription
app.post('/api/vendors/subscription/instapay', authenticateUser, async (req, res) => {
    try {
        const vendorId = req.user.uid;
        const { transactionImage, // Base64 image
        transactionNumber, amount, plan } = req.body;
        // Create payment verification request
        const verificationData = {
            vendorId,
            type: 'subscription',
            method: 'instapay',
            transactionImage,
            transactionNumber,
            amount,
            plan,
            status: 'pending_verification',
            submittedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        const verificationRef = await db.collection('payment_verifications').add(verificationData);
        // Notify admin for review
        await realtimeDb.ref('admin/payment_verifications').push({
            verificationId: verificationRef.id,
            vendorId,
            type: 'subscription',
            amount,
            timestamp: admin.database.ServerValue.TIMESTAMP,
            priority: 'high'
        });
        res.status(201).json({
            success: true,
            message: 'Payment proof submitted for verification',
            data: {
                verificationId: verificationRef.id,
                status: 'pending_verification'
            }
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
// Admin verify payment
app.put('/api/admin/payment/verify/:verificationId', authenticateUser, requireAdmin, async (req, res) => {
    try {
        const { verificationId } = req.params;
        const { status, notes } = req.body;
        const adminId = req.user.uid;
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid status'
            });
        }
        // Get verification request
        const verDoc = await db.collection('payment_verifications').doc(verificationId).get();
        if (!verDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Verification request not found'
            });
        }
        const verData = verDoc.data();
        // Update verification
        await db.collection('payment_verifications').doc(verificationId).update({
            status,
            reviewedBy: adminId,
            reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
            notes
        });
        // If approved and it's subscription payment
        if (status === 'approved' && verData.type === 'subscription') {
            // Activate vendor subscription
            const expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + (verData.plan === 'yearly' ? 12 : 1));
            await db.collection('vendors').doc(verData.vendorId).update({
                subscriptionStatus: 'active',
                subscriptionPlan: verData.plan,
                subscriptionExpiry: expiryDate,
                lastPaymentDate: admin.firestore.FieldValue.serverTimestamp()
            });
            // Update real-time
            await realtimeDb.ref(`vendors/${verData.vendorId}/subscription`).set({
                status: 'active',
                plan: verData.plan,
                expiry: expiryDate.getTime()
            });
        }
        res.json({
            success: true,
            message: `Payment ${status} successfully`
        });
    }
    catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});
// ============================================
// REAL-TIME DASHBOARD
// ============================================
app.get('/api/dashboard/realtime', authenticateUser, async (req, res) => {
    var _a, _b, _c;
    try {
        const userId = req.user.uid;
        const userDoc = await db.collection('users').doc(userId).get();
        const userRole = (_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.role;
        let dashboardData = {};
        if (userRole === 'admin') {
            // Admin dashboard
            const [totalUsers, totalOrders, totalProducts, pendingApplications, pendingListings, activeChats] = await Promise.all([
                realtimeDb.ref('stats/users/total').once('value'),
                realtimeDb.ref('stats/orders/total').once('value'),
                realtimeDb.ref('stats/products/total').once('value'),
                db.collection('vendor_applications').where('status', '==', 'pending').count().get(),
                db.collection('car_listings').where('status', '==', 'pending_approval').count().get(),
                realtimeDb.ref('admin2/active_chats').once('value')
            ]);
            dashboardData = {
                totalUsers: totalUsers.val() || 0,
                totalOrders: totalOrders.val() || 0,
                totalProducts: totalProducts.val() || 0,
                pendingApplications: pendingApplications.data().count,
                pendingListings: pendingListings.data().count,
                activeChats: activeChats.val() || 0
            };
        }
        else if (userRole === 'vendor') {
            // Vendor dashboard
            const vendorId = userId;
            const [products, orders, subscription, rating] = await Promise.all([
                db.collection('products').where('vendorId', '==', vendorId).count().get(),
                db.collection('orders').where('items.vendorId', '==', vendorId).count().get(),
                realtimeDb.ref(`vendors/${vendorId}/subscription`).once('value'),
                db.collection('vendors').doc(vendorId).get()
            ]);
            dashboardData = {
                totalProducts: products.data().count,
                totalOrders: orders.data().count,
                subscription: subscription.val(),
                rating: ((_b = rating.data()) === null || _b === void 0 ? void 0 : _b.rating) || 0,
                totalSales: ((_c = rating.data()) === null || _c === void 0 ? void 0 : _c.totalSales) || 0
            };
        }
        else if (userRole === 'admin2') {
            // Admin2 (Chat) dashboard
            const [activeConversations, unreadMessages, totalMessages] = await Promise.all([
                db.collection('conversations').where('participants', 'array-contains', userId).count().get(),
                realtimeDb.ref(`users/${userId}/unread_messages`).once('value'),
                realtimeDb.ref('stats/messages/total').once('value')
            ]);
            dashboardData = {
                activeConversations: activeConversations.data().count,
                unreadMessages: unreadMessages.val() || 0,
                totalMessages: totalMessages.val() || 0
            };
        }
        else {
            // Customer dashboard
            const [orders, listings, messages] = await Promise.all([
                db.collection('orders').where('customerId', '==', userId).count().get(),
                db.collection('car_listings').where('userId', '==', userId).count().get(),
                realtimeDb.ref(`users/${userId}/unread_messages`).once('value')
            ]);
            dashboardData = {
                totalOrders: orders.data().count,
                totalListings: listings.data().count,
                unreadMessages: messages.val() || 0
            };
        }
        res.json({
            success: true,
            role: userRole,
            data: dashboardData,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// ============================================
// HEALTH & STATUS
// ============================================
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        message: 'Souk El-Syarat Professional Backend API',
        version: '3.0.0',
        timestamp: new Date().toISOString(),
        features: {
            authentication: 'active',
            realtime: 'active',
            vendorManagement: 'active',
            carListings: 'active',
            chat: 'active',
            search: 'enhanced',
            payments: 'cod_instapay',
            dashboard: 'realtime'
        }
    });
});
app.get('/', (req, res) => {
    res.redirect('/health');
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.path
    });
});
// ============================================
// FIREBASE FUNCTIONS EXPORTS
// ============================================
// Main API with increased resources
exports.api = functions
    .region('us-central1')
    .runWith({
    timeoutSeconds: 300,
    memory: '2GB'
})
    .https.onRequest(app);
// Real-time triggers
exports.onUserCreated = functions
    .region('us-central1')
    .auth.user()
    .onCreate(async (user) => {
    // Create user profile
    await db.collection('users').doc(user.uid).set({
        email: user.email,
        displayName: user.displayName || 'User',
        role: 'customer',
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    // Update stats
    await realtimeDb.ref('stats/users/total').transaction((current) => (current || 0) + 1);
    console.log('User created:', user.email);
});
exports.onOrderStatusUpdate = functions
    .region('us-central1')
    .firestore.document('orders/{orderId}')
    .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (before.orderStatus !== after.orderStatus) {
        // Update real-time tracking
        await realtimeDb.ref(`orders/${context.params.orderId}/timeline`).push({
            status: after.orderStatus,
            timestamp: Date.now(),
            message: `Order status updated to ${after.orderStatus}`
        });
        // Notify customer
        await realtimeDb.ref(`users/${after.customerId}/notifications`).push({
            type: 'order_status_update',
            orderId: context.params.orderId,
            newStatus: after.orderStatus,
            timestamp: admin.database.ServerValue.TIMESTAMP
        });
    }
});
exports.onNewMessage = functions
    .region('us-central1')
    .database.ref('/chats/{conversationId}/messages/{messageId}')
    .onCreate(async (snapshot, context) => {
    const message = snapshot.val();
    // Update unread counter
    await realtimeDb.ref(`users/${message.receiverId}/unread_messages`)
        .transaction((current) => (current || 0) + 1);
    // Update stats
    await realtimeDb.ref('stats/messages/total')
        .transaction((current) => (current || 0) + 1);
});
// Scheduled functions
exports.checkSubscriptions = functions
    .region('us-central1')
    .pubsub.schedule('0 0 * * *') // Daily at midnight
    .timeZone('Africa/Cairo')
    .onRun(async () => {
    // Check vendor subscriptions
    const expiredSnapshot = await db.collection('vendors')
        .where('subscriptionExpiry', '<=', new Date())
        .where('subscriptionStatus', '==', 'active')
        .get();
    for (const doc of expiredSnapshot.docs) {
        await doc.ref.update({
            subscriptionStatus: 'expired',
            isActive: false
        });
        // Notify vendor
        await realtimeDb.ref(`vendors/${doc.id}/notifications`).push({
            type: 'subscription_expired',
            timestamp: admin.database.ServerValue.TIMESTAMP
        });
    }
    console.log(`Checked ${expiredSnapshot.size} expired subscriptions`);
});
console.log('🚀 Professional Backend API v3.0 initialized');
//# sourceMappingURL=index.js.map