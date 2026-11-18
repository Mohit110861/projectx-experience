import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { mediaUrl } from '../utils/axios';
import { AuthContext } from '../context/AuthContext';
import { FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaTicketAlt, FaArrowLeft, FaInstagram } from 'react-icons/fa';
import { INSTAGRAM_URL } from '../data/brand';

const InfoRow = ({ icon, label, children }) => (
    <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-raised border border-line flex items-center justify-center text-brand shrink-0">{icon}</div>
        <div>
            <p className="text-[0.65rem] font-bold text-mute uppercase tracking-widest">{label}</p>
            <p className="font-semibold">{children}</p>
        </div>
    </div>
);

const EventDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [otp, setOtp] = useState('');
    const [showOTP, setShowOTP] = useState(false);
    const [requested, setRequested] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const { data } = await api.get(`/events/${id}`);
                setEvent(data);
            } catch (err) {
                setError('Failed to load event details.');
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [id]);

    const handleBooking = async () => {
        if (!user) {
            navigate('/login');
            return;
        }
        setBookingLoading(true);
        setError('');
        setSuccessMsg('');
        try {
            if (!showOTP) {
                await api.post('/bookings/send-otp');
                setShowOTP(true);
                setSuccessMsg('We’ve sent a 6-digit code to your email. Enter it to request your spot.');
            } else {
                await api.post('/bookings', { eventId: event._id, otp });
                setShowOTP(false);
                setRequested(true);
                setSuccessMsg('You’re on the request list. Our team will verify your profile and confirm your spot.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Booking failed');
        } finally {
            setBookingLoading(false);
        }
    };

    if (loading) return <div className="pt-40 text-center text-mute">Loading…</div>;
    if (!event) return <div className="pt-40 text-center text-brand">{error || 'Event not found'}</div>;

    const isPast = new Date(event.date).getTime() < Date.now();
    const isSoldOut = event.availableSeats <= 0;
    const date = new Date(event.date);

    let label = 'Request my spot';
    if (isPast) label = 'This event has ended';
    else if (isSoldOut) label = 'Sold out';
    else if (requested) label = 'Request sent';
    else if (showOTP) label = 'Verify code & request';
    if (bookingLoading) label = 'Processing…';

    return (
        <div>
            {/* Banner */}
            <section className="relative h-[60vh] min-h-[420px] overflow-hidden">
                {event.image && <img src={mediaUrl(event.image)} alt="" className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-50" />}
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/30" />
                <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12">
                    <Link to="/" className="text-mute hover:text-bone text-sm uppercase tracking-widest flex items-center gap-2 mb-6"><FaArrowLeft /> All events</Link>
                    <p className="eyebrow mb-3">{event.category}{isPast ? ' · Past experience' : ''}</p>
                    <h1 className="font-display uppercase text-5xl md:text-8xl leading-[0.9] max-w-4xl">{event.title}</h1>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-10 lg:grid-cols-[1fr_380px] items-start">
                <div className="grid gap-10 md:grid-cols-[minmax(0,320px)_1fr]">
                    {event.image && (
                        <img src={mediaUrl(event.image)} alt={`${event.title} poster`} className="w-full max-w-xs mx-auto md:max-w-none rounded-2xl border border-line" />
                    )}
                    <div>
                        <p className="eyebrow mb-4">The experience</p>
                        <p className="text-bone/85 text-lg leading-relaxed whitespace-pre-line">{event.description}</p>
                        <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="btn-ghost mt-8"><FaInstagram /> More on Instagram</a>
                    </div>
                </div>

                <aside className="card p-6 lg:sticky lg:top-28 order-first lg:order-none">
                    <div className="space-y-5 mb-8">
                        <InfoRow icon={<FaCalendarAlt />} label="Date">
                            {date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            <span className="block text-mute text-sm font-normal">{date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })} onwards</span>
                        </InfoRow>
                        <InfoRow icon={<FaMapMarkerAlt />} label="Venue">{event.location}</InfoRow>
                        <InfoRow icon={<FaTicketAlt />} label="Entry">
                            {event.ticketPrice === 0 ? 'Guestlist / free entry' : `₹${event.ticketPrice.toLocaleString('en-IN')}`}
                        </InfoRow>
                        {!isPast && (
                            <InfoRow icon={<FaUsers />} label="Spots left">
                                <span className={event.availableSeats < 20 ? 'text-brand' : ''}>{event.availableSeats}</span> / {event.totalSeats}
                            </InfoRow>
                        )}
                    </div>

                    {showOTP && (
                        <div className="mb-4">
                            <label className="block text-xs font-bold uppercase tracking-widest text-mute mb-2">Verification code</label>
                            <input type="text" inputMode="numeric" placeholder="6-digit code" className="field text-center font-bold tracking-[0.5em] text-lg" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength="6" />
                        </div>
                    )}

                    <button onClick={handleBooking} disabled={isPast || isSoldOut || requested || bookingLoading || (showOTP && otp.length < 6)} className="btn-brand w-full !py-4">
                        {label}
                    </button>
                    {!user && !isPast && <p className="text-mute text-xs text-center mt-3">You’ll need to log in first.</p>}
                    {error && <p className="text-brand-soft mt-4 text-center text-sm bg-brand/10 border border-brand/30 p-3 rounded-lg">{error}</p>}
                    {successMsg && <p className="text-green-400 mt-4 text-center text-sm bg-green-500/10 border border-green-500/30 p-3 rounded-lg">{successMsg}</p>}
                </aside>
            </div>
        </div>
    );
};

export default EventDetail;
