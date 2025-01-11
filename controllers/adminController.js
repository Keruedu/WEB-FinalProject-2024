const User = require('../models/user');
const PaginationService = require('../service/paginationService');
const blogService = require('../service/blogService');

// Trang admin dashboard
exports.getAdminPage = async (req, res) => {
  res.render('admin', {
    title: 'Admin Dashboard'
  });
};

// Trang quản lý users (code cũ)
exports.getUsersManagementPage = async (req, res) => {
  try {
    res.render('admin-usersManagement', { 
      title: 'Users Management',
      currentUser: req.user,
      searchQuery: '',
      filterType: 'username'
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error loading page');
  }
};

exports.getUsersList = async (req, res) => {
  try {
    const result = await PaginationService.paginate(User, {
      page: parseInt(req.query.page) || 1,
      perPage: 3,
      searchQuery: req.query.search || '',
      filterField: req.query.filterType || 'username',
      selectFields: 'username email fullName role isPremium isBanned createdAt',
      sortField: req.query.sortField || 'username',
      sortOrder: req.query.sortOrder || 'asc'
    });

    res.json({
      users: result.items,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error loading users' });
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).send('User not found');
    }
    res.render('admin-userDetails', { 
      user,
      title: 'User Details - Admin Dashboard'
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Server error');
  }
};

exports.toggleUserBan = async (req, res) => {
  try {
    const { id } = req.params;
    const { isBanned } = req.body;
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Cannot ban admin users' });
    }
    
    user.isBanned = isBanned;
    await user.save();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
const ITEMS_PER_PAGE = 9
// Get admin blogs management page
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
      res.render('admin-blogsManagement', {
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

// Change status of selected blogs
exports.changeStatusBlogs = async (req, res) => {
  try {
    const { blogIds } = req.body;
    await blogService.changeStatusBlogs(blogIds);
    res.status(200).json({ success_msg: 'Blog status updated successfully' });
  } catch (error) {
    console.error('Error changing blog status:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};