const User = require('../models/user'); // Ensure you have the User model imported

const buildBlogQuery = async ({ search, category, tags, timeRange, userId, bookmarked, status, searchType, isPremium }) => {
  let query = {};

  if (userId) {
    query.author = userId;
  }

  if (bookmarked) {
    query._id = { $in: bookmarked };
  }

  if (search) {
    if (searchType === 'title') {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    } else if (searchType === 'author') {
      const users = await User.find({ username: { $regex: search, $options: 'i' } });
      const userIds = users.map(user => user._id);
      query.author = { $in: userIds };
    }
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

  if (status) {
    query.status = status;
  }

  if (isPremium) {
    query.isPremium = true;
  }

  return query;
};

module.exports = { buildBlogQuery };