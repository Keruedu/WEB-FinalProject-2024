const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
    name: String,
    price: Number,
    billingCycle: { type: String, enum: ['Monthly', 'Yearly'] },
    features: [String]
  });

const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);

module.exports = SubscriptionPlan;