import React, { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaChartPie, FaCalendarAlt, FaTicketAlt, FaUsers, FaImages, FaFilm, FaSlidersH } from 'react-icons/fa';
import { AuthContext } from '../../context/AuthContext';
import { NotifyContext } from './ui';
import Overview from './Overview';
import EventsTab from './EventsTab';
import BookingsTab from './BookingsTab';
import UsersTab from './UsersTab';
import GalleryTab from './GalleryTab';
import ReelsTab from './ReelsTab';
import HeaderTab from './HeaderTab';

const TABS = [
    { id: 'overview', label: 'Overview', icon: FaChartPie, el: Overview },
    { id: 'events', label: 'Events & Slots', icon: FaCalendarAlt, el: EventsTab },
    { id: 'bookings', label: 'Bookings & Payments', icon: FaTicketAlt, el: BookingsTab },
    { id: 'users', label: 'Users', icon: FaUsers, el: UsersTab },
    { id: 'gallery', label: 'Gallery', icon: FaImages, el: GalleryTab },
    { id: 'reels', label: 'Reels', icon: FaFilm, el: ReelsTab },
    { id: 'header', label: 'Header & Site', icon: FaSlidersH, el: HeaderTab },
];

const AdminDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const [toast, setToast] = useState(null);
    const active = TABS.find(t => t.id === params.get('tab')) || TABS[0];
    const Active = active.el;

    useEffect(() => {
        if (!user || user.role !== 'admin') navigate('/login');
    }, [user, navigate]);

    const notify = useCallback((message, type = 'ok') => {
        setToast({ message, type, id: Date.now() });
    }, []);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 3500);
        return () => clearTimeout(t);
    }, [toast]);

    if (!user || user.role !== 'admin') return null;

    const go = (id) => setParams(id === 'overview' ? {} : { tab: id });

    return (
        <NotifyContext.Provider value={notify}>
            <div className="mb-8">
                <p className="eyebrow mb-2">Project X control room</p>
                <h1 className="font-display uppercase text-4xl md:text-6xl leading-none">Admin</h1>
            </div>

            <div className="grid gap-8 lg:grid-cols-[230px_1fr] items-start">
                {/* Tab navigation: horizontal scroll on mobile, sidebar on desktop */}
                <nav className="no-scrollbar flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 lg:sticky lg:top-36 -mx-4 px-4 lg:mx-0 lg:px-0" aria-label="Admin sections">
                    {TABS.map(({ id, label, icon: Icon }) => (
                        <button key={id} onClick={() => go(id)}
                            className={`shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition text-left ${active.id === id ? 'bg-brand text-white' : 'bg-surface border border-line text-bone/80 hover:text-bone hover:border-bone/40'}`}>
                            <Icon className="shrink-0" /> {label}
                        </button>
                    ))}
                </nav>

                <section className="min-w-0">
                    <Active go={go} />
                </section>
            </div>

            {toast && (
                <div key={toast.id} role="status"
                    className={`fixed bottom-6 right-6 z-[70] max-w-sm px-5 py-4 rounded-xl border shadow-2xl text-sm font-semibold ${toast.type === 'error' ? 'bg-[#2a0b0f] border-brand text-brand-soft' : 'bg-[#0d2416] border-green-500/50 text-green-300'}`}>
                    {toast.message}
                </div>
            )}
        </NotifyContext.Provider>
    );
};

export default AdminDashboard;
