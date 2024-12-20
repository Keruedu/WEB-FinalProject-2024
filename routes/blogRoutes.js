const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { ensureAuthenticated } = require('../middlewares/auth');

//router.get('/blog-grids', blogController.getAllBlogs);
//router.get('/search', blogController.getBlogs);
router.get('/blogs', blogController.getBlogs);
router.get('/blog/:id', blogController.getBlogById);
router.post('/blog-create', ensureAuthenticated, blogController.createBlog);
router.get('/blog-create', ensureAuthenticated, blogController.renderCreateBlogPage);
router.post('/upload', blogController.uploadImage);

module.exports = router;