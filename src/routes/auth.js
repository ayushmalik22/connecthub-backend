import express from 'express';
import { register, login } from '../controllers/authController.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', register);

/**
 * POST /api/auth/login
 * Login user and receive JWT token
 */
router.post('/login', login);

export default router;