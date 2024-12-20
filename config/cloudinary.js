const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cấu hình lưu trữ với Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'BlogWeb/Blog', // Thư mục lưu trữ trên Cloudinary
    format: async (req, file) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (ext === '.jpg' || ext === '.jpeg') {
        return 'jpg';
      } else if (ext === '.png') {
        return 'png';
      } else if (ext === '.gif') {
        return 'gif';
      } else {
        return 'jpg'; // Định dạng mặc định
      }
    },
    public_id: (req, file) => Date.now() + '-' + file.originalname // Tên file
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  console.log(`File type: ${file.mimetype}`); // Log file type
  if (!allowedTypes.includes(file.mimetype)) {
    const error = new Error('Invalid file type. Only jpg, png, and gif files are allowed.');
    error.status = 400;
    console.error('Error: Invalid file type');
    return cb(error, false);
  }
  cb(null, true);
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn kích thước file là 5MB
  fileFilter: fileFilter
});

module.exports = upload;