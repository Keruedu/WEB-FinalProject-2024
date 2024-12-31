const Blog = require('../models/blog');
const Tag = require('../models/tag');
const Category = require('../models/category');
const path = require('path');
const ejs = require('ejs');
const upload = require('../config/cloudinary');
const mongoose = require('mongoose');
const { buildBlogQuery } = require('../utils/queryBuilder');
const { paginateAndSortBlogs } = require('../utils/paginator');
const { ITEMS_PER_PAGE } = require('../utils/constants');
const Comment = require('../models/comment');
const { timeAgo } = require('../utils/dateMoment');

// Endpoint để xử lý ảnh tải lên
exports.uploadImage = (req, res) => {
  upload.single('upload')(req, res, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json({
      url: req.file.path // URL của ảnh đã tải lên
    });
  });
};

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

exports.getBlogById = async (req, res) => {
  try {
    const blogId = req.params.id;

    await Blog.findByIdAndUpdate(blogId, { $inc: { views: 1 } });
    const blog = await Blog.findById(blogId)
      .populate('author')
      .populate('category')
      .populate('tags');

    const relatedBlogs = await Blog.find({
      tags: { $in: blog.tags },
      _id: { $ne: blogId }
    }).limit(3).populate('category');

    res.render('blog-details', { 
      blog, 
      relatedBlogs,
    });

  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.createBlog = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { title, content, category, tags: rawTags } = req.body;

    // Validate input
    if (!title || !content || !category || !req.file) {
      return res.status(400).json({
        errors: {
          title: !title ? 'Title is required' : undefined,
          content: !content ? 'Content is required' : undefined,
          category: !category ? 'Category is required' : undefined,
          image: !req.file ? 'Image is required' : undefined,
        },
      });
    }

    // Parse and sanitize tags (if provided)
    const tags = rawTags
      ? rawTags.split(',').map(tag => tag.trim()).filter(tag => tag) // Remove empty strings
      : [];

    // Get image URL from Cloudinary
    const imageUrl = req.file.path;

    // Process tags if provided
    let allTagIds = [];
    if (tags.length > 0) {
      const existingTags = await Tag.find({ name: { $in: tags } }).session(session);
      const existingTagNames = existingTags.map(tag => tag.name);

      // Create new tags if necessary
      const newTagNames = tags.filter(tagName => !existingTagNames.includes(tagName));
      let newTagDocs = [];
      if (newTagNames.length > 0) {
        newTagDocs = await Tag.insertMany(
          newTagNames.map(name => ({ name })),
          { session }
        );
      }

      // Combine all tag IDs
      allTagIds = [
        ...existingTags.map(tag => tag._id),
        ...newTagDocs.map(tag => tag._id),
      ];
    }

    // Create new blog
    const newBlog = new Blog({
      title,
      content,
      imageUrl,
      category,
      tags: allTagIds, // Can be empty
      author: req.user._id,
      views: 0,
    });

    await newBlog.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ success_msg: 'Blog created successfully', blog: newBlog });
  } catch (error) {
    // Rollback transaction on error
    await session.abortTransaction();
    session.endSession();

    console.error('Error creating blog:', error);

    res.status(500).json({
      errors: {
        server: 'An error occurred while creating the blog. Please try again later.',
        details: error.message,
      },
    });
  }
};



