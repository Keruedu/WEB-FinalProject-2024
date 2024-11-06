const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('../views/index');
});
router.get('/404', (req, res) => {
    res.render('../views/404');
});
router.get('/about', (req, res) => {
    res.render('../views/about');
});
// router.get('/blog-details', (req, res) => {
//     res.render('../views/blog-details');
// });
router.get('/contact', (req, res) => {
    res.render('../views/contact');
});
router.get('/pricing', (req, res) => {
    res.render('../views/pricing');
});

module.exports = router;
