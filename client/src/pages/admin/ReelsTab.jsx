import React, { useCallback, useEffect, useState } from 'react';
import { FaPlay, FaTrash, FaEdit, FaInstagram, FaFilm, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import api, { mediaUrl } from '../../utils/axios';
import ReelPlayer, { instagramEmbed } from '../../components/ReelPlayer';
import { Field, Empty, Modal, useNotify, errMsg, btnSmBrand, btnSmGhost, btnSmDanger } from './ui';

const blank = { title: '', instagramUrl: '', video: null, cover: null };

const ReelForm = ({ reel, onDone, onCancel }) => {
    const notify = useNotify();
    const editing = !!reel?._id;
    const [form, setForm] = useState(editing ? { title: reel.title, instagramUrl: reel.instagramUrl || '', video: null, cover: null } : blank);
    const [progress, setProgress] = useState(null);
    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.files ? e.target.files[0] || null : e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        if (!editing && !form.video && !form.instagramUrl) return notify('Upload a video or paste an Instagram reel link', 'error');
        if (form.instagramUrl && !instagramEmbed(form.instagramUrl)) return notify('That doesn’t look like an Instagram reel/post link', 'error');
        const fd = new FormData();
        fd.append('title', form.title);
        fd.append('instagramUrl', form.instagramUrl);
        if (form.video) fd.append('video', form.video);
        if (form.cover) fd.append('cover', form.cover);
        setProgress(0);
        try {
            const opts = { onUploadProgress: (ev) => ev.total && setProgress(Math.round((ev.loaded / ev.total) * 100)) };
            if (editing) await api.put(`/reels/${reel._id}`, fd, opts); else await api.post('/reels', fd, opts);
            notify(editing ? 'Reel updated' : 'Reel posted');
            if (!editing) setForm(blank);
            e.target.reset();
            onDone();
        } catch (err) { notify(errMsg(err, 'Upload failed'), 'error'); }
        finally { setProgress(null); }
    };

    return (
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2"><Field label="Title"><input className="field" required value={form.title} onChange={set('title')} placeholder="Bollywood Edition — sold out in 24h" /></Field></div>
            <div className="md:col-span-2"><Field label="Instagram reel link" hint="Visitors can watch it on the site and tap through to Instagram"><input className="field" value={form.instagramUrl} onChange={set('instagramUrl')} placeholder="https://www.instagram.com/reel/…" /></Field></div>
            <Field label={editing ? 'Replace video (optional)' : 'Video file (optional)'} hint="MP4/MOV/WEBM, up to 250 MB. Plays directly on the site.">
                <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={set('video')} className="block w-full text-sm text-mute" />
            </Field>
            <Field label={editing ? 'Replace cover (optional)' : 'Cover image (optional)'} hint="Shown on the card before playing">
                <input type="file" accept="image/*" onChange={set('cover')} className="block w-full text-sm text-mute" />
            </Field>
            <div className="md:col-span-2 flex justify-end gap-3">
                {onCancel && <button type="button" className={btnSmGhost} onClick={onCancel}>Cancel</button>}
                <button className={btnSmBrand} disabled={progress !== null}>{progress !== null ? `Uploading ${progress}%` : editing ? 'Save reel' : 'Post reel'}</button>
            </div>
        </form>
    );
};

const ReelsTab = () => {
    const notify = useNotify();
    const [reels, setReels] = useState([]);
    const [playing, setPlaying] = useState(null);
    const [editing, setEditing] = useState(null);

    const load = useCallback(async () => {
        try { const { data } = await api.get('/reels'); setReels(data); } catch (e) { notify(errMsg(e), 'error'); }
    }, [notify]);
    useEffect(() => { load(); }, [load]);

    const remove = async (r) => {
        if (!window.confirm(`Delete reel "${r.title}"?`)) return;
        try { await api.delete(`/reels/${r._id}`); notify('Reel deleted'); load(); } catch (e) { notify(errMsg(e), 'error'); }
    };

    const move = async (i, dir) => {
        const order = reels.map(r => r._id);
        const j = i + dir;
        if (j < 0 || j >= order.length) return;
        [order[i], order[j]] = [order[j], order[i]];
        try {
            await Promise.all(order.map((id, k) => {
                const fd = new FormData(); fd.append('sortOrder', k);
                return api.put(`/reels/${id}`, fd);
            }));
            load();
        } catch (e) { notify(errMsg(e), 'error'); }
    };

    return (
        <div className="space-y-8">
            <div className="card p-5">
                <h2 className="font-display uppercase text-2xl mb-4">Post a reel</h2>
                <ReelForm onDone={load} />
            </div>

            <div>
                <h2 className="font-display uppercase text-2xl mb-4">On the site ({reels.length})</h2>
                {reels.length === 0 ? <Empty>No reels yet.</Empty> : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                        {reels.map((r, i) => (
                            <div key={r._id} className="card overflow-hidden flex flex-col">
                                <button className="relative aspect-[9/16] bg-raised group" onClick={() => setPlaying(r)} aria-label={`Play ${r.title}`}>
                                    {r.coverUrl ? <img src={mediaUrl(r.coverUrl)} alt="" className="w-full h-full object-cover" loading="lazy" />
                                        : r.videoUrl ? <video src={mediaUrl(r.videoUrl)} preload="metadata" muted className="w-full h-full object-cover" />
                                            : <FaFilm className="absolute inset-0 m-auto text-4xl text-mute" />}
                                    <span className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-brand/90 group-hover:bg-brand flex items-center justify-center text-white"><FaPlay className="ml-0.5" /></span>
                                </button>
                                <div className="p-3 space-y-2 flex-1 flex flex-col">
                                    <p className="font-semibold text-sm leading-snug flex-1">{r.title}</p>
                                    <div className="flex gap-2 text-xs text-mute">
                                        {r.videoUrl && <span className="flex items-center gap-1"><FaFilm /> Video</span>}
                                        {r.instagramUrl && <a href={r.instagramUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-brand"><FaInstagram /> Instagram</a>}
                                    </div>
                                    <div className="flex justify-between gap-1">
                                        <div className="flex gap-1">
                                            <button className={btnSmGhost} onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move earlier"><FaArrowUp /></button>
                                            <button className={btnSmGhost} onClick={() => move(i, 1)} disabled={i === reels.length - 1} aria-label="Move later"><FaArrowDown /></button>
                                        </div>
                                        <div className="flex gap-1">
                                            <button className={btnSmGhost} onClick={() => setEditing(r)} aria-label="Edit"><FaEdit /></button>
                                            <button className={btnSmDanger} onClick={() => remove(r)} aria-label="Delete"><FaTrash /></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {editing && (
                <Modal title="Edit reel" onClose={() => setEditing(null)} wide>
                    <ReelForm reel={editing} onDone={() => { setEditing(null); load(); }} onCancel={() => setEditing(null)} />
                </Modal>
            )}
            {playing && <ReelPlayer reel={playing} onClose={() => setPlaying(null)} />}
        </div>
    );
};

export default ReelsTab;
