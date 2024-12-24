module.exports = (req, res, next) => {
    if (req.user && req.user.isBanned) {
      return res.status(403).send('Your account has been banned.');
    }
    next();
  };