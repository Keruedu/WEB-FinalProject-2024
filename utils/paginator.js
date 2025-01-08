const Blog = require('../models/blog');

const paginateAndSortBlogs = async (query, page, sort, ITEMS_PER_PAGE) => {
    const totalBlogs = await Blog.countDocuments(query).exec();
    const blogs = await Blog.find(query)
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE)
      .sort(sort)
      .populate('author', 'name')
      .populate('category', 'name')
      .populate('tags', 'name')
      .exec();
  
    return { blogs, totalBlogs };
  };
  
module.exports = { paginateAndSortBlogs };
  