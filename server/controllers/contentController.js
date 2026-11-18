const { pool } = require('../config/db');
const { publicUrl, removeUpload } = require('../utils/upload');

const toGallery = (r) => ({ _id: r.id, id: r.id, imageUrl: r.image_url, caption: r.caption || '', sortOrder: r.sort_order, createdAt: r.created_at });
const toReel = (r) => ({ _id: r.id, id: r.id, title: r.title, videoUrl: r.video_url, coverUrl: r.cover_url, instagramUrl: r.instagram_url, sortOrder: r.sort_order, createdAt: r.created_at });

const isInstagramUrl = (u) => !u || /^https:\/\/(www\.)?instagram\.com\//i.test(u);
const fail = (res, e) => res.status(500).json({ message: 'Server Error', error: e.message });

/* ---------- Gallery ---------- */
exports.listGallery = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM gallery ORDER BY sort_order ASC, id DESC');
        res.json(rows.map(toGallery));
    } catch (e) { fail(res, e); }
};

// Accepts one or many images (field "images"), with an optional shared caption
exports.addGallery = async (req, res) => {
    try {
        const files = req.files || [];
        if (!files.length) return res.status(400).json({ message: 'Choose at least one image' });
        if (files.some(f => !f.mimetype.startsWith('image/'))) {
            files.forEach(f => removeUpload(publicUrl(f)));
            return res.status(400).json({ message: 'Gallery accepts images only' });
        }
        const [[{ minOrder }]] = await pool.query('SELECT COALESCE(MIN(sort_order), 0) AS minOrder FROM gallery');
        const created = [];
        for (const [i, f] of files.entries()) {
            const [r] = await pool.query('INSERT INTO gallery (image_url, caption, sort_order) VALUES (?, ?, ?)',
                [publicUrl(f), req.body.caption || '', minOrder - files.length + i]);
            created.push(r.insertId);
        }
        res.status(201).json({ message: `${created.length} photo(s) added`, ids: created });
    } catch (e) { fail(res, e); }
};

exports.updateGallery = async (req, res) => {
    try {
        const { caption, sortOrder } = req.body;
        await pool.query('UPDATE gallery SET caption = COALESCE(?, caption), sort_order = COALESCE(?, sort_order) WHERE id = ?',
            [caption ?? null, sortOrder ?? null, req.params.id]);
        res.json({ message: 'Updated' });
    } catch (e) { fail(res, e); }
};

exports.deleteGallery = async (req, res) => {
    try {
        const [[row]] = await pool.query('SELECT * FROM gallery WHERE id = ?', [req.params.id]);
        if (!row) return res.status(404).json({ message: 'Photo not found' });
        await pool.query('DELETE FROM gallery WHERE id = ?', [row.id]);
        removeUpload(row.image_url);
        res.json({ message: 'Photo deleted' });
    } catch (e) { fail(res, e); }
};

/* ---------- Reels ---------- */
exports.listReels = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM reels ORDER BY sort_order ASC, id DESC');
        res.json(rows.map(toReel));
    } catch (e) { fail(res, e); }
};

// Fields: title, instagramUrl; files: video (optional), cover (optional). Needs a video or an Instagram link.
exports.addReel = async (req, res) => {
    const video = req.files?.video?.[0];
    const cover = req.files?.cover?.[0];
    const cleanup = () => { removeUpload(publicUrl(video)); removeUpload(publicUrl(cover)); };
    try {
        const { title, instagramUrl } = req.body;
        if (!title) { cleanup(); return res.status(400).json({ message: 'Title is required' }); }
        if (!video && !instagramUrl) { cleanup(); return res.status(400).json({ message: 'Upload a video or paste an Instagram reel link' }); }
        if (!isInstagramUrl(instagramUrl)) { cleanup(); return res.status(400).json({ message: 'Instagram link must start with https://www.instagram.com/' }); }
        if (video && !video.mimetype.startsWith('video/')) { cleanup(); return res.status(400).json({ message: 'Reel file must be a video' }); }
        if (cover && !cover.mimetype.startsWith('image/')) { cleanup(); return res.status(400).json({ message: 'Cover must be an image' }); }
        const [[{ minOrder }]] = await pool.query('SELECT COALESCE(MIN(sort_order), 0) AS minOrder FROM reels');
        const [r] = await pool.query('INSERT INTO reels (title, video_url, cover_url, instagram_url, sort_order) VALUES (?, ?, ?, ?, ?)',
            [title, publicUrl(video), publicUrl(cover), instagramUrl || null, minOrder - 1]);
        res.status(201).json({ message: 'Reel added', id: r.insertId });
    } catch (e) { cleanup(); fail(res, e); }
};

