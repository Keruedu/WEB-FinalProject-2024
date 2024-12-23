const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const User = require('../models/user'); // Đảm bảo có model User

passport.use(
  new LocalStrategy(
    {
      usernameField: 'identifier', // Use a generic field name
      passwordField: 'password'
    },
    async (identifier, password, done) => {
      try {
        // Find user by username or email
        const user = await User.findOne({
          $or: [{ username: identifier }, { email: identifier }]
        });
        if (!user) {
          return done(null, false, { message: 'Incorrect username or email.' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: 'Incorrect password.' });
        }
        // Kiểm tra user có bị banned không
        if (user.isBanned) {
          return done(null, false, { message: 'Your account has been banned.' });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});
