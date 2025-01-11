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
// Categories & Tags routes
router.get('/admin/categories-tags', ensureAuthenticated, ensureAdmin, adminController.getCategoriesAndTags);
router.delete('/api/categories/:id', ensureAuthenticated, ensureAdmin, adminController.deleteCategory);
router.delete('/api/tags/:id', ensureAuthenticated, ensureAdmin, adminController.deleteTag);
router.post('/api/categories', ensureAuthenticated, ensureAdmin, adminController.createCategory);
router.post('/api/tags', ensureAuthenticated, ensureAdmin, adminController.createTag);

module.exports = router;