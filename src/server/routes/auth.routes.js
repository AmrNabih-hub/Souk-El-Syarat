import { Router } from 'express';
import { signIn, signUp } from '../services/auth.service.js';

const router = Router();

router.post('/signup', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    const userRecord = await signUp(email, password, displayName);
    res.status(201).json({ uid: userRecord.uid });
  } catch (error) {
    console.error('Error in sign up:', error);
    res.status(400).json({ message: error.message });
  }
});

router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    const token = await signIn(email, password);
    res.status(200).json({ token });
  } catch (error) {
    console.error('Error in sign in:', error);
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

export default router;
