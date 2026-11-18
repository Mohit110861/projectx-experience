import React, { useCallback, useEffect, useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaExternalLinkAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import api, { mediaUrl } from '../../utils/axios';
import { Modal, Field, Badge, Empty, inr, fmtDate, useNotify, errMsg, btnSmBrand, btnSmGhost, btnSmDanger } from './ui';

const blank = { title: '', description: '', date: '', location: '', category: '', totalSeats: '', availableSeats: '', ticketPrice: '', image: '' };

// <input type="datetime-local"> wants local "YYYY-MM-DDTHH:mm"
const toLocalInput = (d) => {
    const x = new Date(d);
    return new Date(x.getTime() - x.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const EventForm = ({ initial, onClose, onSaved }) => {
    const notify = useNotify();
    const editing = !!initial?._id;
    const [form, setForm] = useState(editing ? { ...initial, date: toLocalInput(initial.date) } : blank);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const uploadPoster = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const { data } = await api.post('/admin/upload', fd);
            setForm(f => ({ ...f, image: data.url }));
        } catch (err) { notify(errMsg(err, 'Upload failed'), 'error'); }
        finally { setUploading(false); }
    };

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                title: form.title, description: form.description, date: new Date(form.date).toISOString(),
                location: form.location, category: form.category, totalSeats: Number(form.totalSeats),
                ticketPrice: Number(form.ticketPrice || 0), image: form.image,
            };
            if (editing) {
                if (form.availableSeats !== '' && form.availableSeats !== undefined) payload.availableSeats = Number(form.availableSeats);
                await api.put(`/events/${initial._id}`, payload);
            } else {
                await api.post('/events', payload);
            }
            notify(editing ? 'Event updated' : 'Event published');
            onSaved();
        } catch (err) { notify(errMsg(err), 'error'); }
        finally { setSaving(false); }
    };

    return (
        <Modal title={editing ? 'Edit event' : 'New event'} onClose={onClose} wide>
            <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2"><Field label="Title"><input className="field" required value={form.title} onChange={set('title')} /></Field></div>
                <Field label="Date & time"><input type="datetime-local" className="field" required value={form.date} onChange={set('date')} /></Field>
                <Field label="Category"><input className="field" required placeholder="Club Night, Pool Party, NYE…" value={form.category} onChange={set('category')} /></Field>
                <div className="md:col-span-2"><Field label="Venue"><input className="field" required value={form.location} onChange={set('location')} /></Field></div>
                <Field label="Ticket price (₹)" hint="0 = guestlist / free"><input type="number" min="0" className="field" value={form.ticketPrice} onChange={set('ticketPrice')} /></Field>
                <Field label="Total slots"><input type="number" min="1" className="field" required value={form.totalSeats} onChange={set('totalSeats')} /></Field>
                {editing && <Field label="Slots left" hint="Adjust if you sell offline"><input type="number" min="0" className="field" value={form.availableSeats} onChange={set('availableSeats')} /></Field>}
                <div className="md:col-span-2"><Field label="Description"><textarea rows="5" className="field" required value={form.description} onChange={set('description')} /></Field></div>
                <div className="md:col-span-2 grid gap-4 sm:grid-cols-[120px_1fr] items-start">
                    <div className="aspect-[4/5] rounded-lg bg-raised border border-line overflow-hidden">
                        {form.image && <img src={mediaUrl(form.image)} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="space-y-3">
                        <Field label="Poster"><input type="file" accept="image/*" onChange={uploadPoster} className="block text-sm text-mute file:mr-3 file:btn-ghost file:!py-2 file:!px-4 file:cursor-pointer" /></Field>
                        {uploading && <p className="text-mute text-xs">Uploading…</p>}
                        <Field label="…or image URL"><input className="field" value={form.image} onChange={set('image')} placeholder="/media/poster.jpg" /></Field>
                    </div>
                </div>
                <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                    <button type="button" className={btnSmGhost} onClick={onClose}>Cancel</button>
                    <button type="submit" className={btnSmBrand} disabled={saving || uploading}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Publish event'}</button>
                </div>
            </form>
        </Modal>
    );
};

const EventsTab = () => {
    const notify = useNotify();
    const [events, setEvents] = useState([]);
    const [stats, setStats] = useState({});
    const [editing, setEditing] = useState(null);
    const [filter, setFilter] = useState('upcoming');

    const load = useCallback(async () => {
        try {
            const [ev, st] = await Promise.all([api.get('/events'), api.get('/admin/stats')]);
            setEvents(ev.data);
            setStats(Object.fromEntries(st.data.byEvent.map(e => [e._id, e])));
        } catch (e) { notify(errMsg(e), 'error'); }
    }, [notify]);

    useEffect(() => { load(); }, [load]);

    const remove = async (ev) => {
        if (!window.confirm(`Delete "${ev.title}"? Its bookings stay in the records as "Deleted event".`)) return;
        try { await api.delete(`/events/${ev._id}`); notify('Event deleted'); load(); } catch (e) { notify(errMsg(e), 'error'); }
    };

    const now = new Date();
    const shown = events
        .filter(e => filter === 'all' || (filter === 'upcoming' ? new Date(e.date) >= now : new Date(e.date) < now))
        .sort((a, b) => filter === 'past' ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date));

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-2">
                    {['upcoming', 'past', 'all'].map(f => (
                        <button key={f} onClick={() => setFilter(f)} className={filter === f ? btnSmBrand : btnSmGhost}>{f}</button>
                    ))}
                </div>
                <button className={btnSmBrand} onClick={() => setEditing({})}><FaPlus /> New event</button>
            </div>

            {shown.length === 0 ? <Empty>No {filter} events.</Empty> : (
                <div className="grid gap-4">
                    {shown.map(ev => {
                        const s = stats[ev._id] || {};
                        const filled = ev.totalSeats - ev.availableSeats;
                        return (
                            <div key={ev._id} className="card p-4 flex flex-col sm:flex-row gap-4">
                                <img src={mediaUrl(ev.image)} alt="" className="w-full sm:w-24 h-40 sm:h-28 object-cover rounded-lg bg-raised" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-lg">{ev.title}</h3>
                                        <Badge kind={new Date(ev.date) >= now ? 'upcoming' : 'past'} />
                                    </div>
                                    <p className="text-mute text-sm">{fmtDate(ev.date, true)} · {ev.location}</p>
                                    <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-sm">
                                        <span><span className="text-mute">Price</span> {ev.ticketPrice ? inr(ev.ticketPrice) : 'Guestlist'}</span>
                                        <span><span className="text-mute">Slots</span> {filled}/{ev.totalSeats} filled</span>
                                        <span><span className="text-mute">Pending</span> {s.pending || 0}</span>
                                        <span><span className="text-mute">Revenue</span> {inr(s.revenue)}</span>
                                    </div>
                                </div>
                                <div className="flex sm:flex-col gap-2 shrink-0">
                                    <button className={btnSmGhost} onClick={() => setEditing(ev)}><FaEdit /> Edit</button>
                                    <Link className={btnSmGhost} to={`/events/${ev._id}`} target="_blank"><FaExternalLinkAlt /> View</Link>
                                    <button className={btnSmDanger} onClick={() => remove(ev)}><FaTrash /> Delete</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {editing && <EventForm initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
        </div>
    );
};

export default EventsTab;
