import React, { useContext } from 'react';
import { SiteContext } from '../context/SiteContext';
import { FaInstagram } from 'react-icons/fa';
import Logo from './Logo';
import { INSTAGRAM_URL, INSTAGRAM_HANDLE } from '../data/brand';

const Footer = () => {
    const { settings } = useContext(SiteContext);
    const ig = settings.instagram_url || INSTAGRAM_URL;
    return (
    <footer className="border-t border-line mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid gap-10 md:grid-cols-3 items-start">
            <div>
                <Logo />
                <p className="text-mute text-sm mt-5 max-w-xs leading-relaxed">
                    India’s leading collective experience. Club nights, pool parties and festivals across Delhi, Goa and London.
                </p>
            </div>
            <div className="text-sm">
                <p className="eyebrow mb-4">Reservations</p>
                <p className="text-bone/80 leading-relaxed">
                    Guestlist and table bookings are confirmed after profile verification. DM your full name and Instagram ID, or book through the site.
                </p>
            </div>
            <div className="md:text-right">
                <p className="eyebrow mb-4">Follow the movement</p>
                <a href={ig} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-bone hover:text-brand transition text-lg font-semibold">
                    <FaInstagram /> {INSTAGRAM_HANDLE}
                </a>
                {settings.contact_phone && <p className="text-bone/80 text-sm mt-3">{settings.contact_phone}</p>}
                {settings.contact_email && <p className="text-bone/80 text-sm">{settings.contact_email}</p>}
                <p className="text-mute text-xs mt-2">🇮🇳 🇬🇧 🇦🇪 🇺🇸</p>
            </div>
        </div>
        <div className="border-t border-line py-6 text-center text-xs text-mute uppercase tracking-widest">
            &copy; {new Date().getFullYear()} Project X Experience. All rights reserved.
        </div>
    </footer>
    );
};

export default Footer;
