// service/checkoutService.js
const SubscriptionPlan = require('../models/subscriptionPlan');

const getSubscriptionPlanById = async (planId) => {
  try {
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      throw new Error('Subscription plan not found');
    }
    return plan;
  } catch (error) {
    console.error('Error fetching subscription plan:', error);
    throw new Error('Internal Server Error');
  }
};

module.exports = {
  getSubscriptionPlanById,
};