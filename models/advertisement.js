const mongoose = require('mongoose');

const advertisementSchema = new mongoose.Schema({
    imageUrl: String,
    link: String,
    description: String
  });

module.exports = mongoose.model('Advertisement', advertisementSchema);