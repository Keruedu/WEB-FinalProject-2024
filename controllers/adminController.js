const User = require('../models/user');
const PaginationService = require('../service/paginationService');
const Category = require('../models/category');
const Tag = require('../models/tag');
const Blog = require('../models/blog');
const Order = require('../models/order');
const SubscriptionPlan = require('../models/subscriptionPlan');

// Trang admin dashboard
exports.getAdminPage = async (req, res) => {
  res.render('admin', {
    title: 'Admin Dashboard'
  });
};

// Trang quản lý users (code cũ)
exports.getUsersManagementPage = async (req, res) => {
  try {
    res.render('admin-usersManagement', { 
      title: 'Users Management',
      currentUser: req.user,
      searchQuery: '',
      filterType: 'username'
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error loading page');
  }
};

exports.getUsersList = async (req, res) => {
  try {
    const result = await PaginationService.paginate(User, {
      page: parseInt(req.query.page) || 1,
      perPage: 10,
      searchQuery: req.query.search || '',
      filterField: req.query.filterType || 'username',
      selectFields: 'username email fullName role isPremium isBanned createdAt',
      sortField: req.query.sortField || 'username',
      sortOrder: req.query.sortOrder || 'asc'
    });

    res.json({
      users: result.items,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error loading users' });
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).send('User not found');
    }
    res.render('admin-userDetails', { 
      user,
      title: 'User Details - Admin Dashboard'
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Server error');
  }
};

exports.toggleUserBan = async (req, res) => {
  try {
    const { id } = req.params;
    const { isBanned } = req.body;
    
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Cannot ban admin users' });
    }
    
    user.isBanned = isBanned;
    await user.save();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getCategoriesAndTags = async (req, res) => {
  try {
    // Categories - sắp xếp theo tên và Uncategorized xuống cuối
    const categories = await Category.aggregate([
      {
        $lookup: {
          from: 'blogs',
          localField: '_id',
          foreignField: 'category',
          as: 'blogs'
        }
      },
      {
        $project: {
          name: 1,
          blogs: 1,
          blogsCount: { $size: '$blogs' },
          sortName: { $toLower: '$name' },
          isUncategorized: {
            $cond: { 
              if: { $eq: ['$name', 'Uncategorized'] }, 
              then: 1, 
              else: 0 
            }
          }
        }
      },
      {
        $sort: { 
          isUncategorized: 1,  // Uncategorized xuống cuối
          sortName: 1          // Sắp xếp theo tên (case-insensitive)
        }
      }
    ]);

    // Tags - chỉ sắp xếp theo tên
    const tags = await Tag.aggregate([
      {
        $lookup: {
          from: 'blogs',
          localField: '_id',
          foreignField: 'tags',
          as: 'blogs'
        }
      },
      {
        $project: {
          name: 1,
          blogs: 1,
          blogsCount: { $size: '$blogs' },
          sortName: { $toLower: '$name' }
        }
      },
      {
        $sort: { 
          sortName: 1  // Chỉ sắp xếp theo tên (case-insensitive)
        }
      }
    ]);

    res.render('admin-categoriesTags', {
      title: 'Categories & Tags Management',
      categories,
      tags,
      categoriesCount: categories.length,
      tagsCount: tags.length
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Server error');
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Tìm hoặc tạo category Uncategorized
    let uncategorized = await Category.findOne({ name: 'Uncategorized' });
    if (!uncategorized) {
      uncategorized = await Category.create({ name: 'Uncategorized' });
    }

    // Cập nhật tất cả blogs từ category bị xóa sang Uncategorized
    await Blog.updateMany(
      { category: id },
      { category: uncategorized._id }
    );

    // Xóa category
    await Category.findByIdAndDelete(id);

    res.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteTag = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Xóa tag khỏi tất cả blogs
    await Blog.updateMany(
      { tags: id },
      { $pull: { tags: id } }
    );

    // Xóa tag
    await Tag.findByIdAndDelete(id);

    res.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    // Kiểm tra tên category
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    // Kiểm tra category đã tồn tại
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }  // Case insensitive
    });
    
    if (existingCategory) {
      return res.status(400).json({ error: 'Category already exists' });
    }

    // Tạo category mới
    const category = await Category.create({ name: name.trim() });
    
    // Đảm bảo trả về JSON
    return res.json({ 
      success: true,
      category: {
        id: category._id,
        name: category.name
      }
    });

  } catch (error) {
    console.error('Create category error:', error);
    return res.status(500).json({ error: 'Failed to create category' });
  }
};

exports.createTag = async (req, res) => {
  try {
    const { name } = req.body;

    // Kiểm tra tên tag
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    // Kiểm tra tag đã tồn tại
    const existingTag = await Tag.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }  // Case insensitive
    });
    
    if (existingTag) {
      return res.status(400).json({ error: 'Tag already exists' });
    }

    // Tạo tag mới
    const tag = await Tag.create({ name: name.trim() });
    
    // Đảm bảo trả về JSON
    return res.json({ 
      success: true,
      tag: {
        id: tag._id,
        name: tag.name
      }
    });

  } catch (error) {
    console.error('Create tag error:', error);
    return res.status(500).json({ error: 'Failed to create tag' });
  }
};

exports.getOrdersManagement = (req, res) => {
  res.render('admin-ordersManagement', {
    title: 'Premium Orders Management'
  });
};

exports.getOrders = async (req, res) => {
  try {
    const { 
      page = 1, 
      perPage = 10, 
      sortOrder = 'desc', 
      planType = '' 
    } = req.query;
    
    let query = {};
    
    if (planType) {
      const subscriptionPlans = await SubscriptionPlan.find({ 
        billingCycle: { $regex: new RegExp(planType, 'i') } 
      });
      
      query.subscriptionPlan = { 
        $in: subscriptionPlans.map(plan => plan._id) 
      };
    }

    const result = await PaginationService.paginate(Order, {
      page: parseInt(page),
      perPage: parseInt(perPage),
      query: query,
      sortField: 'createdAt',
      sortOrder: sortOrder,
      populate: [
        { path: 'user', select: 'fullName email' },
        { path: 'subscriptionPlan', select: 'name price billingCycle' }
      ]
    });

    res.json({
      success: true,
      orders: result.items,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error in getOrders:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('user', 'fullName email')
      .populate('subscriptionPlan', 'name price billingCycle features');
      
    if (!order) {
      return res.status(404).send('Order not found');
    }

    res.render('admin-orderDetails', {
      title: 'Order Details',
      order: {
        id: order._id,
        createdAt: order.createdAt,
        status: order.status,
        paymentMethod: order.paymentMethod,
        amount: order.totalAmount,
        note: order.note,
        user: {
          name: order.user.fullName,
          email: order.user.email
        },
        plan: {
          name: order.subscriptionPlan.name,
          type: order.subscriptionPlan.billingCycle,
          price: order.subscriptionPlan.price,
          features: order.subscriptionPlan.features
        }
      }
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).send('Error fetching order details');
  }
};

exports.addOrderNote = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { note } = req.body;

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { $set: { note: note } },
      { new: true }
    ).populate('user', 'username email fullName')
     .populate('subscriptionPlan', 'name price billingCycle');

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ success: false, message: 'Failed to add note' });
  }
};

exports.updateOrderNote = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { note } = req.body;

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { note: note },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    res.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};