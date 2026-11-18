const ExcelJS = require('exceljs');
const { pool } = require('../config/db');
const Booking = require('../models/Booking');

const fail = (res, e) => res.status(500).json({ message: 'Server Error', error: e.message });
const PAYMENT_METHODS = ['', 'cash', 'upi', 'card', 'bank_transfer', 'online', 'complimentary'];

/* ---------- Overview ---------- */
exports.getStats = async (req, res) => {
    try {
        const [[users]] = await pool.query("SELECT COUNT(*) total, SUM(is_blocked) blocked, SUM(created_at >= NOW() - INTERVAL 30 DAY) recent FROM users WHERE role = 'user'");
        const [[events]] = await pool.query('SELECT COUNT(*) total, SUM(date >= NOW()) upcoming FROM events');
        const [[b]] = await pool.query(`SELECT COUNT(*) total,
            SUM(status = 'pending') pending, SUM(status = 'confirmed') confirmed, SUM(status = 'cancelled') cancelled,
            SUM(CASE WHEN payment_status = 'paid' AND status <> 'cancelled' THEN amount ELSE 0 END) revenue,
            SUM(CASE WHEN payment_status = 'not_paid' AND status = 'confirmed' THEN amount ELSE 0 END) outstanding,
            COUNT(DISTINCT CASE WHEN payment_status = 'paid' AND status <> 'cancelled' THEN user_id END) payingUsers
            FROM bookings`);
        const [byEvent] = await pool.query(`SELECT e.id, e.title, e.date, e.total_seats, e.available_seats,
            SUM(b.status = 'pending') pending, SUM(b.status = 'confirmed') confirmed,
            SUM(CASE WHEN b.payment_status = 'paid' AND b.status <> 'cancelled' THEN b.amount ELSE 0 END) revenue
            FROM events e LEFT JOIN bookings b ON b.event_id = e.id GROUP BY e.id ORDER BY e.date DESC`);
        const n = (v) => Number(v || 0);
        res.json({
            users: { total: n(users.total), blocked: n(users.blocked), newLast30Days: n(users.recent) },
            events: { total: n(events.total), upcoming: n(events.upcoming) },
            bookings: { total: n(b.total), pending: n(b.pending), confirmed: n(b.confirmed), cancelled: n(b.cancelled) },
            revenue: n(b.revenue), outstanding: n(b.outstanding), payingUsers: n(b.payingUsers),
            byEvent: byEvent.map(r => ({ _id: r.id, title: r.title, date: r.date, totalSeats: r.total_seats, availableSeats: r.available_seats,
                pending: n(r.pending), confirmed: n(r.confirmed), revenue: n(r.revenue) })),
        });
    } catch (e) { fail(res, e); }
};

/* ---------- Users ---------- */
const USER_LIST_SQL = `
    SELECT u.id, u.name, u.email, u.phone, u.role, u.is_verified, u.is_blocked, u.created_at,
           COUNT(b.id) AS bookings,
           SUM(b.status = 'confirmed') AS confirmed,
           COALESCE(SUM(CASE WHEN b.payment_status = 'paid' AND b.status <> 'cancelled' THEN b.amount END), 0) AS paid_total,
           MAX(b.created_at) AS last_booking
    FROM users u LEFT JOIN bookings b ON b.user_id = u.id
    GROUP BY u.id ORDER BY u.created_at DESC, u.id DESC`;

const toUserRow = (r) => ({
    _id: r.id, name: r.name, email: r.email, phone: r.phone || '', role: r.role,
    isVerified: !!r.is_verified, isBlocked: !!r.is_blocked, createdAt: r.created_at,
    bookings: Number(r.bookings || 0), confirmed: Number(r.confirmed || 0), paidTotal: Number(r.paid_total || 0), lastBooking: r.last_booking,
});

exports.listUsers = async (req, res) => {
    try {
        const [rows] = await pool.query(USER_LIST_SQL);
        res.json(rows.map(toUserRow));
    } catch (e) { fail(res, e); }
};

