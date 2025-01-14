const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { ensureAuthenticated, ensureAdmin } = require('../middlewares/auth');
const Order = require('../models/order');

// Admin page route
router.get('/admin', ensureAuthenticated, ensureAdmin, adminController.getAdminPage);
router.get('/api/users', ensureAuthenticated, ensureAdmin, adminController.getUsersList);

// Thêm route mới cho user details
router.get('/admin/users/:id', ensureAuthenticated, ensureAdmin, adminController.getUserDetails);
router.put('/api/users/:id/ban', ensureAuthenticated, ensureAdmin, adminController.toggleUserBan);

// Categories & Tags routes
router.get('/admin/categories-tags', ensureAuthenticated, ensureAdmin, adminController.getCategoriesAndTags);
router.delete('/api/categories/:id', ensureAuthenticated, ensureAdmin, adminController.deleteCategory);
router.delete('/api/tags/:id', ensureAuthenticated, ensureAdmin, adminController.deleteTag);
router.post('/api/categories', ensureAuthenticated, ensureAdmin, adminController.createCategory);
router.post('/api/tags', ensureAuthenticated, ensureAdmin, adminController.createTag);

router.get('/admin/blogs', ensureAuthenticated, ensureAdmin, adminController.getBlogs);
router.post('/admin/blogs/change-status', ensureAuthenticated, ensureAdmin, adminController.changeStatusBlogs);
router.put('/admin/blogs/:id/status', ensureAuthenticated, ensureAdmin, adminController.changeBlogStatus);
router.get('/admin/analytics', ensureAuthenticated, (req, res) => {
    res.render('admin-analytics', { title: 'Admin Analytics' });
  });
router.get('/admin/blog-creation-data', ensureAuthenticated, adminController.getBlogCreationData);
router.get('/admin/revenue-data', ensureAuthenticated, adminController.getRevenueData);
router.get('/admin/top-revenue-data', ensureAuthenticated, adminController.getTopRevenueData);

// Thêm routes cho orders management
router.get('/admin/orders', ensureAuthenticated, ensureAdmin, adminController.getOrdersManagement);
router.get('/api/admin/orders', ensureAuthenticated, ensureAdmin, adminController.getOrders);

// Thêm route cho trang chi tiết đơn hàng
router.get('/admin/orders/:orderId', ensureAuthenticated, ensureAdmin, adminController.getOrderDetails);
router.post('/api/admin/orders/:orderId/note', ensureAuthenticated, ensureAdmin, adminController.addOrderNote);

module.exports = router;