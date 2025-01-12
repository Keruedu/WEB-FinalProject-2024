const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
require('dotenv').config();

// Import routes
const blogRoutes = require('./routes/blogRoutes');
const userRoutes = require('./routes/userRoutes');
const webRoutes = require('./routes/webRoutes');
const adminRoutes = require('./routes/adminRoutes');
const checkoutRoutes = require('./routes/checkoutRoutes');
const paymentRoutes = require('./routes/paymentRoutes');


// Import configurations
require('./config/passport');
const { connectToMongoDB } = require('./config/database');
const User = require('./models/user');
const Advertisement = require('./models/advertisement');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectToMongoDB();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Session & Passport configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'default_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 6 * 60 * 60 * 1000 }, // 6 hours
  })
);
app.use(passport.initialize());
app.use(passport.session());  
app.use(flash());

app.use(async (req, res, next) => {
  try {
    const user = req.user || null;
    let advertisements = [];
    if (!user) {
      advertisements = await Advertisement.find();
    } else if (user.isPremium && user.premiumExpiration > new Date()) {
      advertisements = [];
    } else {
      advertisements = await Advertisement.find();
    }

    res.locals.user = user;
    res.locals.advertisements = advertisements;
  } catch (error) {
    console.error('Error fetching advertisements:', error);
    res.locals.advertisements = [];
  } finally {
    next();
  }
});

// Routes
app.use('/', [adminRoutes, webRoutes, userRoutes, blogRoutes, checkoutRoutes, paymentRoutes]);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.status || 500;
  res.status(statusCode).send('Something went wrong!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Server is running on: http://localhost:${PORT}`);
});
