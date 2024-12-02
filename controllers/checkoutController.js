// controllers/checkoutController.js
const SubscriptionPlan = require('../models/subscriptionPlan');

exports.getCheckoutPage = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.planId);
    if (!plan) {
      return res.status(404).send('Subscription plan not found');
    }
    res.render('checkout', { plan });
  } catch (error) {
    console.error('Error fetching subscription plan:', error);
    res.status(500).send('Internal Server Error');
  }
};