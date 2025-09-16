import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// This is a protected route.
// The `protect` middleware will verify the user's token before allowing access.
router.get('/profile', protect, (req, res) => {
  // Thanks to the `protect` middleware, we have the user's details in `req.user`.
  res.status(200).json({
    message: `Welcome, ${req.user.name || req.user.email}!`,
    user: req.user,
  });
});

export default router;