const getBlogsHandler = async (req, userId) => {
  const { search, tags, category, timeRange } = req.query;
  const filter = req.query.filter || 'latest';
  const url = req.url;
  const page = parseInt(req.query.page) || 1;

  try {
    // Build query using utility function
    const query = buildBlogQuery({ search, category, tags, timeRange, userId });

    // Add user filter if userId is provided
    if (userId) {
      query.author = userId;
    }

    // Determine sort order
    const sort =
      filter === 'latest' ? { createdAt: -1 } :
      filter === 'oldest' ? { createdAt: 1 } :
      filter === 'popular' ? { views: -1 } : {};

    // Fetch paginated and sorted blogs
    const { blogs, totalBlogs } = await paginateAndSortBlogs(query, page, sort, ITEMS_PER_PAGE);

    // Fetch categories and tags
    const [allCategories, allTags] = await Promise.all([
      Category.find(),
      Tag.find()
    ]);

    return {
      blogs,
      totalBlogs,
      allCategories,
      allTags,
      page,
      url,
      search,
      filter,
      tags,
      category,
      timeRange
    };
  } catch (error) {
    console.error('Error in getBlogsHandler:', error);
    throw new Error('Internal Server Error');
  }
};

// Get blogs with search and filter
exports.getBlogs = async (req, res) => {
  try {
    const {
      blogs,
      totalBlogs,
      allCategories,
      allTags,
      page,
      url,
      search,
      filter,
      tags,
      category,
      timeRange
    } = await getBlogsHandler(req);

    if (req.xhr) {
      const blogsHtml = await ejs.renderFile(
        path.join(__dirname, '../views/partials/blogs.ejs'),
        { blogs }
      );

      const paginationHtml = await ejs.renderFile(
        path.join(__dirname, '../views/partials/pagination.ejs'),
        {
          currentPage: page,
          hasNextPage: ITEMS_PER_PAGE * page < totalBlogs,
          hasPreviousPage: page > 1,
          nextPage: page + 1,
          previousPage: page - 1,
          lastPage: Math.ceil(totalBlogs / ITEMS_PER_PAGE),
          oldUrl: url,
        }
      );

      return res.status(200).json({ blogsHtml, paginationHtml });
    } else {
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
        selectedTags: tags || [],
        selectedCategory: category || '',
        timeRange: timeRange || '',
      });
    }
  } catch (error) {
    console.error('Error in getBlogs:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

// Get user's blogs
exports.getUserBlogs = async (req, res) => {
  try {
    const userId = req.user._id; // Assuming req.user contains the authenticated user's info
    const {
      blogs,
      totalBlogs,
      allCategories,
      allTags,
      page,
      url,
      search,
      filter,
      tags,
      category,
      timeRange
    } = await getBlogsHandler(req, userId);

    if (req.xhr) {
      const blogsHtml = await ejs.renderFile(
        path.join(__dirname, '../views/partials/blogs.ejs'),
        { blogs }
      );

      const paginationHtml = await ejs.renderFile(
        path.join(__dirname, '../views/partials/pagination.ejs'),
        {
          currentPage: page,
          hasNextPage: ITEMS_PER_PAGE * page < totalBlogs,
          hasPreviousPage: page > 1,
          nextPage: page + 1,
          previousPage: page - 1,
          lastPage: Math.ceil(totalBlogs / ITEMS_PER_PAGE),
          oldUrl: url,
        }
      );

      return res.status(200).json({ blogsHtml, paginationHtml });
    } else {
      res.render('my-blogs', {
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
        selectedTags: tags || [],
        selectedCategory: category || '',
        timeRange: timeRange || '',
      });
    }
  } catch (error) {
    console.error('Error fetching user blogs:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};


// Create a new blog
exports.renderCreateBlogPage = async (req, res) => {
  try {
    const categories = await Category.find();
    const tags = await Tag.find();
    res.render('blog-create', { categories, tags });
  } catch (error) {
    console.error('Error rendering create blog page:', error);
    res.status(500).send('Internal Server Error');
  }
};


// Get blog for editing
exports.getEditBlog = async (req, res) => {
  try {
    const blogId = req.params.id;
    const blog = await Blog.findById(blogId).populate('category').populate('tags');
    const categories = await Category.find();
    const tags = await Tag.find();

    if (!blog) {
      return res.status(404).send('Blog not found');
    }

    res.render('my-blogs-edit', { blog, categories, tags });
  } catch (error) {
    console.error('Error fetching blog for editing:', error);
    res.status(500).send('Internal Server Error');
  }
};

// Update blog
exports.postEditBlog = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const blogId = req.params.id;
    const { title, content, category, tags: rawTags } = req.body;

    // Validate input
    if (!title || !content || !category) {
      return res.status(400).json({
        errors: {
          title: !title ? 'Title is required' : undefined,
          content: !content ? 'Content is required' : undefined,
          category: !category ? 'Category is required' : undefined,
        },
      });
    }

    // Parse and sanitize tags (if provided)
    const tags = rawTags
      ? rawTags.split(',').map(tag => tag.trim()).filter(tag => tag) // Remove empty strings
      : [];

    // Get image URL from Cloudinary if a new image is uploaded
    let imageUrl;
    if (req.file) {
      imageUrl = req.file.path;
    }

    // Process tags if provided
    let allTagIds = [];
    if (tags.length > 0) {
      const existingTags = await Tag.find({ name: { $in: tags } }).session(session);
      const existingTagNames = existingTags.map(tag => tag.name);

      // Create new tags if necessary
      const newTagNames = tags.filter(tagName => !existingTagNames.includes(tagName));
      let newTagDocs = [];
      if (newTagNames.length > 0) {
        newTagDocs = await Tag.insertMany(
          newTagNames.map(name => ({ name })),
          { session }
        );
      }

      // Combine all tag IDs
      allTagIds = [
        ...existingTags.map(tag => tag._id),
        ...newTagDocs.map(tag => tag._id),
      ];
    }

    // Update blog
    const updatedBlog = await Blog.findByIdAndUpdate(
      blogId,
      {
        title,
        content,
        category,
        tags: allTagIds, // Can be empty
        ...(imageUrl && { imageUrl }), // Only update imageUrl if a new image is uploaded
      },
      { new: true, session }
    );

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ success_msg: 'Blog updated successfully', blog: updatedBlog });
  } catch (error) {
    // Rollback transaction on error
    await session.abortTransaction();
    session.endSession();

    console.error('Error updating blog:', error);

    res.status(500).json({
      errors: {
        server: 'An error occurred while updating the blog. Please try again later.',
        details: error.message,
      },
    });
  }
};

exports.deleteBlog = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const blogId = req.params.id;

    // Xóa các bình luận liên quan đến blog
    await Comment.deleteMany({ blog: blogId });

    // Xóa blog
    await Blog.findByIdAndDelete(blogId);

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ success: true, message: 'Blog and related comments deleted successfully' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ success: false, error: error.message });
  }
};


