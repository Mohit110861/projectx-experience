import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import EventDetail from './pages/EventDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailed from './pages/PaymentFailed';

// Inner pages sit below the fixed navbar; dashboards keep their original markup with a dark skin
const Page = ({ children, legacy = false }) => (
    <div className={`max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-36 pb-12 ${legacy ? 'legacy-dark' : ''}`}>{children}</div>
);

const ScrollToTop = () => {
    const { pathname, hash } = useLocation();
    useEffect(() => {
        if (hash) {
            const el = document.getElementById(hash.slice(1));
            if (el) { el.scrollIntoView(); return; }
        }
        window.scrollTo(0, 0);
    }, [pathname, hash]);
    return null;
};

function App() {
    return (
        <Router>
            <ScrollToTop />
            <div className="min-h-screen bg-ink text-bone flex flex-col">
                <Navbar />
                <main className="flex-grow">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/events/:id" element={<EventDetail />} />
                        <Route path="/login" element={<Page><Login /></Page>} />
                        <Route path="/register" element={<Page><Register /></Page>} />
                        <Route path="/dashboard" element={<Page legacy><UserDashboard /></Page>} />
                        <Route path="/admin" element={<Page><AdminDashboard /></Page>} />
                        <Route path="/payment-success" element={<Page legacy><PaymentSuccess /></Page>} />
                        <Route path="/payment-failed" element={<Page legacy><PaymentFailed /></Page>} />
                        <Route path="*" element={
                            <Page>
                                <div className="text-center py-24">
                                    <p className="font-display text-8xl text-brand">404</p>
                                    <p className="text-mute mt-4 mb-8">This party doesn’t exist.</p>
                                    <Link to="/" className="btn-brand">Back to events</Link>
                                </div>
                            </Page>
                        } />
                    </Routes>
                </main>
                <Footer />
            </div>
        </Router>
    );
}

export default App;
