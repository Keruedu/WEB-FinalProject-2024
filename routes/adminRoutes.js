const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { ensureAuthenticated, ensureAdmin } = require('../middlewares/auth');
// Admin page route
router.get('/admin', ensureAuthenticated, ensureAdmin, adminController.getAdminPage);

module.exports = router;