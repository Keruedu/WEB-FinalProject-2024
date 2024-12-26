const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { ensureAuthenticated } = require('../middlewares/auth');
const upload = require('../config/cloudinary');


//router.get('/blog-grids', blogController.getAllBlogs);
//router.get('/search', blogController.getBlogs);
router.get('/blogs', blogController.getBlogs);
router.get('/blogs/:id', blogController.getBlogById);
router.get('/blog-create', ensureAuthenticated, blogController.renderCreateBlogPage);
router.post('/blog-create', ensureAuthenticated, upload.single('image'), blogController.createBlog);
router.post('/upload', blogController.uploadImage);
//my-blogs
router.get('/my-blogs', ensureAuthenticated, blogController.getUserBlogs);
router.get('/my-blogs/:id', ensureAuthenticated, blogController.getEditBlog);
router.post('/my-blogs/:id', ensureAuthenticated, upload.single('image'), blogController.postEditBlog);
router.delete('/my-blogs',ensureAuthenticated, blogController.deleteBlogs);
module.exports = router;