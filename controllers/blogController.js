const Blog = require('../models/blog');
const Tag = require('../models/tag');
const Category = require('../models/category');
// Get all blogs
exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find()
    .populate('author')
    .populate('category')
    .populate('tags');
    res.render('blog-grids', { blogs });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// Get blog by ID
exports.getBlogById = async (req, res) => {
  try {
    const blogId = req.params.id;
    const blog = await Blog.findById(blogId)
    .populate('author')
    .populate('category')
    .populate('tags');
    
    const relatedBlogs = await Blog.find({
      tags: { $in: blog.tags },
      _id: { $ne: blogId }
    }).limit(3).populate('category'); 

    res.render('blog-details', { blog, relatedBlogs });

  } catch (error) {
    res.status(500).send(error.message);
  }
};

// Create a new blog
exports.createBlog = async (req, res) => {
  try {
    const { imageUrl, date, title, content, author } = req.body;
    const blog = new Blog({ imageUrl, date, title, content, author, views: 0, tags});
    await blog.save();
    res.redirect('/blogs');
  } catch (error) {
    res.status(500).send(error.message);
  }
};

const ITEMS_PER_PAGE = 9;

// search filter pagination
const getBlogsHandler = async (req, res, pageParam) => {
  const { search, filter, tags, category } = req.query;
  const page = parseInt(pageParam) || 1;
  let query = {};
  console.log('req.query:', req.query);
  if (search) {
    query = {
      $or: [
        { title: { $regex: search, $options: 'i' } }, // Tìm kiếm theo tiêu đề, không phân biệt chữ hoa chữ thường
        { content: { $regex: search, $options: 'i' } } // Tìm kiếm theo nội dung, không phân biệt chữ hoa chữ thường
      ]
    };
  }
  if (category) {
    query.category = category;
  }
  let tagsArray = [];
  if (tags && tags.length > 0) {
    tagsArray = Array.isArray(tags) ? tags : [tags];
    query.tags = { $in: tagsArray };
  }

  let sort = {};
  if (filter === 'latest') {
    sort.date = -1;
  } else if (filter === 'oldest') {
    sort.date = 1;
  } else if (filter === 'popular') {
    sort.views = -1; 
  }

  
  try {
    const totalBlogs = await Blog.countDocuments(query);
    const blogs = await Blog.find(query)
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE)
      .sort(sort)
      .populate('author')
      .populate('category')
      .populate('tags');

    const allCategories = await Category.find();
    const allTags = await Tag.find(); 
    res.render('blog-grids', {
      blogs,
      currentPage: page,
      hasNextPage: ITEMS_PER_PAGE * page < totalBlogs,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: Math.ceil(totalBlogs / ITEMS_PER_PAGE),
      search,
      filter,
      tags: allTags,
      categories: allCategories,
      selectedTags: tagsArray || [],
      selectedCategory: category || ''
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