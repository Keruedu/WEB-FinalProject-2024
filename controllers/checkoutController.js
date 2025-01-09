// controllers/checkoutController.js
const { getSubscriptionPlanById } = require('../service/checkoutService');

exports.getCheckoutPage = async (req, res) => {
  try {
    const plan = await getSubscriptionPlanById(req.params.planId);
    res.render('checkout', { plan });
  } catch (error) {
    if (error.message === 'Subscription plan not found') {
      return res.status(404).send(error.message);
    }
    res.status(500).send('Internal Server Error');
  }
};