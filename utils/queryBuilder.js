// src/utils/queryBuilder.js
const buildBlogQuery = ({ search, category, tags, timeRange, userId, bookmarked }) => {
    let query = {};
  
    if (userId) {
      query.author = userId;
    }
  
    if (bookmarked) {
      query._id = { $in: bookmarked };
    }
  
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
  
    if (category) query.category = category;
  
    if (tags) {
      const tagsArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagsArray };
    }
  
    if (timeRange) {
      const now = new Date();
      let startDate;
      switch (timeRange) {
        case '24h': startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
        case 'week': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
        case 'month': startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
        case 'year': startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); break;
      }
      if (startDate) query.createdAt = { $gte: startDate };
    }
  
    return query;
  };
  
  module.exports = { buildBlogQuery };
  