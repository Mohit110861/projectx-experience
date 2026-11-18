import React, { useContext, useEffect, useState } from 'react';
import { FaSave } from 'react-icons/fa';
import api, { mediaUrl } from '../../utils/axios';
import { SiteContext } from '../../context/SiteContext';
import { Field, useNotify, errMsg, btnSmBrand, btnSmDanger } from './ui';

const HeaderTab = () => {
    const notify = useNotify();
    const { settings, setSettings } = useContext(SiteContext);
    const [form, setForm] = useState(settings);
    const [heroImage, setHeroImage] = useState(null);
    const [heroVideo, setHeroVideo] = useState(null);
    const [progress, setProgress] = useState(null);

    useEffect(() => { setForm(settings); }, [settings]);
    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? String(e.target.checked) : e.target.value }));

    const save = async (extra = {}) => {
        const fd = new FormData();
        ['announcement_enabled', 'announcement_text', 'announcement_link', 'hero_eyebrow', 'hero_subtitle', 'hero_cta_text', 'instagram_url', 'contact_phone', 'contact_email']
            .forEach(k => fd.append(k, form[k] ?? ''));
        Object.entries(extra).forEach(([k, v]) => fd.append(k, v));
        if (heroImage) fd.append('heroImage', heroImage);
        if (heroVideo) fd.append('heroVideo', heroVideo);
        setProgress(0);
        try {
            const { data } = await api.put('/settings', fd, { onUploadProgress: (e) => e.total && setProgress(Math.round((e.loaded / e.total) * 100)) });
            setSettings(data);
            setHeroImage(null); setHeroVideo(null);
            notify('Site updated — changes are live');
        } catch (e) { notify(errMsg(e), 'error'); }
        finally { setProgress(null); }
    };

    const submit = (e) => { e.preventDefault(); save(); };

    return (
        <form onSubmit={submit} className="space-y-6">
            <div className="card p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-display uppercase text-2xl">Announcement bar</h2>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" className="accent-[#e3182d] w-4 h-4" checked={form.announcement_enabled === 'true'} onChange={set('announcement_enabled')} /> Show on site
                    </label>
                </div>
                <p className="text-mute text-xs">A red strip at the very top of every page — use it for launches, sold-out alerts and guestlist news.</p>
                <Field label="Text"><input className="field" value={form.announcement_text || ''} onChange={set('announcement_text')} maxLength={160} /></Field>
                <Field label="Link when clicked" hint="e.g. /#upcoming, /events/13 or an https:// link"><input className="field" value={form.announcement_link || ''} onChange={set('announcement_link')} /></Field>
            </div>

            <div className="card p-5 space-y-4">
                <h2 className="font-display uppercase text-2xl">Hero (top of home page)</h2>
                <Field label="Small line above the logo"><input className="field" value={form.hero_eyebrow || ''} onChange={set('hero_eyebrow')} /></Field>
                <Field label="Subtitle"><textarea rows="3" className="field" value={form.hero_subtitle || ''} onChange={set('hero_subtitle')} /></Field>
                <Field label="Main button text"><input className="field" value={form.hero_cta_text || ''} onChange={set('hero_cta_text')} /></Field>

                <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-3">
                        <p className="text-[0.65rem] font-bold uppercase tracking-widest text-mute">Background image</p>
                        {form.hero_image && <img src={mediaUrl(form.hero_image)} alt="" className="w-full aspect-video object-cover rounded-lg border border-line" />}
                        <input type="file" accept="image/*" onChange={e => setHeroImage(e.target.files[0] || null)} className="block w-full text-sm text-mute" />
                        {heroImage && <p className="text-xs text-green-300">New image selected — click Save</p>}
                    </div>
                    <div className="space-y-3">
                        <p className="text-[0.65rem] font-bold uppercase tracking-widest text-mute">Background video (optional, plays muted on loop)</p>
                        {form.hero_video
                            ? <video src={mediaUrl(form.hero_video)} muted loop autoPlay playsInline className="w-full aspect-video object-cover rounded-lg border border-line" />
                            : <div className="w-full aspect-video rounded-lg border border-dashed border-line flex items-center justify-center text-mute text-xs">No video — the image is shown</div>}
                        <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={e => setHeroVideo(e.target.files[0] || null)} className="block w-full text-sm text-mute" />
                        {heroVideo && <p className="text-xs text-green-300">New video selected — click Save</p>}
                        {form.hero_video && <button type="button" className={btnSmDanger} onClick={() => save({ remove_hero_video: 'true' })}>Remove video</button>}
                    </div>
                </div>
            </div>

            <div className="card p-5 grid gap-4 md:grid-cols-3">
                <h2 className="font-display uppercase text-2xl md:col-span-3">Contact & social</h2>
                <Field label="Instagram URL"><input className="field" value={form.instagram_url || ''} onChange={set('instagram_url')} /></Field>
                <Field label="Phone (footer)"><input className="field" value={form.contact_phone || ''} onChange={set('contact_phone')} placeholder="+91 …" /></Field>
                <Field label="Email (footer)"><input className="field" value={form.contact_email || ''} onChange={set('contact_email')} /></Field>
            </div>

            <div className="flex justify-end sticky bottom-4">
                <button className={`${btnSmBrand} !px-6 !py-3 shadow-2xl`} disabled={progress !== null}>
                    <FaSave /> {progress !== null ? `Saving ${progress}%` : 'Save changes'}
                </button>
            </div>
        </form>
    );
};

export default HeaderTab;
