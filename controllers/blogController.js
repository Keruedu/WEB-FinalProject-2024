const Blog = require('../models/blog');

// Get all blogs
exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().populate('author');
    res.render('blog-grids', { blogs });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// Get blog by ID
exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate('author');
    res.render('blog-details', { blog });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// Create a new blog
exports.createBlog = async (req, res) => {
  try {
    const { imageUrl, date, title, content, author } = req.body;
    const blog = new Blog({ imageUrl, date, title, content, author });
    await blog.save();
    res.redirect('/blogs');
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const ITEMS_PER_PAGE = 10;

// Get blogs by page
exports.getBlogsByPage = async (req, res) => {
  const page = parseInt(req.params.page) || 1;
  try {
    const totalBlogs = await Blog.countDocuments();
    const blogs = await Blog.find()
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE)
      .populate('author');
    res.render('blog-grids', {
      blogs,
      currentPage: page,
      hasNextPage: ITEMS_PER_PAGE * page < totalBlogs,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: Math.ceil(totalBlogs / ITEMS_PER_PAGE)
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
};