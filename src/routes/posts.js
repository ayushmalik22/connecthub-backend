import express from 'express';
import {
  createPost,
  getAllPosts,
  getFeed,
  getUserPosts,
  getPostById,
  likePost,
  deletePost,
  updatePost,
  getComments,
  createComment,
  deleteComment,
} from '../controllers/postController.js';
import authMiddleware from '../middleware/auth.js';
import { upload } from '../utils/cloudinary.js';

const router = express.Router();

// Apply authentication middleware to all routes in this router
router.use(authMiddleware);

/**
 * POST /api/posts
 * Create a new post (supports optional 'file' upload for image/video)
 */
router.post('/', upload.single('file'), createPost);

/**
 * GET /api/posts
 * Get all posts sorted by newest first
 */
router.get('/', getAllPosts);

/**
 * GET /api/posts/feed
 * Get personalized feed (all posts for now)
 */
router.get('/feed', getFeed);

/**
 * GET /api/posts/user/:userId
 * Get all posts from a specific user
 */
router.get('/user/:userId', getUserPosts);

/**
 * GET /api/posts/:id
 * Get a specific post by ID
 */
router.get('/:id', getPostById);

/**
 * PUT /api/posts/:id/like
 * Toggle like on a post (add/remove from likes array)
 */
router.put('/:id/like', likePost);

/**
 * PUT /api/posts/:id
 * Update a post (only by author)
 */
router.put('/:id', updatePost);

/**
 * DELETE /api/posts/:id
 * Delete a post (only by author)
 */
router.delete('/:id', deletePost);

/**
 * GET /api/posts/:id/comments
 * Get all comments for a post
 */
router.get('/:id/comments', getComments);

/**
 * POST /api/posts/:id/comment
 * Create a new comment on a post
 */
router.post('/:id/comment', createComment);

/**
 * DELETE /api/posts/:id/comments/:commentId
 * Delete a comment from a post
 */
router.delete('/:id/comments/:commentId', deleteComment);

export default router;
