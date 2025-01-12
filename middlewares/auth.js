const Blog = require('../models/blog');

module.exports = {
  ensureAuthenticated: (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/signin?notification=signin');
  },
  ensureAdmin: (req, res, next) => {
    if (req.isAuthenticated() && req.user.role === 'admin') {
      return next();
    }
    res.status(403).json({ errors: [{ msg: 'Access denied' }] });
  },
  ensurePremium: (req, res, next) => {
    if (req.isAuthenticated() && req.user.isPremium) {
      return next();
    }
    res.redirect('/pricing?notification=premium');
  },
  ensurePremiumBlogAccess: async (req, res, next) => {
    try {
      const blogId = req.params.id;
      const blog = await Blog.findById(blogId);

      if (!req.isAuthenticated()) {
        return res.redirect('/signin?notification=signin');
      }

      if (blog.isPremium && !req.user.isPremium) {
        return res.redirect('/pricing?notification=premium');
      }
      next();
    } catch (error) {
      console.error('Error in ensurePremiumBlogAccess:', error);
      res.status(500).json({ errors: [{ msg: 'Internal Server Error' }] });
    }
  }
};