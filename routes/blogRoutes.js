const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { ensureAuthenticated } = require('../middlewares/auth');
const upload = require('../config/cloudinary');


//router.get('/blog-grids', blogController.getAllBlogs);
//router.get('/search', blogController.getBlogs);
router.get('/blogs', blogController.getBlogs);
router.get('/blog/:id', blogController.getBlogById);
router.get('/blog-create', ensureAuthenticated, blogController.renderCreateBlogPage);
router.post('/blog-create', ensureAuthenticated, upload.single('image'), blogController.createBlog);
router.post('/upload', blogController.uploadImage);

module.exports = router;