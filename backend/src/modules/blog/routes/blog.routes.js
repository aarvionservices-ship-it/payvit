const express = require('express');
const BlogController = require('../controller/blog.controller');

const router = express.Router();

// Public routes
router.get('/', BlogController.getBlogs);
router.get('/id/:id', BlogController.getBlogById);
router.get('/:slug', BlogController.getBlogBySlug);
router.post('/:id/comments', BlogController.addComment);

// Protected routes (Admin only)
router.post('/', BlogController.createBlog);
router.put('/:id', BlogController.updateBlog);
router.delete('/:id', BlogController.deleteBlog);
router.put('/:id/comments/:commentId/status', BlogController.updateCommentStatus);

module.exports = router;

