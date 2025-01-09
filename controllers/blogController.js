const Blog = require('../models/blog');
const User = require('../models/user');
const Tag = require('../models/tag');
const Category = require('../models/category');
const path = require('path');
const ejs = require('ejs');
const upload = require('../config/cloudinary');
const mongoose = require('mongoose');
const { buildBlogQuery } = require('../utils/queryBuilder');
const { ITEMS_PER_PAGE } = require('../utils/constants');
const Comment = require('../models/comment');
const { timeAgo } = require('../utils/dateMoment');
const blogService = require('../service/blogService');

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
    const result = await blogService.createBlog(req, session);
    if (result.errors) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json(result);
    }
    await session.commitTransaction();
    session.endSession();
    res.status(201).json(result);
  } catch (error) {
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

exports.updateBlog = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const result = await blogService.updateBlog(req, session);
    if (result.errors) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json(result);
    }
    await session.commitTransaction();
    session.endSession();
    res.status(200).json(result);
  } catch (error) {
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

exports.deleteBlogs = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const result = await blogService.deleteBlogs(req.body.ids, session);
    if (!result.success) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json(result);
    }
    await session.commitTransaction();
    session.endSession();
    res.status(200).json(result);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error deleting blogs:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

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
    } = await blogService.getBlogsHandler(req);

    if (req.xhr) {
      const blogsHtml = await blogService.renderBlogsHtml(blogs, req.user);
      const paginationHtml = await blogService.renderPaginationHtml(page, totalBlogs, url);
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
    } = await blogService.getBlogsHandler(req, userId);

    if (req.xhr) {
      const blogsHtml = await blogService.renderBlogsHtml(blogs, req.user);
      const paginationHtml = await blogService.renderPaginationHtml(page, totalBlogs, url);
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

exports.getBookmarkedBlogs = async (req, res) => {
  try {
    const userId = req.user._id;
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
    } = await blogService.getBlogsHandler(req, userId, req.user.bookmarks);

    if (req.xhr) {
      const blogsHtml = await blogService.renderBlogsHtml(blogs, req.user);
      const paginationHtml = await blogService.renderPaginationHtml(page, totalBlogs, url);
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
    console.error('Error fetching bookmarked blogs:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

// Create a new comment
exports.createComment = async (req, res) => {
  try {
    const result = await blogService.createComment(req);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get comments for a blog
exports.getComments = async (req, res) => {
  try {
    const result = await blogService.getComments(req);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete a comment
exports.deleteComment = async (req, res) => {
  try {
    const result = await blogService.deleteComment(req.params.commentId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Render create blog page
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
    const result = await blogService.updateBlog(req, session);
    if (result.errors) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json(result);
    }
    await session.commitTransaction();
    session.endSession();
    res.status(200).json(result);
  } catch (error) {
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