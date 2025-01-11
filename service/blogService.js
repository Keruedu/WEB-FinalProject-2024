const Blog = require('../models/blog');
const Tag = require('../models/tag');
const Category = require('../models/category');
const User = require('../models/user');
const mongoose = require('mongoose');
const { buildBlogQuery } = require('../utils/queryBuilder');
const { paginateAndSortBlogs } = require('../utils/paginator');
const { ITEMS_PER_PAGE } = require('../utils/constants');
const ejs = require('ejs');
const path = require('path');
const Comment = require('../models/comment');
const { timeAgo } = require('../utils/dateMoment');

const getBlogsHandler = async (req, userId, bookmarked) => {
  const { search, tags, category, timeRange, status = 'approved' } = req.query;
  const filter = req.query.filter || 'latest';
  const url = req.url;
  const page = parseInt(req.query.page) || 1;

  try {
    // Build query using utility function
    const query = await buildBlogQuery({ search, category, tags, timeRange, userId, bookmarked, status: status === 'All' ? undefined : status });

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
      timeRange,
      status
    };
  } catch (error) {
    console.error('Error in getBlogsHandler:', error);
    throw new Error('Internal Server Error');
  }
};

module.exports = { getBlogsHandler };

const renderBlogsHtml = async (blogs, user) => {
  try {
    return await ejs.renderFile(
      path.join(__dirname, '../views/partials/blogs.ejs'),
      { blogs, user }
    );
  } catch (err) {
    console.error('Error rendering blogsHtml:', err);
    throw err;
  }
};

const renderPaginationHtml = async (page, totalBlogs, url) => {
  try {
    return await ejs.renderFile(
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
  } catch (err) {
    console.error('Error rendering paginationHtml:', err);
    throw err;
  }
};

const createBlog = async (req, session) => {
  const { title, content, category, tags: rawTags, isPremium } = req.body;

  // Validate input
  if (!title || !content || !category || !req.file) {
    return {
      errors: {
        title: !title ? 'Title is required' : undefined,
        content: !content ? 'Content is required' : undefined,
        category: !category ? 'Category is required' : undefined,
        image: !req.file ? 'Image is required' : undefined,
      },
    };
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
    isPremium: req.user.role === 'admin' && isPremium === 'on', // Set isPremium if user is admin
  });

  await newBlog.save({ session });

  return { success_msg: 'Blog created successfully', blog: newBlog };
};

const updateBlog = async (req, session) => {
  const blogId = req.params.id;
  const { title, content, category, tags: rawTags, isPremium } = req.body;

  // Validate input
  if (!title || !content || !category) {
    return {
      errors: {
        title: !title ? 'Title is required' : undefined,
        content: !content ? 'Content is required' : undefined,
        category: !category ? 'Category is required' : undefined,
      },
    };
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
      status: 'pending',
      ...(imageUrl && { imageUrl }), // Only update imageUrl if a new image is uploaded
      ...(req.user.role === 'admin' && { isPremium: isPremium === 'on' }), // Update isPremium if user is admin
    },
    { new: true, session }
  );

  return { success_msg: 'Blog updated successfully', blog: updatedBlog };
};

const deleteBlogs = async (blogIds) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Kiểm tra nếu không có blogIds hoặc blogIds không phải là một mảng
    if (!Array.isArray(blogIds) || blogIds.length === 0) {
      throw new Error('No Blog IDs provided');
    }

    // Kiểm tra tính hợp lệ của từng blogId
    for (const blogId of blogIds) {
      if (!mongoose.Types.ObjectId.isValid(blogId)) {
        throw new Error(`Invalid Blog ID: ${blogId}`);
      }
    }

    // Kiểm tra sự tồn tại của từng blog
    const blogs = await Blog.find({ _id: { $in: blogIds } }).session(session);
    if (blogs.length !== blogIds.length) {
      throw new Error('One or more Blogs not found');
    }

    // Xóa các bình luận liên quan đến các blog
    await Comment.deleteMany({ blog: { $in: blogIds } }).session(session);

    // Cập nhật bookmark của người dùng
    await User.updateMany(
      { bookmarks: { $in: blogIds } },
      { $pull: { bookmarks: { $in: blogIds } } }
    ).session(session);

    // Xóa các blog
    await Blog.deleteMany({ _id: { $in: blogIds } }).session(session);

    // Commit transaction
    await session.commitTransaction();
    return { success: true, message: 'Blogs and related comments deleted successfully' };
  } catch (error) {
    await session.abortTransaction();
    return { success: false, message: error.message };
  } finally {
    session.endSession();
  }
};

const createComment = async (req) => {
  const { content, blogId } = req.body;
  const author = req.user._id;

  if (!content || !blogId) {
    return { success: false, error: req.body };
  }

  const newComment = new Comment({
    content,
    author,
    blog: blogId
  });

  await newComment.save();
  await newComment.populate('author', 'username avatar');
  const timeRange = timeAgo(newComment.createdAt);

  return { success: true, comment: newComment, timeRange };
};

const getComments = async (req) => {
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

  return {
    success: true,
    comments: commentsWithRelativeTime,
    totalComments,
    totalPages: Math.ceil(totalComments / limit),
    currentPage: page
  };
};

const deleteComment = async (commentId) => {
  await Comment.findByIdAndDelete(commentId);
  return { success: true, message: 'Comment deleted successfully' };
};

const changeStatusBlogs = async (blogIds, status) => {
  try {
    await Blog.updateMany(
      { _id: { $in: blogIds } },
      { $set: { status: status } }
    );
  } catch (error) {
    console.error('Error in changeStatusBlogs:', error);
    throw new Error('Internal Server Error');
  }
};

const changeBlogStatus = async (blogId, status) => {
  try {
    const result = await Blog.findByIdAndUpdate(blogId, { status: status }, { new: true });
    if (!result) {
      throw new Error('Blog not found or status not updated');
    }
  } catch (error) {
    console.error('Error in changeBlogStatus:', error);
    throw new Error('Internal Server Error');
  }
};

module.exports = {
  getBlogsHandler,
  renderBlogsHtml,
  renderPaginationHtml,
  createBlog,
  updateBlog,
  deleteBlogs,
  createComment,
  getComments,
  deleteComment,
  changeStatusBlogs,
  changeBlogStatus
};