exports.updateReel = async (req, res) => {
    const video = req.files?.video?.[0];
    const cover = req.files?.cover?.[0];
    try {
        const [[row]] = await pool.query('SELECT * FROM reels WHERE id = ?', [req.params.id]);
        if (!row) return res.status(404).json({ message: 'Reel not found' });
        const { title, instagramUrl, sortOrder } = req.body;
        if (!isInstagramUrl(instagramUrl)) return res.status(400).json({ message: 'Instagram link must start with https://www.instagram.com/' });
        await pool.query('UPDATE reels SET title = ?, instagram_url = ?, video_url = ?, cover_url = ?, sort_order = ? WHERE id = ?', [
            title || row.title,
            instagramUrl === undefined ? row.instagram_url : (instagramUrl || null),
            video ? publicUrl(video) : row.video_url,
            cover ? publicUrl(cover) : row.cover_url,
            sortOrder ?? row.sort_order,
            row.id,
        ]);
        if (video) removeUpload(row.video_url);
        if (cover) removeUpload(row.cover_url);
        res.json({ message: 'Reel updated' });
    } catch (e) { fail(res, e); }
};

exports.deleteReel = async (req, res) => {
    try {
        const [[row]] = await pool.query('SELECT * FROM reels WHERE id = ?', [req.params.id]);
        if (!row) return res.status(404).json({ message: 'Reel not found' });
        await pool.query('DELETE FROM reels WHERE id = ?', [row.id]);
        removeUpload(row.video_url);
        removeUpload(row.cover_url);
        res.json({ message: 'Reel deleted' });
    } catch (e) { fail(res, e); }
};

/* ---------- Site settings (header / hero / announcement) ---------- */
const SETTING_KEYS = ['announcement_enabled', 'announcement_text', 'announcement_link', 'hero_eyebrow', 'hero_subtitle',
    'hero_image', 'hero_video', 'hero_cta_text', 'instagram_url', 'contact_phone', 'contact_email'];

const readSettings = async () => {
    const [rows] = await pool.query('SELECT * FROM settings');
    return Object.fromEntries(rows.map(r => [r.setting_key, r.setting_value ?? '']));
};

exports.getSettings = async (req, res) => {
    try { res.json(await readSettings()); } catch (e) { fail(res, e); }
};

// Text fields in the body; optional files heroImage / heroVideo replace the hero media
exports.updateSettings = async (req, res) => {
    try {
        const current = await readSettings();
        const updates = {};
        for (const key of SETTING_KEYS) if (req.body[key] !== undefined) updates[key] = String(req.body[key]);
        const img = req.files?.heroImage?.[0];
        const vid = req.files?.heroVideo?.[0];
        if (img) updates.hero_image = publicUrl(img);
        if (vid) updates.hero_video = publicUrl(vid);
        if (req.body.remove_hero_video === 'true') updates.hero_video = '';
        for (const [k, v] of Object.entries(updates)) {
            await pool.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)', [k, v]);
        }
        if (updates.hero_image && updates.hero_image !== current.hero_image) removeUpload(current.hero_image);
        if (updates.hero_video !== undefined && updates.hero_video !== current.hero_video) removeUpload(current.hero_video);
        res.json(await readSettings());
    } catch (e) { fail(res, e); }
};
