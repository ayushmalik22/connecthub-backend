import Post from '../models/Post.js';
import User from '../models/User.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

/**
 * Create a new post
 * POST /api/posts
 */
export const createPost = async (req, res) => {
  try {
    const { content } = req.body;
    const userId = req.user.id;
    
    // --- NEW LINES START: Cloudinary & Multer File Interception ---
    let mediaUrl = req.body.mediaUrl || '';
    let mediaType = req.body.mediaType || 'none';

    if (req.file) {
      const isVideo = req.file.mimetype.startsWith('video/');
      mediaType = isVideo ? 'video' : 'image';

      // Import statement dynamically or assume uploadToCloudinary is imported at the top
      // If not imported at the top, make sure to add: import { uploadToCloudinary } from '../utils/cloudinary.js';
      const uploadResult = await uploadToCloudinary(req.file.buffer);
      mediaUrl = uploadResult.secure_url;
    }
    // --- NEW LINES END ---

    // Validation
    if (!content && !mediaUrl) {
      return res.status(400).json({
        success: false,
        message: 'Post must have either content or media',
      });
    }

    // Create new post
    const newPost = new Post({
      user: userId,
      content: content || '',
      mediaUrl: mediaUrl,       // Updated to use our new variable
      mediaType: mediaType,     // Updated to use our new variable
      likes: [],
    });

    await newPost.save();

    // Populate user data (only username for efficiency)
    await newPost.populate('user', 'username email avatarUrl bio');

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: newPost,
    });
  } catch (error) {
    console.error('Error creating post:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error creating post',
      error: error.message,
    });
  }
};

/**
 * Get all posts
 * GET /api/posts
 */
export const getAllPosts = async (req, res) => {
  try {
    // Fetch all posts, populate user data, sort by newest first
    const posts = await Post.find()
      .populate('user', 'username email avatarUrl bio')
      .populate('likes', 'username avatarUrl')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: posts,
      count: posts.length,
    });
  } catch (error) {
    console.error('Error fetching posts:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching posts',
      error: error.message,
    });
  }
};

/**
 * Get posts from followed users (Feed)
 * GET /api/posts/feed
 */
export const getFeed = async (req, res) => {
  try {
    const userId = req.user.id;

    // For now, return all posts (feed can be enhanced with follower logic later)
    const posts = await Post.find()
      .populate('user', 'username email avatarUrl bio')
      .populate('likes', 'username avatarUrl')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: posts,
      count: posts.length,
    });
  } catch (error) {
    console.error('Error fetching feed:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching feed',
      error: error.message,
    });
  }
};

/**
 * Get posts by a specific user
 * GET /api/posts/user/:userId
 */
export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;

    const posts = await Post.find({ user: userId })
      .populate('user', 'username email avatarUrl bio')
      .populate('likes', 'username avatarUrl')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: posts,
      count: posts.length,
    });
  } catch (error) {
    console.error('Error fetching user posts:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching user posts',
      error: error.message,
    });
  }
};

/**
 * Get a single post by ID
 * GET /api/posts/:id
 */
export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id)
      .populate('user', 'username email avatarUrl bio')
      .populate('likes', 'username avatarUrl');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error('Error fetching post:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching post',
      error: error.message,
    });
  }
};

/**
 * Toggle like on a post
 * PUT /api/posts/:id/like
 */
export const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Check if user already liked this post
    const likeIndex = post.likes.indexOf(userId);

    if (likeIndex > -1) {
      // User already liked - remove the like (unlike)
      post.likes.splice(likeIndex, 1);
    } else {
      // User hasn't liked - add the like
      post.likes.push(userId);
    }

    await post.save();

    // Populate for response
    await post.populate('user', 'username email avatarUrl bio');
    await post.populate('likes', 'username avatarUrl');

    res.status(200).json({
      success: true,
      message: likeIndex > -1 ? 'Post unliked' : 'Post liked',
      data: post,
    });
  } catch (error) {
    console.error('Error liking post:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error liking post',
      error: error.message,
    });
  }
};

/**
 * Delete a post
 * DELETE /api/posts/:id
 */
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Check if user is the post author
    if (post.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own posts',
      });
    }

    await Post.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting post:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error deleting post',
      error: error.message,
    });
  }
};

/**
 * Update a post
 * PUT /api/posts/:id
 */
export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { content, mediaUrl, mediaType } = req.body;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Check if user is the post author
    if (post.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own posts',
      });
    }

    // Update fields
    if (content) post.content = content;
    if (mediaUrl) post.mediaUrl = mediaUrl;
    if (mediaType) post.mediaType = mediaType;

    await post.save();

    // Populate for response
    await post.populate('user', 'username email avatarUrl bio');
    await post.populate('likes', 'username avatarUrl');

    res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      data: post,
    });
  } catch (error) {
    console.error('Error updating post:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error updating post',
      error: error.message,
    });
  }
};

/**
 * Get all comments for a post
 * GET /api/posts/:id/comments
 */
export const getComments = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id).populate('comments.user', 'username avatarUrl');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    res.status(200).json({
      success: true,
      data: post.comments,
      count: post.comments.length,
    });
  } catch (error) {
    console.error('Error fetching comments:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching comments',
      error: error.message,
    });
  }
};

/**
 * Create a new comment on a post
 * POST /api/posts/:id/comment
 */
export const createComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // Validation
    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required',
      });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Add new comment
    const newComment = {
      user: userId,
      content: content.trim(),
      createdAt: new Date(),
    };

    post.comments.push(newComment);
    await post.save();

    // Get the newly added comment (last one in array)
    const addedComment = post.comments[post.comments.length - 1];
    await addedComment.populate('user', 'username avatarUrl');

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: addedComment,
    });
  } catch (error) {
    console.error('Error creating comment:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error creating comment',
      error: error.message,
    });
  }
};

/**
 * Delete a comment from a post
 * DELETE /api/posts/:id/comments/:commentId
 */
export const deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const userId = req.user.id;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Find the comment
    const commentIndex = post.comments.findIndex(
      (comment) => comment._id.toString() === commentId
    );

    if (commentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    const comment = post.comments[commentIndex];

    // Check if user is the comment author or post owner
    if (comment.user.toString() !== userId && post.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments or comments on your posts',
      });
    }

    // Remove the comment
    post.comments.splice(commentIndex, 1);
    await post.save();

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting comment:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error deleting comment',
      error: error.message,
    });
  }
};
