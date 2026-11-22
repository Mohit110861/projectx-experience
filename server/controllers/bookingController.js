const { pool } = require('../config/db');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const OTP = require('../models/OTP');
const { sendBookingEmail, sendOTPEmail } = require('../utils/email');

const { generateOTP } = require('../utils/otp');

exports.sendBookingOTP = async (req, res) => {
    try {
        const otp = generateOTP();
        await OTP.replace(req.user.email, otp, 'event_booking');
        await sendOTPEmail(req.user.email, otp, 'event_booking');
        res.json({ message: 'OTP sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error sending OTP', error: error.message });
    }
};

exports.bookEvent = async (req, res) => {
    try {
        const { eventId, otp } = req.body;

        // Verify OTP explicitly before proceeding
        const validOTP = await OTP.findValid(req.user.email, otp, 'event_booking');
        if (!validOTP) {
            return res.status(400).json({ message: 'Invalid or expired OTP for booking' });
        }

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });
        if (new Date(event.date).getTime() < Date.now()) return res.status(400).json({ message: 'This event has already happened' });
        if (event.availableSeats <= 0) return res.status(400).json({ message: 'No seats available' });

        if (await Booking.hasActiveBooking(req.user.id, event.id)) {
            return res.status(400).json({ message: 'Already booked or pending' });
        }

        const booking = await Booking.create({
            userId: req.user.id,
            eventId: event.id,
            status: 'pending',
            paymentStatus: 'not_paid',
            amount: event.ticketPrice
        });

        await OTP.deleteById(validOTP.id); // cleanup

        res.status(201).json({ message: 'Booking request submitted', booking });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.confirmBooking = async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { paymentStatus } = req.body; // 'paid' or 'not_paid'
        await conn.beginTransaction();

        // Lock the booking and its event so two admins can't over-allocate seats
        const [[booking]] = await conn.query('SELECT * FROM bookings WHERE id = ? FOR UPDATE', [req.params.id]);
        if (!booking) { await conn.rollback(); return res.status(404).json({ message: 'Booking not found' }); }
        if (booking.status === 'confirmed') { await conn.rollback(); return res.status(400).json({ message: 'Booking is already confirmed' }); }

        const [[event]] = await conn.query('SELECT * FROM events WHERE id = ? FOR UPDATE', [booking.event_id]);
        if (!event) { await conn.rollback(); return res.status(404).json({ message: 'Event no longer exists' }); }
        if (event.available_seats <= 0) {
            await conn.rollback();
            return res.status(400).json({ message: 'No seats available to confirm this booking' });
        }

        const newPayment = ['paid', 'not_paid'].includes(paymentStatus) ? paymentStatus : booking.payment_status;
        await conn.query(`UPDATE bookings SET status = 'confirmed', payment_status = ?, paid_at = ${newPayment === 'paid' ? 'COALESCE(paid_at, NOW())' : 'NULL'} WHERE id = ?`, [newPayment, booking.id]);
        await conn.query('UPDATE events SET available_seats = available_seats - 1 WHERE id = ?', [event.id]);
        await conn.commit();

        const updated = await Booking.findById(booking.id);

        // Send email on admin confirmation
        await sendBookingEmail(updated.userId.email, updated.userId.name, updated.eventId.title);

        res.json({ message: 'Booking confirmed successfully', booking: updated });
    } catch (error) {
        await conn.rollback().catch(() => {});
        res.status(500).json({ message: 'Server Error', error: error.message });
    } finally {
        conn.release();
    }
};

exports.getMyBookings = async (req, res) => {
    try {
        const bookings = req.user.role === 'admin'
            ? await Booking.findAll()
            : await Booking.findByUser(req.user.id);
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.cancelBooking = async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [[booking]] = await conn.query('SELECT * FROM bookings WHERE id = ? FOR UPDATE', [req.params.id]);
        if (!booking) { await conn.rollback(); return res.status(404).json({ message: 'Booking not found' }); }
        if (booking.user_id !== req.user.id && req.user.role !== 'admin') {
            await conn.rollback();
            return res.status(403).json({ message: 'Not authorized' });
        }
        if (booking.status === 'cancelled') { await conn.rollback(); return res.status(400).json({ message: 'Already cancelled' }); }

        await conn.query("UPDATE bookings SET status = 'cancelled' WHERE id = ?", [booking.id]);

        // Only restore the seat if it was actually confirmed and deducted
        if (booking.status === 'confirmed' && booking.event_id) {
            await conn.query('UPDATE events SET available_seats = available_seats + 1 WHERE id = ?', [booking.event_id]);
        }
        await conn.commit();

        res.json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        await conn.rollback().catch(() => {});
        res.status(500).json({ message: 'Server Error', error: error.message });
    } finally {
        conn.release();
    }
};
