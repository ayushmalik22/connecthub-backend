import express from 'express';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getCurrentUser,
  updateCurrentUser,
} from '../controllers/userController.js';
import authMiddleware from '../middleware/auth.js';
import { upload } from '../utils/cloudinary.js';

const router = express.Router();

/**
 * GET /api/users
 * Get all users (paginated, if supported)
 */
router.get('/', authMiddleware, getAllUsers);

/**
 * GET /api/users/me
 * Get current authenticated user's profile
 */
router.get('/me', authMiddleware, getCurrentUser);

/**
 * PUT /api/users/me
 * Update current authenticated user's profile (avatar + bio)
 */
router.put('/me', authMiddleware, upload.single('file'), updateCurrentUser);

/**
 * GET /api/users/:id
 * Get a specific user by ID
 */
router.get('/:id', authMiddleware, getUserById);

/**
 * PUT /api/users/:id
 * Update user profile
 */
router.put('/:id', authMiddleware, updateUser);

/**
 * DELETE /api/users/:id
 * Delete a user
 */
router.delete('/:id', authMiddleware, deleteUser);

export default router;