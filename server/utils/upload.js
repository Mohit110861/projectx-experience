const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');
const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];
const VIDEO_EXT = ['.mp4', '.webm', '.mov', '.m4v'];

for (const dir of ['images', 'videos']) fs.mkdirSync(path.join(UPLOAD_ROOT, dir), { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const isVideo = file.mimetype.startsWith('video/');
        cb(null, path.join(UPLOAD_ROOT, isVideo ? 'videos' : 'images'));
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
    },
});

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const okImage = file.mimetype.startsWith('image/') && IMAGE_EXT.includes(ext);
    const okVideo = file.mimetype.startsWith('video/') && VIDEO_EXT.includes(ext);
    if (okImage || okVideo) return cb(null, true);
    cb(new Error(`Unsupported file type: ${file.originalname}. Use JPG/PNG/WEBP images or MP4/WEBM/MOV videos.`));
};

// 250 MB max per file (reels can be large)
const upload = multer({ storage, fileFilter, limits: { fileSize: 250 * 1024 * 1024 } });

// Public URL for a stored file, e.g. /uploads/images/123-abc.jpg
const publicUrl = (file) => (file ? `/uploads/${file.mimetype.startsWith('video/') ? 'videos' : 'images'}/${file.filename}` : null);

// Deletes a previously uploaded file (only files inside /uploads, never /media defaults)
const removeUpload = (url) => {
    if (!url || !url.startsWith('/uploads/')) return;
    const full = path.normalize(path.join(UPLOAD_ROOT, url.replace(/^\/uploads\//, '')));
    if (!full.startsWith(UPLOAD_ROOT)) return;
    fs.unlink(full, () => {});
};

// Wraps a multer middleware so upload errors return a clean 400 JSON message
const handleUpload = (mw) => (req, res, next) => mw(req, res, (err) => {
    if (!err) return next();
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 250 MB)' : err.message;
    res.status(400).json({ message });
});

module.exports = { upload, publicUrl, removeUpload, handleUpload, UPLOAD_ROOT };
