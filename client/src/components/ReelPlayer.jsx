import React, { useEffect } from 'react';
import { FaTimes, FaInstagram } from 'react-icons/fa';
import { mediaUrl } from '../utils/axios';

// https://www.instagram.com/<user>/reel/<code>/ -> https://www.instagram.com/reel/<code>/embed/
export const instagramEmbed = (url) => {
    const m = url?.match(/instagram\.com\/(?:[^/]+\/)?(reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i);
    if (!m) return null;
    const kind = m[1].toLowerCase() === 'reels' ? 'reel' : m[1].toLowerCase();
    return `https://www.instagram.com/${kind}/${m[2]}/embed/`;
};

// Full-screen player: plays the uploaded video, otherwise embeds the Instagram reel
const ReelPlayer = ({ reel, onClose }) => {
    useEffect(() => {
        const onKey = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
    }, [onClose]);

    const embed = !reel.videoUrl && instagramEmbed(reel.instagramUrl);

    return (
        <div className="fixed inset-0 z-[80] bg-black/90 backdrop-blur flex items-center justify-center p-4" onClick={onClose}>
            <div className="relative w-full max-w-[420px]" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={reel.title}>
                <button onClick={onClose} className="absolute -top-11 right-0 text-bone/80 hover:text-bone text-2xl" aria-label="Close"><FaTimes /></button>
                <div className="rounded-2xl overflow-hidden border border-line bg-ink">
                    {reel.videoUrl ? (
                        <video src={mediaUrl(reel.videoUrl)} poster={mediaUrl(reel.coverUrl) || undefined} controls autoPlay playsInline className="w-full max-h-[75vh] bg-black" />
                    ) : embed ? (
                        <iframe src={embed} title={reel.title} className="w-full h-[75vh] max-h-[720px] bg-white" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen loading="lazy" />
                    ) : (
                        <img src={mediaUrl(reel.coverUrl)} alt={reel.title} className="w-full" />
                    )}
                </div>
                <div className="flex items-center justify-between gap-3 mt-4">
                    <p className="font-semibold text-sm">{reel.title}</p>
                    {reel.instagramUrl && (
                        <a href={reel.instagramUrl} target="_blank" rel="noreferrer" className="btn-brand !py-2 !px-4 shrink-0"><FaInstagram /> Open on Instagram</a>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReelPlayer;
