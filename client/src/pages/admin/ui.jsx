import React, { createContext, useContext, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import api from '../../utils/axios';

/* Toast notifications shared by all admin tabs */
export const NotifyContext = createContext(() => {});
export const useNotify = () => useContext(NotifyContext);

export const errMsg = (e, fallback = 'Something went wrong') => e?.response?.data?.message || e?.message || fallback;

export const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
export const fmtDate = (d, withTime = false) => d ? new Date(d).toLocaleString('en-IN', withTime
    ? { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }
    : { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export const Stat = ({ label, value, hint, accent = false }) => (
    <div className="card p-5">
        <p className="text-[0.65rem] uppercase tracking-widest text-mute font-bold">{label}</p>
        <p className={`font-display text-4xl mt-2 ${accent ? 'text-brand' : 'text-bone'}`}>{value}</p>
        {hint && <p className="text-mute text-xs mt-1">{hint}</p>}
    </div>
);

const BADGE = {
    pending: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
    confirmed: 'bg-green-500/15 text-green-300 border-green-500/30',
    cancelled: 'bg-white/5 text-mute border-line',
    paid: 'bg-green-500/15 text-green-300 border-green-500/30',
    not_paid: 'bg-brand/15 text-brand-soft border-brand/30',
    blocked: 'bg-brand/15 text-brand-soft border-brand/30',
    active: 'bg-green-500/15 text-green-300 border-green-500/30',
    admin: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    upcoming: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    past: 'bg-white/5 text-mute border-line',
};
const LABEL = { not_paid: 'Not paid' };

export const Badge = ({ kind, children }) => (
    <span className={`inline-block border text-[0.65rem] font-bold uppercase tracking-widest px-2 py-1 rounded-full whitespace-nowrap ${BADGE[kind] || BADGE.past}`}>
        {children || LABEL[kind] || kind}
    </span>
);

export const Modal = ({ title, onClose, children, wide = false }) => {
    useEffect(() => {
        const onKey = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);
    return (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
            <div className={`card w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} p-6 my-8`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="font-display uppercase text-2xl">{title}</h3>
                    <button onClick={onClose} className="text-mute hover:text-bone text-lg" aria-label="Close"><FaTimes /></button>
                </div>
                {children}
            </div>
        </div>
    );
};

export const Field = ({ label, children, hint }) => (
    <label className="block">
        <span className="block text-[0.65rem] font-bold uppercase tracking-widest text-mute mb-2">{label}</span>
        {children}
        {hint && <span className="block text-mute text-xs mt-1">{hint}</span>}
    </label>
);

export const Empty = ({ children }) => <div className="card p-10 text-center text-mute">{children}</div>;

export const btnSm = 'inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider px-3 py-2 rounded-lg border transition disabled:opacity-40';
export const btnSmGhost = `${btnSm} border-line text-bone/80 hover:border-bone hover:text-bone`;
export const btnSmBrand = `${btnSm} border-brand bg-brand text-white hover:bg-brand-dark`;
export const btnSmDanger = `${btnSm} border-brand/40 text-brand-soft hover:bg-brand hover:text-white hover:border-brand`;
export const btnSmGood = `${btnSm} border-green-500/40 text-green-300 hover:bg-green-600 hover:text-white hover:border-green-600`;

// Downloads the Excel export using the admin's token
export const downloadExcel = async (type) => {
    const res = await api.get(`/admin/export?type=${type}`, { responseType: 'blob' });
    const name = res.headers['content-disposition']?.match(/filename="([^"]+)"/)?.[1] || `projectx-${type}.xlsx`;
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
};