exports.setBlocked = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const blocked = !!req.body.blocked;
        if (id === req.user.id) return res.status(400).json({ message: 'You cannot block your own account' });
        const [[u]] = await pool.query('SELECT id, role FROM users WHERE id = ?', [id]);
        if (!u) return res.status(404).json({ message: 'User not found' });
        if (u.role === 'admin') return res.status(400).json({ message: 'Admins cannot be blocked' });
        await pool.query('UPDATE users SET is_blocked = ? WHERE id = ?', [blocked, id]);
        // Blocking also cancels the user's pending requests
        if (blocked) await pool.query("UPDATE bookings SET status = 'cancelled' WHERE user_id = ? AND status = 'pending'", [id]);
        res.json({ message: blocked ? 'User blocked' : 'User unblocked' });
    } catch (e) { fail(res, e); }
};

/* ---------- Bookings & payments ---------- */
exports.listBookings = async (req, res) => {
    try { res.json(await Booking.findAll()); } catch (e) { fail(res, e); }
};

// Admin records a payment (or reverses it) on a booking
exports.updatePayment = async (req, res) => {
    try {
        const { paymentStatus, paymentMethod = '', paymentRef = '', amount } = req.body;
        if (!['paid', 'not_paid'].includes(paymentStatus)) return res.status(400).json({ message: 'paymentStatus must be paid or not_paid' });
        if (!PAYMENT_METHODS.includes(paymentMethod)) return res.status(400).json({ message: 'Unknown payment method' });
        const [[b]] = await pool.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
        if (!b) return res.status(404).json({ message: 'Booking not found' });
        const newAmount = amount === undefined || amount === '' ? b.amount : Number(amount);
        if (!(newAmount >= 0)) return res.status(400).json({ message: 'Amount must be a positive number' });
        await pool.query(
            `UPDATE bookings SET payment_status = ?, payment_method = ?, payment_ref = ?, amount = ?,
             paid_at = ${paymentStatus === 'paid' ? 'COALESCE(paid_at, NOW())' : 'NULL'} WHERE id = ?`,
            [paymentStatus, paymentStatus === 'paid' ? paymentMethod : '', paymentStatus === 'paid' ? String(paymentRef).slice(0, 120) : '', newAmount, b.id]
        );
        res.json({ message: 'Payment updated', booking: await Booking.findById(b.id) });
    } catch (e) { fail(res, e); }
};

/* ---------- Excel export ---------- */
const money = '"₹"#,##0';
const styleHeader = (ws) => {
    const row = ws.getRow(1);
    row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3182D' } };
    row.alignment = { vertical: 'middle' };
    row.height = 22;
    ws.views = [{ state: 'frozen', ySplit: 1 }];
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columnCount } };
};

