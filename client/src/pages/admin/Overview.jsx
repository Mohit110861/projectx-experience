import React, { useEffect, useState } from 'react';
import { FaFileExcel } from 'react-icons/fa';
import api from '../../utils/axios';
import { Stat, inr, fmtDate, useNotify, errMsg, downloadExcel, btnSmBrand, btnSmGhost, Badge } from './ui';

const Overview = ({ go }) => {
    const notify = useNotify();
    const [stats, setStats] = useState(null);

    useEffect(() => {
        api.get('/admin/stats').then(r => setStats(r.data)).catch(e => notify(errMsg(e), 'error'));
    }, [notify]);

    const exportPaid = async () => {
        try { await downloadExcel('paid'); notify('Excel downloaded'); } catch (e) { notify(errMsg(e, 'Export failed'), 'error'); }
    };

    if (!stats) return <p className="text-mute">Loading…</p>;
    const upcoming = stats.byEvent.filter(e => new Date(e.date) >= new Date()).sort((a, b) => new Date(a.date) - new Date(b.date));

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <Stat label="Revenue collected" value={inr(stats.revenue)} hint={`${stats.payingUsers} paying users`} accent />
                <Stat label="Pending requests" value={stats.bookings.pending} hint="waiting for approval" />
                <Stat label="Unpaid confirmed" value={inr(stats.outstanding)} hint="to collect" />
                <Stat label="Users" value={stats.users.total} hint={`${stats.users.newLast30Days} new · ${stats.users.blocked} blocked`} />
            </div>

            <div className="flex flex-wrap gap-3">
                <button className={btnSmBrand} onClick={() => go('bookings')}>Review pending requests</button>
                <button className={btnSmGhost} onClick={exportPaid}><FaFileExcel /> Download paid users (Excel)</button>
                <button className={btnSmGhost} onClick={() => go('events')}>Create event</button>
                <button className={btnSmGhost} onClick={() => go('gallery')}>Upload photos</button>
                <button className={btnSmGhost} onClick={() => go('reels')}>Post a reel</button>
            </div>

            <div className="card overflow-hidden">
                <div className="px-5 py-4 border-b border-line flex items-center justify-between">
                    <h2 className="font-display uppercase text-2xl">Slots & revenue by event</h2>
                    <span className="text-mute text-xs">{stats.events.upcoming} upcoming · {stats.events.total} total</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-left text-[0.65rem] uppercase tracking-widest text-mute">
                            <tr className="border-b border-line">
                                <th className="px-5 py-3">Event</th><th className="px-3 py-3">Date</th><th className="px-3 py-3">Slots filled</th>
                                <th className="px-3 py-3">Pending</th><th className="px-5 py-3 text-right">Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...upcoming, ...stats.byEvent.filter(e => !upcoming.includes(e))].map(e => {
                                const filled = e.totalSeats - e.availableSeats;
                                const pct = e.totalSeats ? Math.round((filled / e.totalSeats) * 100) : 0;
                                const isUp = new Date(e.date) >= new Date();
                                return (
                                    <tr key={e._id} className="border-b border-line last:border-0">
                                        <td className="px-5 py-3"><span className="font-semibold">{e.title}</span> {isUp && <Badge kind="upcoming" />}</td>
                                        <td className="px-3 py-3 text-mute whitespace-nowrap">{fmtDate(e.date)}</td>
                                        <td className="px-3 py-3 min-w-[160px]">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-24 bg-raised rounded-full overflow-hidden"><div className="h-full bg-brand" style={{ width: `${pct}%` }} /></div>
                                                <span className="text-xs text-mute">{filled}/{e.totalSeats}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3">{e.pending || '—'}</td>
                                        <td className="px-5 py-3 text-right font-semibold">{inr(e.revenue)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Overview;
