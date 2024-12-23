module.exports = {
    ensureAuthenticated: (req, res, next) => {
      if (req.isAuthenticated()) {
        return next();
      }
      res.redirect('/signin?notification=true');
    },
    ensureAdmin: (req, res, next) => {
      if (req.isAuthenticated() && req.user.role === 'admin') {
        return next();
      }
      res.status(403).json({ errors: [{ msg: 'Access denied' }] });
    }
  };