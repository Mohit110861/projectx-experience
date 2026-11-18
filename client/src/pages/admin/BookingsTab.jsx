import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FaFileExcel, FaCheck, FaRupeeSign, FaBan, FaSearch } from 'react-icons/fa';
import api from '../../utils/axios';
import { Modal, Field, Badge, Empty, inr, fmtDate, useNotify, errMsg, downloadExcel, btnSmBrand, btnSmGhost, btnSmDanger, btnSmGood } from './ui';

const METHODS = [['upi', 'UPI'], ['cash', 'Cash'], ['card', 'Card'], ['bank_transfer', 'Bank transfer'], ['online', 'Online'], ['complimentary', 'Complimentary']];

const PaymentModal = ({ booking, onClose, onSaved }) => {
    const notify = useNotify();
    const [form, setForm] = useState({
        paymentStatus: booking.paymentStatus === 'paid' ? 'paid' : 'paid',
        paymentMethod: booking.paymentMethod || 'upi',
        paymentRef: booking.paymentRef || '',
        amount: booking.amount,
    });
    const [saving, setSaving] = useState(false);
    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const save = async (status) => {
        setSaving(true);
        try {
            await api.put(`/admin/bookings/${booking._id}/payment`, { ...form, paymentStatus: status });
            notify(status === 'paid' ? 'Payment recorded' : 'Marked as not paid');
            onSaved();
        } catch (e) { notify(errMsg(e), 'error'); }
        finally { setSaving(false); }
    };

    return (
        <Modal title="Record payment" onClose={onClose}>
            <p className="text-sm text-mute mb-5">
                <span className="text-bone font-semibold">{booking.userId?.name}</span> · {booking.eventId?.title || 'Deleted event'}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Amount (₹)"><input type="number" min="0" className="field" value={form.amount} onChange={set('amount')} /></Field>
                <Field label="Method">
                    <select className="field" value={form.paymentMethod} onChange={set('paymentMethod')}>
                        {METHODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                </Field>
                <div className="sm:col-span-2"><Field label="Reference / transaction ID" hint="UPI ref, receipt no., etc. (optional)"><input className="field" value={form.paymentRef} onChange={set('paymentRef')} /></Field></div>
            </div>
            <div className="flex flex-wrap justify-end gap-3 mt-6">
                {booking.paymentStatus === 'paid' && <button className={btnSmDanger} disabled={saving} onClick={() => save('not_paid')}>Mark not paid</button>}
                <button className={btnSmGhost} onClick={onClose}>Cancel</button>
                <button className={btnSmBrand} disabled={saving} onClick={() => save('paid')}><FaRupeeSign /> Save as paid</button>
            </div>
        </Modal>
    );
};

const BookingsTab = () => {
    const notify = useNotify();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState('');
    const [status, setStatus] = useState('pending');
    const [payment, setPayment] = useState('all');
    const [eventId, setEventId] = useState('all');
    const [payFor, setPayFor] = useState(null);
    const [busy, setBusy] = useState(null);

    const load = useCallback(async () => {
        try { const { data } = await api.get('/admin/bookings'); setBookings(data); }
        catch (e) { notify(errMsg(e), 'error'); }
        finally { setLoading(false); }
    }, [notify]);
    useEffect(() => { load(); }, [load]);

    const events = useMemo(() => {
        const m = new Map();
        bookings.forEach(b => b.eventId && m.set(b.eventId._id, b.eventId.title));
        return [...m.entries()];
    }, [bookings]);

    const shown = bookings.filter(b =>
        (status === 'all' || b.status === status) &&
        (payment === 'all' || b.paymentStatus === payment) &&
        (eventId === 'all' || String(b.eventId?._id) === eventId) &&
        (!q || `${b.userId?.name} ${b.userId?.email} ${b.userId?.phone} ${b.eventId?.title} ${b.paymentRef}`.toLowerCase().includes(q.toLowerCase()))
    );
    const shownPaid = shown.filter(b => b.paymentStatus === 'paid' && b.status !== 'cancelled').reduce((s, b) => s + b.amount, 0);
    const count = (s) => bookings.filter(b => b.status === s).length;

    const act = async (id, fn, okMsg) => {
        setBusy(id);
        try { await fn(); notify(okMsg); await load(); } catch (e) { notify(errMsg(e), 'error'); } finally { setBusy(null); }
    };
    const confirm = (b, paymentStatus) => act(b._id, () => api.put(`/bookings/${b._id}/confirm`, { paymentStatus }), 'Booking confirmed — confirmation email sent');
    const cancel = (b) => window.confirm(`Cancel ${b.userId?.name}'s booking for ${b.eventId?.title || 'this event'}?`) &&
        act(b._id, () => api.delete(`/bookings/${b._id}`), 'Booking cancelled');
    const exportX = async (type) => { try { await downloadExcel(type); notify('Excel downloaded'); } catch (e) { notify(errMsg(e, 'Export failed'), 'error'); } };

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                    {[['pending', `Pending (${count('pending')})`], ['confirmed', `Confirmed (${count('confirmed')})`], ['cancelled', `Cancelled (${count('cancelled')})`], ['all', `All (${bookings.length})`]].map(([v, l]) => (
                        <button key={v} onClick={() => setStatus(v)} className={status === v ? btnSmBrand : btnSmGhost}>{l}</button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <button className={btnSmGhost} onClick={() => exportX('paid')}><FaFileExcel /> Paid users</button>
                    <button className={btnSmGhost} onClick={() => exportX('all')}><FaFileExcel /> All bookings</button>
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_180px_220px]">
                <div className="relative">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-mute" />
                    <input className="field !pl-11" placeholder="Search name, email, phone, ref…" value={q} onChange={e => setQ(e.target.value)} />
                </div>
                <select className="field" value={payment} onChange={e => setPayment(e.target.value)}>
                    <option value="all">Any payment</option><option value="paid">Paid</option><option value="not_paid">Not paid</option>
                </select>
                <select className="field" value={eventId} onChange={e => setEventId(e.target.value)}>
                    <option value="all">All events</option>
                    {events.map(([id, t]) => <option key={id} value={id}>{t}</option>)}
                </select>
            </div>

            <p className="text-mute text-sm">{shown.length} booking(s) · paid in this view: <span className="text-bone font-semibold">{inr(shownPaid)}</span></p>

            {loading ? <p className="text-mute">Loading…</p> : shown.length === 0 ? <Empty>No bookings match these filters.</Empty> : (
                <div className="grid gap-3">
                    {shown.map(b => (
                        <div key={b._id} className="card p-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <span className="font-semibold">{b.userId?.name}</span>
                                    <Badge kind={b.status} />
                                    <Badge kind={b.paymentStatus} />
                                    {b.userId?.isBlocked && <Badge kind="blocked" />}
                                </div>
                                <p className="text-mute text-sm truncate">{b.userId?.email}{b.userId?.phone ? ` · ${b.userId.phone}` : ''}</p>
                                <p className="text-sm mt-1"><span className="text-bone/90">{b.eventId?.title || 'Deleted event'}</span>
                                    {b.eventId && <span className="text-mute"> · {fmtDate(b.eventId.date)} · slots left {b.eventId.availableSeats}/{b.eventId.totalSeats}</span>}</p>
                                <p className="text-xs text-mute mt-1">
                                    #{b._id} · requested {fmtDate(b.createdAt, true)} · <span className="text-bone font-semibold">{inr(b.amount)}</span>
                                    {b.paymentStatus === 'paid' && <> · {b.paymentMethod ? b.paymentMethod.replace('_', ' ') : 'paid'}{b.paymentRef ? ` (${b.paymentRef})` : ''}{b.paidAt ? ` on ${fmtDate(b.paidAt)}` : ''}</>}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2 md:justify-end">
                                {b.status === 'pending' && <>
                                    <button className={btnSmGood} disabled={busy === b._id} onClick={() => confirm(b, 'paid')}><FaCheck /> Approve · paid</button>
                                    <button className={btnSmGhost} disabled={busy === b._id} onClick={() => confirm(b, 'not_paid')}><FaCheck /> Approve · unpaid</button>
                                </>}
                                {b.status !== 'cancelled' && <button className={btnSmGhost} onClick={() => setPayFor(b)}><FaRupeeSign /> Payment</button>}
                                {b.status !== 'cancelled' && <button className={btnSmDanger} disabled={busy === b._id} onClick={() => cancel(b)}><FaBan /> Cancel</button>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {payFor && <PaymentModal booking={payFor} onClose={() => setPayFor(null)} onSaved={() => { setPayFor(null); load(); }} />}
        </div>
    );
};

export default BookingsTab;
