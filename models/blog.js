const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  imageUrl: String,
  date: Date,
  title: String,
  content: String,
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  views: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('Blog', blogSchema);