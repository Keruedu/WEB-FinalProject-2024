const User = require('../models/user');
const PaginationService = require('../service/paginationService');

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