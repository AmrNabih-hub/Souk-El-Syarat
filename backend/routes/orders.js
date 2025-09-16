const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const dbManager = require('../config/database');

// Create new order
router.post('/', [
  body('vehicleId').notEmpty(),
  body('buyerId').notEmpty(),
  body('sellerId').notEmpty(),
  body('price').isInt({ min: 1000 }),
  body('contactInfo').isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const connections = await dbManager.initialize();
    const orderData = {
      ...req.body,
      orderNumber: `ORD-${Date.now()}`,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const orderRef = await connections.db.collection('orders').add(orderData);

    // Update vehicle status
    await connections.db.collection('vehicles').doc(req.body.vehicleId).update({
      status: 'reserved',
      updatedAt: new Date()
    });

    res.json({
      success: true,
      orderId: orderRef.id,
      orderNumber: orderData.orderNumber,
      message: 'Order created successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connections = await dbManager.initialize();
    const orderDoc = await connections.db.collection('orders').doc(id).get();

    if (!orderDoc.exists) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = { id: orderDoc.id, ...orderDoc.data() };

    // Get related data
    const [vehicleDoc, buyerDoc, sellerDoc] = await Promise.all([
      connections.db.collection('vehicles').doc(order.vehicleId).get(),
      connections.db.collection('users').doc(order.buyerId).get(),
      connections.db.collection('users').doc(order.sellerId).get()
    ]);

    if (vehicleDoc.exists) order.vehicle = vehicleDoc.data();
    if (buyerDoc.exists) order.buyer = buyerDoc.data();
    if (sellerDoc.exists) order.seller = sellerDoc.data();

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's orders
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type = 'all' } = req.query; // 'buyer', 'seller', or 'all'

    const connections = await dbManager.initialize();
    let orders = [];

    if (type === 'buyer') {
      const snapshot = await connections.db.collection('orders')
        .where('buyerId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();
      snapshot.forEach(doc => orders.push({ id: doc.id, ...doc.data() }));
    } else if (type === 'seller') {
      const snapshot = await connections.db.collection('orders')
        .where('sellerId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();
      snapshot.forEach(doc => orders.push({ id: doc.id, ...doc.data() }));
    } else {
      const [buyerSnapshot, sellerSnapshot] = await Promise.all([
        connections.db.collection('orders').where('buyerId', '==', userId).get(),
        connections.db.collection('orders').where('sellerId', '==', userId).get()
      ]);
      const map = new Map();
      buyerSnapshot.forEach(doc => map.set(doc.id, { id: doc.id, ...doc.data() }));
      sellerSnapshot.forEach(doc => map.set(doc.id, { id: doc.id, ...doc.data() }));
      orders = Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt);
    }

    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update order status
router.put('/:id/status', [
  body('status').isIn(['pending', 'confirmed', 'processing', 'completed', 'cancelled'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status } = req.body;
    const connections = await dbManager.initialize();

    await connections.db.collection('orders').doc(id).update({
      status,
      updatedAt: new Date()
    });

    // If order is completed, update vehicle status
    if (status === 'completed') {
      const order = await connections.db.collection('orders').doc(id).get();
      await connections.db.collection('vehicles').doc(order.data().vehicleId).update({
        status: 'sold',
        updatedAt: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Order status updated successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;