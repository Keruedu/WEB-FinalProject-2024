const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { ensureAuthenticated, ensureAdmin } = require('../middlewares/auth');
// Admin page route
router.get('/admin', ensureAuthenticated, ensureAdmin, adminController.getAdminPage);
router.get('/api/users', ensureAuthenticated, ensureAdmin, adminController.getUsersList);
// Thêm route mới cho user details
router.get('/admin/users/:id', ensureAuthenticated, ensureAdmin, adminController.getUserDetails);
router.put('/api/users/:id/ban', ensureAuthenticated, ensureAdmin, adminController.toggleUserBan);

module.exports = router;