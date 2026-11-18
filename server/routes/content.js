const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const { upload, handleUpload } = require('../utils/upload');
const c = require('../controllers/contentController');

// Public
router.get('/gallery', c.listGallery);
router.get('/reels', c.listReels);
router.get('/settings', c.getSettings);

// Admin
router.post('/gallery', protect, admin, handleUpload(upload.array('images', 30)), c.addGallery);
router.put('/gallery/:id', protect, admin, c.updateGallery);
router.delete('/gallery/:id', protect, admin, c.deleteGallery);

const reelFiles = handleUpload(upload.fields([{ name: 'video', maxCount: 1 }, { name: 'cover', maxCount: 1 }]));
router.post('/reels', protect, admin, reelFiles, c.addReel);
router.put('/reels/:id', protect, admin, reelFiles, c.updateReel);
router.delete('/reels/:id', protect, admin, c.deleteReel);

const heroFiles = handleUpload(upload.fields([{ name: 'heroImage', maxCount: 1 }, { name: 'heroVideo', maxCount: 1 }]));
router.put('/settings', protect, admin, heroFiles, c.updateSettings);

module.exports = router;
