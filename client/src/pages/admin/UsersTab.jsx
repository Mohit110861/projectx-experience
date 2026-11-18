import React, { useCallback, useEffect, useState } from 'react';
import { FaFileExcel, FaSearch, FaBan, FaUnlock } from 'react-icons/fa';
import api from '../../utils/axios';
import { Badge, Empty, inr, fmtDate, useNotify, errMsg, downloadExcel, btnSmBrand, btnSmGhost, btnSmDanger, btnSmGood } from './ui';

const UsersTab = () => {
    const notify = useNotify();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState('');
    const [filter, setFilter] = useState('all');
    const [busy, setBusy] = useState(null);

    const load = useCallback(async () => {
        try { const { data } = await api.get('/admin/users'); setUsers(data); }
        catch (e) { notify(errMsg(e), 'error'); }
        finally { setLoading(false); }
    }, [notify]);
    useEffect(() => { load(); }, [load]);

    const toggleBlock = async (u) => {
        const blocking = !u.isBlocked;
        if (blocking && !window.confirm(`Block ${u.name}? They won't be able to log in or book, and their pending requests will be cancelled.`)) return;
        setBusy(u._id);
        try {
            await api.put(`/admin/users/${u._id}/block`, { blocked: blocking });
            notify(blocking ? `${u.name} blocked` : `${u.name} unblocked`);
            await load();
        } catch (e) { notify(errMsg(e), 'error'); } finally { setBusy(null); }
    };

    const exportX = async () => { try { await downloadExcel('paid'); notify('Excel downloaded'); } catch (e) { notify(errMsg(e, 'Export failed'), 'error'); } };

    const shown = users.filter(u =>
        (filter === 'all' || (filter === 'blocked' ? u.isBlocked : filter === 'paying' ? u.paidTotal > 0 : filter === 'unverified' ? !u.isVerified : true)) &&
        (!q || `${u.name} ${u.email} ${u.phone}`.toLowerCase().includes(q.toLowerCase()))
    );

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                    {[['all', `All (${users.length})`], ['paying', `Paying (${users.filter(u => u.paidTotal > 0).length})`], ['unverified', 'Unverified'], ['blocked', `Blocked (${users.filter(u => u.isBlocked).length})`]].map(([v, l]) => (
                        <button key={v} onClick={() => setFilter(v)} className={filter === v ? btnSmBrand : btnSmGhost}>{l}</button>
                    ))}
                </div>
                <button className={btnSmGhost} onClick={exportX}><FaFileExcel /> Download Excel</button>
            </div>

            <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-mute" />
                <input className="field !pl-11" placeholder="Search name, email or phone" value={q} onChange={e => setQ(e.target.value)} />
            </div>

            {loading ? <p className="text-mute">Loading…</p> : shown.length === 0 ? <Empty>No users found.</Empty> : (
                <div className="card overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-left text-[0.65rem] uppercase tracking-widest text-mute">
                            <tr className="border-b border-line">
                                <th className="px-4 py-3">User</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Bookings</th>
                                <th className="px-3 py-3">Paid</th><th className="px-3 py-3">Joined</th><th className="px-4 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shown.map(u => (
                                <tr key={u._id} className="border-b border-line last:border-0">
                                    <td className="px-4 py-3">
                                        <p className="font-semibold">{u.name}</p>
                                        <p className="text-mute text-xs">{u.email}{u.phone ? ` · ${u.phone}` : ''}</p>
                                    </td>
                                    <td className="px-3 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {u.role === 'admin' ? <Badge kind="admin" /> : <Badge kind={u.isBlocked ? 'blocked' : 'active'} />}
                                            {!u.isVerified && u.role !== 'admin' && <Badge kind="pending">Unverified</Badge>}
                                        </div>
                                    </td>
                                    <td className="px-3 py-3">{u.bookings} <span className="text-mute text-xs">({u.confirmed} confirmed)</span></td>
                                    <td className="px-3 py-3 font-semibold">{inr(u.paidTotal)}</td>
                                    <td className="px-3 py-3 text-mute whitespace-nowrap">{fmtDate(u.createdAt)}</td>
                                    <td className="px-4 py-3 text-right">
                                        {u.role !== 'admin' && (
                                            <button className={u.isBlocked ? btnSmGood : btnSmDanger} disabled={busy === u._id} onClick={() => toggleBlock(u)}>
                                                {u.isBlocked ? <><FaUnlock /> Unblock</> : <><FaBan /> Block</>}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default UsersTab;
