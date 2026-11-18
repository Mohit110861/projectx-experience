import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [showOTP, setShowOTP] = useState(false);
    const [params] = useSearchParams();
    const [error, setError] = useState(params.get('blocked') ? 'Your account has been blocked. Contact Project X.' : '');
    const [loading, setLoading] = useState(false);

    const { login, verifyOTP } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (!showOTP) {
                const data = await login(email, password);
                if (data.role === 'admin') navigate('/admin');
                else navigate('/dashboard');
            } else {
                const data = await verifyOTP(email, otp);
                if (data.role === 'admin') navigate('/admin');
                else navigate('/dashboard');
            }
        } catch (err) {
            if (err.needsVerification) {
                setShowOTP(true);
                setError('Account not verified. A new OTP has been sent to your email.');
            } else {
                setError(err.message || err);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-8 card p-8 md:p-10">
            <div className="text-center mb-8">
                <p className="eyebrow mb-3">Members</p>
                <h2 className="font-display uppercase text-5xl mb-2">Welcome back</h2>
                <p className="text-mute">Log in to book and track your requests</p>
            </div>

            {error && <div className="bg-brand/10 text-brand-soft p-3 rounded-lg mb-6 text-center text-sm border border-brand/30">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">
                {!showOTP ? (
                    <>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-mute mb-2">Email Address</label>
                            <input
                                type="email"
                                required
                                className="field"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-mute mb-2">Password</label>
                            <input
                                type="password"
                                required
                                className="field"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </>
                ) : (
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-mute mb-2">Verification Code (OTP)</label>
                        <input
                            type="text"
                            required
                            placeholder="6-digit code"
                            className="field font-bold tracking-[0.5em] text-center text-lg"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            maxLength="6"
                        />
                    </div>
                )}
                <button
                    type="submit"
                    disabled={loading}
                    className="btn-brand w-full !py-4 mt-2"
                >
                    {loading ? 'Processing...' : (showOTP ? 'Verify OTP & Log In' : 'Sign In')}
                </button>
            </form>

            <p className="text-center mt-8 text-mute text-sm">
                Don't have an account? <Link to="/register" className="text-bone font-bold hover:text-brand">Sign up</Link>
            </p>
        </div>
    );
};

export default Login;
