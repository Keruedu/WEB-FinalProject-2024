module.exports = {
    ensureAuthenticated: (req, res, next) => {
      if (req.isAuthenticated()) {
        return next();
      }
      res.redirect('../view/signin');
    },
    ensureAdmin: (req, res, next) => {
      if (req.isAuthenticated() && req.user.role === 'admin') {
        return next();
      }
      res.status(403).send('Access denied');
    }
  };