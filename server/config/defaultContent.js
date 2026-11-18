// Starting content for the gallery, reels and header. Only inserted when those tables are empty.
const DEFAULT_SETTINGS = {
    announcement_enabled: 'true',
    announcement_text: 'NYE 2026 guestlist is open — profile verification mandatory',
    announcement_link: '/#upcoming',
    hero_eyebrow: 'India’s leading collective experience',
    hero_subtitle: 'Club nights, pool parties and festivals that sell out in hours. Delhi, Goa, London. You had to be there.',
    hero_image: '/media/crowd-concert.jpg',
    hero_video: '',
    hero_cta_text: 'Get on the list',
    instagram_url: 'https://www.instagram.com/projectx.exp/',
    contact_phone: '',
    contact_email: '',
};

const DEFAULT_GALLERY = [
    ['/media/crowd-concert.jpg', 'Pop & Plunge 3.0 — after dark'],
    ['/media/pnp-lhs.jpg', 'Project X × London Hopshop'],
    ['/media/halloween.jpg', 'Sincity · Halloween at Bohca'],
    ['/media/wiild.jpg', 'All White · Atrio by Devam'],
    ['/media/london.jpg', 'Late Night Club London'],
    ['/media/bollywood.jpg', 'Bollywood Edition · sold out'],
    ['/media/one-with-us.jpg', 'One With Us · NYE 2025'],
    ['/media/pnp-crowd-2.jpg', 'Pop & Plunge 3.0 venue reveal'],
];

const DEFAULT_REELS = [
    ['Bollywood Edition — sold out in 24h', '/media/bollywood-reel.jpg', 'https://www.instagram.com/projectx.exp/reel/Da0SsBbAis3/'],
    ['Project Goa — 6 days of madness', '/media/goa.jpg', 'https://www.instagram.com/projectx.exp/reel/DXOw3K-AAd9/'],
    ['Pop & Plunge 3.0 — venue reveal', '/media/pnp-3.jpg', 'https://www.instagram.com/popnplunge.india/reel/DcdxpMJpHS_/'],
    ['Holiest Pop ’n’ Plunge 2026', '/media/holi.jpg', 'https://www.instagram.com/dias.delhi/reel/DVWBD6Kki-r/'],
    ['Pop. Plunge. Repeat.', '/media/pnp-throwback.jpg', 'https://www.instagram.com/popnplunge.india/reel/DchGtHBSFnJ/'],
    ['Delhi’s about to get drenched', '/media/pnp-drenched.jpg', 'https://www.instagram.com/popnplunge.india/reel/DYxjWSDy13-/'],
];

const insertDefaultContent = async (conn) => {
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
        await conn.query('INSERT IGNORE INTO settings (setting_key, setting_value) VALUES (?, ?)', [key, value]);
    }
    const [[g]] = await conn.query('SELECT COUNT(*) AS n FROM gallery');
    if (!g.n) {
        for (const [i, [url, caption]] of DEFAULT_GALLERY.entries()) {
            await conn.query('INSERT INTO gallery (image_url, caption, sort_order) VALUES (?, ?, ?)', [url, caption, i]);
        }
    }
    const [[r]] = await conn.query('SELECT COUNT(*) AS n FROM reels');
    if (!r.n) {
        for (const [i, [title, cover, insta]] of DEFAULT_REELS.entries()) {
            await conn.query('INSERT INTO reels (title, cover_url, instagram_url, sort_order) VALUES (?, ?, ?, ?)', [title, cover, insta, i]);
        }
    }
};

module.exports = { insertDefaultContent, DEFAULT_SETTINGS };
