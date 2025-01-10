const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcrypt');
const User = require('../models/user');

passport.use(
  new LocalStrategy(
    {
      usernameField: 'identifier',
      passwordField: 'password'
    },
    async (identifier, password, done) => {
      try {
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

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback'
    },
    async (token, tokenSecret, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          user = new User({
            googleId: profile.id,
            username: profile.displayName,
            fullName: profile.displayName,
            email: profile.emails[0].value
          });
          await user.save();
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