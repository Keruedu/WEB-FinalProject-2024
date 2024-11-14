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
    const blog = new Blog({ imageUrl, date, title, content, author, views: 0 });
    await blog.save();
    res.redirect('/blogs');
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const ITEMS_PER_PAGE = 9;

// search filter pagination
const getBlogsHandler = async (req, res, pageParam) => {
  const { search, filter } = req.query;
  const page = parseInt(pageParam) || 1;
  let query = {};

  if (search) {
    query.title = { $regex: search, $options: 'i' }; // Tìm kiếm theo tiêu đề, không phân biệt chữ hoa chữ thường
  }

  let sort = {};
  if (filter === 'latest') {
    sort.date = -1;
  } else if (filter === 'oldest') {
    sort.date = 1;
  } else if (filter === 'popular') {
    sort.views = -1; // Giả sử bạn có trường 'views' để lưu số lượt xem
  }

  try {
    const totalBlogs = await Blog.countDocuments(query);
    const blogs = await Blog.find(query)
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE)
      .sort(sort)
      .populate('author');
    res.render('blog-grids', {
      blogs,
      currentPage: page,
      hasNextPage: ITEMS_PER_PAGE * page < totalBlogs,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: Math.ceil(totalBlogs / ITEMS_PER_PAGE),
      search,
      filter
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// Get blogs with search and filter
exports.getBlogs = (req, res) => {
  getBlogsHandler(req, res, req.query.page);
};


// Get blogs by page
exports.getBlogsByPage = (req, res) => {
  getBlogsHandler(req, res, req.params.page);
};