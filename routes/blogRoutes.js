const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');


//router.get('/blog-grids', blogController.getAllBlogs);
//router.get('/search', blogController.getBlogs);
router.get('/blogs', blogController.getBlogs);
router.get('/blog/:id', blogController.getBlogById);
router.post('/', blogController.createBlog);


module.exports = router;