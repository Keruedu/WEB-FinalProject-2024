const User = require('../models/user');

exports.getAdminPage = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Trang hiện tại
    const accountPerPage = 3; // Số tài khoản mỗi trang

    // Đếm tổng số user
    const totalUsers = await User.countDocuments();
    
    // Tính số trang
    const lastPage = Math.ceil(totalUsers / accountPerPage);
    
    // Lấy users cho trang hiện tại
    const users = await User.find({})
      .sort('username')
      .skip((page - 1) * accountPerPage)
      .limit(accountPerPage);

    res.render('admin', { 
      title: 'User Management',
      users,
      user: req.user,
      currentPage: page,
      hasNextPage: page < lastPage,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: lastPage,
      oldUrl: req.originalUrl
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error loading users');
  }
};