// GET /api/admin/export?type=paid|all  -> .xlsx with bookings, revenue per event and users
exports.exportExcel = async (req, res) => {
    try {
        const onlyPaid = req.query.type !== 'all';
        const [bookings] = await pool.query(`
            SELECT b.*, u.name, u.email, u.phone, e.title, e.date AS event_date, e.location
            FROM bookings b JOIN users u ON u.id = b.user_id LEFT JOIN events e ON e.id = b.event_id
            ${onlyPaid ? "WHERE b.payment_status = 'paid' AND b.status <> 'cancelled'" : ''}
            ORDER BY e.date DESC, b.created_at DESC`);
        const [byEvent] = await pool.query(`SELECT e.title, e.date, e.location, e.ticket_price, e.total_seats, e.available_seats,
            SUM(b.status = 'confirmed') confirmed, SUM(b.status = 'pending') pending,
            SUM(b.payment_status = 'paid' AND b.status <> 'cancelled') paid_count,
            COALESCE(SUM(CASE WHEN b.payment_status = 'paid' AND b.status <> 'cancelled' THEN b.amount END), 0) revenue
            FROM events e LEFT JOIN bookings b ON b.event_id = e.id GROUP BY e.id ORDER BY e.date DESC`);
        const [users] = await pool.query(USER_LIST_SQL);

        const wb = new ExcelJS.Workbook();
        wb.creator = 'Project X Experience';
        wb.created = new Date();

        const ws1 = wb.addWorksheet(onlyPaid ? 'Paid Bookings' : 'All Bookings');
        ws1.columns = [
            { header: 'Booking #', key: 'id', width: 11 },
            { header: 'Name', key: 'name', width: 22 },
            { header: 'Email', key: 'email', width: 28 },
            { header: 'Phone', key: 'phone', width: 15 },
            { header: 'Event', key: 'title', width: 36 },
            { header: 'Event Date', key: 'event_date', width: 14, style: { numFmt: 'dd-mmm-yyyy' } },
            { header: 'Venue', key: 'location', width: 30 },
            { header: 'Ticket Amount', key: 'amount', width: 14, style: { numFmt: money } },
            { header: 'Payment', key: 'payment_status', width: 10 },
            { header: 'Method', key: 'payment_method', width: 14 },
            { header: 'Reference', key: 'payment_ref', width: 20 },
            { header: 'Paid At', key: 'paid_at', width: 18, style: { numFmt: 'dd-mmm-yyyy hh:mm' } },
            { header: 'Booking Status', key: 'status', width: 14 },
            { header: 'Booked At', key: 'created_at', width: 18, style: { numFmt: 'dd-mmm-yyyy hh:mm' } },
        ];
        bookings.forEach(b => ws1.addRow({
            ...b, title: b.title || 'Deleted event', amount: Number(b.amount),
            payment_status: b.payment_status === 'paid' ? 'Paid' : 'Not paid',
            payment_method: (b.payment_method || '').replace('_', ' '),
        }));
        styleHeader(ws1);
        const total = ws1.addRow({ title: 'TOTAL', amount: bookings.reduce((s, b) => s + (b.payment_status === 'paid' && b.status !== 'cancelled' ? Number(b.amount) : 0), 0) });
        total.font = { bold: true };

        const ws2 = wb.addWorksheet('Revenue by Event');
        ws2.columns = [
            { header: 'Event', key: 'title', width: 36 },
            { header: 'Date', key: 'date', width: 14, style: { numFmt: 'dd-mmm-yyyy' } },
            { header: 'Venue', key: 'location', width: 30 },
            { header: 'Ticket Price', key: 'ticket_price', width: 13, style: { numFmt: money } },
            { header: 'Slots', key: 'total_seats', width: 8 },
            { header: 'Slots Left', key: 'available_seats', width: 10 },
            { header: 'Confirmed', key: 'confirmed', width: 11 },
            { header: 'Pending', key: 'pending', width: 9 },
            { header: 'Paid Tickets', key: 'paid_count', width: 12 },
            { header: 'Revenue', key: 'revenue', width: 14, style: { numFmt: money } },
        ];
        byEvent.forEach(r => ws2.addRow({ ...r, ticket_price: Number(r.ticket_price), confirmed: Number(r.confirmed || 0), pending: Number(r.pending || 0), paid_count: Number(r.paid_count || 0), revenue: Number(r.revenue) }));
        styleHeader(ws2);
        const t2 = ws2.addRow({ title: 'TOTAL', revenue: byEvent.reduce((s, r) => s + Number(r.revenue), 0) });
        t2.font = { bold: true };

        const ws3 = wb.addWorksheet('Users');
        ws3.columns = [
            { header: 'User #', key: '_id', width: 8 },
            { header: 'Name', key: 'name', width: 22 },
            { header: 'Email', key: 'email', width: 28 },
            { header: 'Phone', key: 'phone', width: 15 },
            { header: 'Role', key: 'role', width: 8 },
            { header: 'Verified', key: 'verified', width: 9 },
            { header: 'Blocked', key: 'blocked', width: 9 },
            { header: 'Bookings', key: 'bookings', width: 10 },
            { header: 'Total Paid', key: 'paidTotal', width: 13, style: { numFmt: money } },
            { header: 'Joined', key: 'createdAt', width: 14, style: { numFmt: 'dd-mmm-yyyy' } },
        ];
        users.map(toUserRow).forEach(u => ws3.addRow({ ...u, verified: u.isVerified ? 'Yes' : 'No', blocked: u.isBlocked ? 'Yes' : 'No' }));
        styleHeader(ws3);

        const stamp = new Date().toISOString().slice(0, 10);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="projectx-${onlyPaid ? 'paid' : 'all'}-bookings-${stamp}.xlsx"`);
        await wb.xlsx.write(res);
        res.end();
    } catch (e) { fail(res, e); }
};
