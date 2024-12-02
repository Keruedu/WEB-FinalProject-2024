const express = require('express');
const router = express.Router();
const SubscriptionPlan = require('../models/subscriptionPlan');

router.get('/', (req, res) => {
    res.render('index');
});
router.get('/404', (req, res) => {
    res.render('../views/404');
});
router.get('/about', (req, res) => {
    res.render('../views/about');
});
// router.get('/blog-details', (req, res) => {
//     res.render('../views/blog-details');
// });
router.get('/contact', (req, res) => {
    res.render('../views/contact');
});

router.get('/pricing', async (req, res) => {
    try {
      const subscriptionPlans = await SubscriptionPlan.find();
      res.render('pricing', { subscriptionPlans });
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
