const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');


router.get('/', blogController.getAllBlogs);
router.get('/:id', blogController.getBlogById);
router.post('/', blogController.createBlog);

module.exports = router;