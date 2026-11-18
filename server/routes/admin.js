const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const c = require('../controllers/adminController');
const { upload, handleUpload, publicUrl } = require('../utils/upload');

router.use(protect, admin);
router.get('/stats', c.getStats);
router.get('/users', c.listUsers);
router.put('/users/:id/block', c.setBlocked);
router.get('/bookings', c.listBookings);
router.put('/bookings/:id/payment', c.updatePayment);
router.get('/export', c.exportExcel);

// Single image upload (e.g. event posters) -> { url }
router.post('/upload', handleUpload(upload.single('file')), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file received' });
    res.status(201).json({ url: publicUrl(req.file) });
});

module.exports = router;
