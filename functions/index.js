const {onRequest} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "cloud-functions",
    timestamp: new Date().toISOString()
  });
});

// Products endpoint
app.get("/products", async (req, res) => {
  try {
    const snapshot = await db.collection("products").limit(20).get();
    const products = [];
    snapshot.forEach(doc => {
      products.push({ id: doc.id, ...doc.data() });
    });
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vendors endpoint
app.get("/vendors", async (req, res) => {
  try {
    const snapshot = await db.collection("vendors").limit(20).get();
    const vendors = [];
    snapshot.forEach(doc => {
      vendors.push({ id: doc.id, ...doc.data() });
    });
    res.json({ success: true, vendors });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search endpoint
app.get("/search/products", async (req, res) => {
  try {
    const { q } = req.query;
    const snapshot = await db.collection("products")
      .where("title", ">=", q || "")
      .where("title", "<=", (q || "") + "\uf8ff")
      .limit(20)
      .get();
    
    const products = [];
    snapshot.forEach(doc => {
      products.push({ id: doc.id, ...doc.data() });
    });
    
    res.json({ success: true, query: q, results: products });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export as V2 function
exports.api = onRequest({
  cors: true,
  maxInstances: 10,
  region: "us-central1"
}, app);
