const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const dbManager = require('../config/database');

// Get all vehicles with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      make,
      model,
      minPrice,
      maxPrice,
      minYear,
      maxYear,
      location,
      condition,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const connections = await dbManager.initialize();
    let query = connections.db.collection('vehicles');

    // Apply filters
    if (category) query = query.where('category', '==', category);
    if (make) query = query.where('make', '==', make);
    if (model) query = query.where('model', '==', model);
    if (minPrice) query = query.where('price', '>=', parseInt(minPrice));
    if (maxPrice) query = query.where('price', '<=', parseInt(maxPrice));
    if (minYear) query = query.where('year', '>=', parseInt(minYear));
    if (maxYear) query = query.where('year', '<=', parseInt(maxYear));
    if (location) query = query.where('location', '==', location);
    if (condition) query = query.where('condition', '==', condition);

    // Sorting
    const sortDirection = sortOrder === 'desc' ? 'desc' : 'asc';
    query = query.orderBy(sortBy, sortDirection);

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.limit(parseInt(limit)).offset(offset);

    const snapshot = await query.get();
    const vehicles = [];

    snapshot.forEach(doc => {
      vehicles.push({ id: doc.id, ...doc.data() });
    });

    // Get total count for pagination
    const countQuery = connections.db.collection('vehicles');
    const countSnapshot = await countQuery.count().get();
    const totalCount = countSnapshot.data().count;

    res.json({
      success: true,
      vehicles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get vehicle by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connections = await dbManager.initialize();
    const vehicleDoc = await connections.db.collection('vehicles').doc(id).get();

    if (!vehicleDoc.exists) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const vehicle = { id: vehicleDoc.id, ...vehicleDoc.data() };

    // Get seller information
    if (vehicle.sellerId) {
      const sellerDoc = await connections.db.collection('users').doc(vehicle.sellerId).get();
      if (sellerDoc.exists) {
        vehicle.seller = {
          id: sellerDoc.id,
          displayName: sellerDoc.data().displayName,
          rating: sellerDoc.data().rating || 0,
          totalSales: sellerDoc.data().totalSales || 0
        };
      }
    }

    res.json({ success: true, vehicle });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new vehicle listing
router.post('/', [
  body('title').trim().isLength({ min: 5, max: 100 }),
  body('description').trim().isLength({ min: 10, max: 1000 }),
  body('price').isInt({ min: 1000 }),
  body('make').trim().isLength({ min: 2, max: 50 }),
  body('model').trim().isLength({ min: 2, max: 50 }),
  body('year').isInt({ min: 1900, max: new Date().getFullYear() + 1 }),
  body('category').isIn(['sedan', 'suv', 'hatchback', 'coupe', 'convertible', 'truck', 'van', 'other']),
  body('condition').isIn(['new', 'used', 'certified']),
  body('location').trim().isLength({ min: 2, max: 100 }),
  body('images').isArray({ min: 1, max: 10 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const vehicleData = {
      ...req.body,
      sellerId: req.body.sellerId, // This should be authenticated user
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      views: 0,
      favorites: 0,
      status: 'pending'
    };

    const vehicleRef = await connections.db.collection('vehicles').add(vehicleData);

    res.json({
      success: true,
      vehicleId: vehicleRef.id,
      message: 'Vehicle listing created successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update vehicle listing
router.put('/:id', [
  body('title').optional().trim().isLength({ min: 5, max: 100 }),
  body('description').optional().trim().isLength({ min: 10, max: 1000 }),
  body('price').optional().isInt({ min: 1000 }),
  body('location').optional().trim().isLength({ min: 2, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const connections = await dbManager.initialize();
    const updates = {
      ...req.body,
      updatedAt: new Date()
    };

    await connections.db.collection('vehicles').doc(id).update(updates);

    res.json({
      success: true,
      message: 'Vehicle listing updated successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete vehicle listing
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connections = await dbManager.initialize();
    await connections.db.collection('vehicles').doc(id).update({
      isActive: false,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Vehicle listing deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get featured vehicles
router.get('/featured/list', async (req, res) => {
  try {
    const connections = await dbManager.initialize();
    const snapshot = await connections.db.collection('vehicles')
      .where('isFeatured', '==', true)
      .where('isActive', '==', true)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const vehicles = [];
    snapshot.forEach(doc => {
      vehicles.push({ id: doc.id, ...doc.data() });
    });

    res.json({ success: true, vehicles });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;