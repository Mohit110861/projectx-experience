import React, { useState, useEffect, useMemo, useContext } from 'react';
import { Link } from 'react-router-dom';
import api, { mediaUrl } from '../utils/axios';
import { SiteContext } from '../context/SiteContext';
import ReelPlayer from '../components/ReelPlayer';
import { FaMapMarkerAlt, FaSearch, FaPlay, FaInstagram, FaArrowRight } from 'react-icons/fa';
import { HERO_POSTER, SERIES, STATS, INSTAGRAM_URL as DEFAULT_IG } from '../data/brand';

const fmtDay = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit' });
const fmtMon = (d) => new Date(d).toLocaleDateString('en-IN', { month: 'short' }).toUpperCase();
const fmtFull = (d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

const SectionHead = ({ eyebrow, title, children }) => (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
        <div>
            <p className="eyebrow mb-3">{eyebrow}</p>
            <h2 className="font-display uppercase text-4xl md:text-6xl leading-none">{title}</h2>
        </div>
        {children}
    </div>
);

const UpcomingCard = ({ event }) => {
    const soldOut = event.availableSeats <= 0;
    return (
        <Link to={`/events/${event._id}`} className="group card overflow-hidden flex flex-col hover:border-brand/60 transition">
            <div className="relative aspect-[4/5] overflow-hidden bg-raised">
                {event.image && <img src={mediaUrl(event.image)} alt={event.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
                <div className="absolute top-4 left-4 bg-ink/90 border border-line rounded-xl px-3 py-2 text-center leading-none">
                    <p className="font-display text-3xl">{fmtDay(event.date)}</p>
                    <p className="text-[0.65rem] font-bold tracking-widest text-brand mt-1">{fmtMon(event.date)}</p>
                </div>
                <span className="absolute top-4 right-4 bg-brand text-white text-[0.65rem] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
                    {soldOut ? 'Sold out' : event.category}
                </span>
                <div className="absolute bottom-0 inset-x-0 p-5">
                    <h3 className="font-display uppercase text-3xl leading-none mb-2">{event.title}</h3>
                    <p className="text-bone/80 text-sm flex items-center gap-2"><FaMapMarkerAlt className="text-brand shrink-0" />{event.location}</p>
                </div>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
                <div>
                    <p className="text-[0.65rem] uppercase tracking-widest text-mute">Entry from</p>
                    <p className="font-semibold">{event.ticketPrice === 0 ? 'Guestlist' : `₹${event.ticketPrice.toLocaleString('en-IN')}`}</p>
                </div>
                <span className="text-sm font-semibold uppercase tracking-widest text-brand flex items-center gap-2 group-hover:gap-3 transition-all">
                    {soldOut ? 'Details' : 'Book'} <FaArrowRight />
                </span>
            </div>
        </Link>
    );
};

const Home = () => {
    const [events, setEvents] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [videoOk, setVideoOk] = useState(true);
    const [gallery, setGallery] = useState([]);
    const [reels, setReels] = useState([]);
    const [playing, setPlaying] = useState(null);
    const { settings } = useContext(SiteContext);
    const INSTAGRAM_URL = settings.instagram_url || DEFAULT_IG;
    const heroImage = mediaUrl(settings.hero_image) || HERO_POSTER;
    const heroVideo = mediaUrl(settings.hero_video);

    useEffect(() => {
        api.get('/gallery').then(r => setGallery(r.data)).catch(() => {});
        api.get('/reels').then(r => setReels(r.data)).catch(() => {});
    }, []);
    useEffect(() => setVideoOk(true), [heroVideo]);

    useEffect(() => {
        const t = setTimeout(async () => {
            try {
                const { data } = await api.get(`/events?search=${encodeURIComponent(search)}`);
                setEvents(data);
            } catch (error) {
                console.error('Error fetching events:', error);
            } finally {
                setLoading(false);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [search]);

    const { upcoming, past } = useMemo(() => {
        const now = Date.now();
        return {
            upcoming: events.filter(e => new Date(e.date).getTime() >= now).sort((a, b) => new Date(a.date) - new Date(b.date)),
            past: events.filter(e => new Date(e.date).getTime() < now).sort((a, b) => new Date(b.date) - new Date(a.date)),
        };
    }, [events]);

    return (
        <div>
            {/* Hero */}
            <section className="relative min-h-[92vh] flex items-end overflow-hidden">
                {heroVideo && videoOk ? (
                    <video key={heroVideo} className="absolute inset-0 w-full h-full object-cover" autoPlay muted loop playsInline poster={heroImage} src={heroVideo} onError={() => setVideoOk(false)} />
                ) : (
                    <img src={heroImage} alt="Project X crowd" className="absolute inset-0 w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-black/40" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />
                <div className="relative max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-20 pt-32">
                    <p className="eyebrow mb-5">{settings.hero_eyebrow || 'India’s leading collective experience'}</p>
                    <h1 className="font-display uppercase leading-[0.85] text-[18vw] md:text-[10rem] tracking-tight">
                        Project<span className="text-brand">X</span>
                    </h1>
                    <p className="uppercase tracking-[0.6em] text-bone/80 text-xs md:text-sm font-semibold mt-3 mb-8">Experience</p>
                    <p className="max-w-xl text-bone/80 text-lg mb-10 leading-relaxed">
                        {settings.hero_subtitle || 'Club nights, pool parties and festivals that sell out in hours. Delhi, Goa, London. You had to be there.'}
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <a href="#upcoming" className="btn-brand">{settings.hero_cta_text || 'Get on the list'}</a>
                        <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="btn-ghost"><FaInstagram /> Watch the reels</a>
                    </div>
                </div>
            </section>

            {/* Series marquee */}
            <div className="border-y border-line bg-surface overflow-hidden py-4" aria-hidden="true">
                <div className="flex w-max animate-marquee">
                    {[...SERIES, ...SERIES].map((s, i) => (
                        <span key={i} className="font-display uppercase text-2xl px-6 text-bone/70 flex items-center gap-6">
                            {s} <span className="text-brand">✕</span>
                        </span>
                    ))}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Upcoming */}
                <section id="upcoming" className="pt-24 scroll-mt-24">
                    <SectionHead eyebrow="Book now" title="Upcoming">
                        <div className="relative w-full md:w-80">
                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-mute" />
                            <input type="text" placeholder="Search events" className="field !pl-11 !rounded-full" value={search} onChange={(e) => setSearch(e.target.value)} />
                        </div>
                    </SectionHead>
                    {loading ? (
                        <p className="text-mute py-16 text-center">Loading events…</p>
                    ) : upcoming.length === 0 ? (
                        <div className="card p-12 text-center">
                            <p className="font-display uppercase text-3xl mb-3">Something’s coming</p>
                            <p className="text-mute mb-6">No dates announced{search ? ' for that search' : ''} yet. Follow us to be first on the list.</p>
                            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="btn-brand"><FaInstagram /> Follow @projectx.exp</a>
                        </div>
                    ) : (
                        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                            {upcoming.map(e => <UpcomingCard key={e._id} event={e} />)}
                        </div>
                    )}
                </section>

                {/* Stats */}
                <section className="grid grid-cols-2 md:grid-cols-4 gap-px bg-line border border-line rounded-2xl overflow-hidden mt-24">
                    {STATS.map(s => (
                        <div key={s.label} className="bg-ink p-8">
                            <p className="font-display text-5xl text-brand">{s.value}</p>
                            <p className="text-mute text-sm mt-2">{s.label}</p>
                        </div>
                    ))}
                </section>

                {/* Gallery */}
                {gallery.length > 0 && <section id="gallery" className="pt-24 scroll-mt-24">
                    <SectionHead eyebrow="You had to be there" title="The Gallery" />
                    <div className="columns-2 md:columns-3 lg:columns-4 gap-3">
                        {gallery.map((g) => (
                            <figure key={g._id} className="relative overflow-hidden rounded-xl group mb-3 break-inside-avoid border border-line">
                                <img src={mediaUrl(g.imageUrl)} alt={g.caption || 'Project X'} loading="lazy" className="w-full h-auto block group-hover:scale-105 transition duration-700" />
                                {g.caption && <figcaption className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 to-transparent text-xs uppercase tracking-widest font-semibold opacity-0 group-hover:opacity-100 transition">
                                    {g.caption}
                                </figcaption>}
                            </figure>
                        ))}
                    </div>
                </section>}

                {/* Reels */}
                {reels.length > 0 && (
                <section className="pt-24">
                    <SectionHead eyebrow="Press play" title="Reels">
                        <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="btn-ghost self-start"><FaInstagram /> All reels</a>
                    </SectionHead>
                    <div className="thin-scrollbar flex gap-4 overflow-x-auto pb-4 snap-x">
                        {reels.map(r => (
                            <button key={r._id} type="button" onClick={() => setPlaying(r)} className="relative shrink-0 w-56 md:w-64 aspect-[9/16] rounded-2xl overflow-hidden group snap-start border border-line bg-raised text-left">
                                {r.coverUrl ? <img src={mediaUrl(r.coverUrl)} alt={r.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
                                    : r.videoUrl ? <video src={mediaUrl(r.videoUrl)} preload="metadata" muted playsInline className="w-full h-full object-cover" /> : null}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-brand/90 group-hover:bg-brand flex items-center justify-center text-white text-lg">
                                    <FaPlay className="ml-1" />
                                </span>
                                <p className="absolute bottom-0 p-4 text-sm font-semibold leading-snug">{r.title}</p>
                            </button>
                        ))}
                    </div>
                </section>
                )}

                {/* Past */}
                {past.length > 0 && (
                    <section id="past" className="pt-24 scroll-mt-24">
                        <SectionHead eyebrow="The archive" title="Past Experiences" />
                        <div className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {past.map(e => (
                                <Link key={e._id} to={`/events/${e._id}`} className="group">
                                    <div className="aspect-[4/5] rounded-xl overflow-hidden border border-line bg-raised">
                                        {e.image && <img src={mediaUrl(e.image)} alt={e.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />}
                                    </div>
                                    <p className="text-xs text-brand font-bold uppercase tracking-widest mt-3">{fmtFull(e.date)}</p>
                                    <p className="font-semibold mt-1 group-hover:text-brand transition">{e.title}</p>
                                    <p className="text-mute text-sm">{e.location}</p>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </div>
            {playing && <ReelPlayer reel={playing} onClose={() => setPlaying(null)} />}
        </div>
    );
};

export default Home;
