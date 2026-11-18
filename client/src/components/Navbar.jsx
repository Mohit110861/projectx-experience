import React, { useContext, useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaInstagram, FaBars, FaTimes } from 'react-icons/fa';
import Logo from './Logo';
import { INSTAGRAM_URL as DEFAULT_IG } from '../data/brand';
import { SiteContext } from '../context/SiteContext';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const { settings } = useContext(SiteContext);
    const INSTAGRAM_URL = settings.instagram_url || DEFAULT_IG;
    const showBar = settings.announcement_enabled === 'true' && settings.announcement_text;
    const navigate = useNavigate();
    const location = useLocation();
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        onScroll();
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => setOpen(false), [location.pathname]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const linkClass = ({ isActive }) =>
        `text-sm uppercase tracking-widest font-semibold transition ${isActive ? 'text-brand' : 'text-bone/80 hover:text-bone'}`;

    const links = (
        <>
            <a href="/#upcoming" className="text-sm uppercase tracking-widest font-semibold text-bone/80 hover:text-bone transition">Events</a>
            <a href="/#gallery" className="text-sm uppercase tracking-widest font-semibold text-bone/80 hover:text-bone transition">Gallery</a>
            {user && (
                <NavLink to={user.role === 'admin' ? '/admin' : '/dashboard'} className={linkClass}>
                    {user.role === 'admin' ? 'Admin' : 'My Tickets'}
                </NavLink>
            )}
            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" aria-label="Project X on Instagram" className="text-bone/80 hover:text-brand transition text-xl">
                <FaInstagram />
            </a>
            {user ? (
                <button onClick={handleLogout} className="btn-ghost !py-2 !px-5">Logout</button>
            ) : (
                <>
                    <NavLink to="/login" className={linkClass}>Login</NavLink>
                    <Link to="/register" className="btn-brand !py-2 !px-5">Join the List</Link>
                </>
            )}
        </>
    );

    return (
        <nav className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${scrolled || open ? 'bg-ink/95 backdrop-blur border-b border-line' : 'bg-gradient-to-b from-black/70 to-transparent'}`}>
            {showBar && (
                <a href={settings.announcement_link || '/#upcoming'} className="block bg-brand text-white text-center text-xs sm:text-sm font-semibold tracking-wide py-2 px-4 hover:bg-brand-dark transition">
                    {settings.announcement_text}
                </a>
            )}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                <Link to="/" aria-label="Project X home"><Logo /></Link>
                <div className="hidden md:flex items-center gap-7">{links}</div>
                <button className="md:hidden text-bone text-2xl" onClick={() => setOpen(!open)} aria-label="Toggle menu">
                    {open ? <FaTimes /> : <FaBars />}
                </button>
            </div>
            {open && <div className="md:hidden flex flex-col items-start gap-5 px-6 pb-6">{links}</div>}
        </nav>
    );
};

export default Navbar;
