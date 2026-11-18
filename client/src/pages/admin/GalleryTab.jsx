import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FaCloudUploadAlt, FaTrash, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import api, { mediaUrl } from '../../utils/axios';
import { Field, Empty, useNotify, errMsg, btnSmBrand, btnSmGhost, btnSmDanger } from './ui';

const GalleryTab = () => {
    const notify = useNotify();
    const [items, setItems] = useState([]);
    const [files, setFiles] = useState([]);
    const [caption, setCaption] = useState('');
    const [progress, setProgress] = useState(null);
    const [drag, setDrag] = useState(false);
    const inputRef = useRef();

    const load = useCallback(async () => {
        try { const { data } = await api.get('/gallery'); setItems(data); } catch (e) { notify(errMsg(e), 'error'); }
    }, [notify]);
    useEffect(() => { load(); }, [load]);

    // previews for the selected files
    const [previews, setPreviews] = useState([]);
    useEffect(() => {
        const urls = files.map(f => URL.createObjectURL(f));
        setPreviews(urls);
        return () => urls.forEach(u => URL.revokeObjectURL(u));
    }, [files]);

    const pick = (list) => setFiles(prev => [...prev, ...Array.from(list).filter(f => f.type.startsWith('image/'))].slice(0, 30));

    const upload = async () => {
        if (!files.length) return;
        const fd = new FormData();
        files.forEach(f => fd.append('images', f));
        fd.append('caption', caption);
        setProgress(0);
        try {
            const { data } = await api.post('/gallery', fd, { onUploadProgress: (e) => e.total && setProgress(Math.round((e.loaded / e.total) * 100)) });
            notify(data.message);
            setFiles([]); setCaption('');
            load();
        } catch (e) { notify(errMsg(e, 'Upload failed'), 'error'); }
        finally { setProgress(null); }
    };

    const saveCaption = async (item, value) => {
        if (value === item.caption) return;
        try { await api.put(`/gallery/${item._id}`, { caption: value }); notify('Caption saved'); load(); } catch (e) { notify(errMsg(e), 'error'); }
    };

    const move = async (index, dir) => {
        const j = index + dir;
        if (j < 0 || j >= items.length) return;
        const a = items[index], b = items[j];
        try {
            // write a clean 0..n order with the two items swapped
            const order = items.map(i => i._id);
            [order[index], order[j]] = [order[j], order[index]];
            await Promise.all([api.put(`/gallery/${a._id}`, { sortOrder: order.indexOf(a._id) }), api.put(`/gallery/${b._id}`, { sortOrder: order.indexOf(b._id) })]);
            await Promise.all(order.map((id, i) => (id !== a._id && id !== b._id) ? api.put(`/gallery/${id}`, { sortOrder: i }) : null));
            load();
        } catch (e) { notify(errMsg(e), 'error'); }
    };

    const remove = async (item) => {
        if (!window.confirm('Delete this photo from the gallery?')) return;
        try { await api.delete(`/gallery/${item._id}`); notify('Photo deleted'); load(); } catch (e) { notify(errMsg(e), 'error'); }
    };

    return (
        <div className="space-y-8">
            <div className="card p-5 space-y-4">
                <h2 className="font-display uppercase text-2xl">Upload photos</h2>
                <div
                    onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                    onDragLeave={() => setDrag(false)}
                    onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files); }}
                    onClick={() => inputRef.current.click()}
                    className={`cursor-pointer border-2 border-dashed rounded-xl p-8 text-center transition ${drag ? 'border-brand bg-brand/10' : 'border-line hover:border-bone/40'}`}>
                    <FaCloudUploadAlt className="mx-auto text-4xl text-brand mb-3" />
                    <p className="font-semibold">Drop photos here or click to choose</p>
                    <p className="text-mute text-xs mt-1">JPG, PNG or WEBP · up to 30 at once</p>
                    <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => { pick(e.target.files); e.target.value = ''; }} />
                </div>

                {files.length > 0 && (
                    <>
                        <div className="flex gap-3 overflow-x-auto pb-2">
                            {previews.map((src, i) => (
                                <div key={src} className="relative shrink-0">
                                    <img src={src} alt="" className="h-24 w-20 object-cover rounded-lg border border-line" />
                                    <button onClick={() => setFiles(f => f.filter((_, k) => k !== i))} className="absolute -top-2 -right-2 bg-brand text-white w-6 h-6 rounded-full text-xs" aria-label="Remove">✕</button>
                                </div>
                            ))}
                        </div>
                        <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-end">
                            <Field label="Caption (applies to all selected)"><input className="field" value={caption} onChange={e => setCaption(e.target.value)} placeholder="e.g. Pop & Plunge 3.0 · Atrio by Devam" /></Field>
                            <button className={btnSmBrand} onClick={upload} disabled={progress !== null}>
                                {progress !== null ? `Uploading ${progress}%` : `Upload ${files.length} photo${files.length > 1 ? 's' : ''}`}
                            </button>
                        </div>
                    </>
                )}
            </div>

            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display uppercase text-2xl">On the site ({items.length})</h2>
                    <p className="text-mute text-xs">First photo shows first. Edit a caption and click away to save.</p>
                </div>
                {items.length === 0 ? <Empty>No photos yet.</Empty> : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                        {items.map((g, i) => (
                            <div key={g._id} className="card overflow-hidden flex flex-col">
                                <img src={mediaUrl(g.imageUrl)} alt={g.caption} className="w-full aspect-[4/5] object-cover bg-raised" loading="lazy" />
                                <div className="p-3 space-y-2">
                                    <input className="field !py-2 text-sm" defaultValue={g.caption} placeholder="Caption" onBlur={(e) => saveCaption(g, e.target.value)} />
                                    <div className="flex justify-between gap-2">
                                        <div className="flex gap-1">
                                            <button className={btnSmGhost} onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move earlier"><FaArrowLeft /></button>
                                            <button className={btnSmGhost} onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move later"><FaArrowRight /></button>
                                        </div>
                                        <button className={btnSmDanger} onClick={() => remove(g)} aria-label="Delete"><FaTrash /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GalleryTab;
