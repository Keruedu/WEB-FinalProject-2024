const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  imageUrl: String,
  title: String,
  content: String,
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  views: {
    type: Number,
    default: 0
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  tags: [{ 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag'
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('Blog', blogSchema);