// Create a new comment
exports.createComment = async (req, res) => {
  try {
    const { content, blogId } = req.body;
    const author = req.user._id;

    if (!content || !blogId) {
      return res.status(400).json({ success: false, error: req.body });
    }

    const newComment = new Comment({
      content,
      author,
      blog: blogId
    });

    await newComment.save();
    await newComment.populate('author', 'username avatar')
    timeRange = timeAgo(newComment.createdAt);

    res.status(201).json({ success: true, comment: newComment, timeRange });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get comments for a blog
exports.getComments = async (req, res) => {
  try {
    const blogId = req.params.blogId;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const comments = await Comment.find({ blog: blogId })
      .populate('author', 'username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalComments = await Comment.countDocuments({ blog: blogId });

    // Chuyển đổi ngày thành khoảng thời gian đã đăng
    const commentsWithRelativeTime = comments.map(comment => ({
      ...comment._doc,
      createdAt: timeAgo(comment.createdAt)
    }));


    res.status(200).json({ 
      success: true, 
      comments: commentsWithRelativeTime, 
      totalComments, 
      totalPages: Math.ceil(totalComments / limit),
      currentPage: page 
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete a comment
exports.deleteComment = async (req, res) => {
  try {
    const commentId = req.params.commentId;
    await Comment.findByIdAndDelete(commentId);

    res.status(200).json({ success: true, message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};