import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [showOTP, setShowOTP] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register, verifyOTP } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (!showOTP) {
                await register(name, email, password);
                setShowOTP(true);
                setError('');
            } else {
                await verifyOTP(email, otp);
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-8 card p-8 md:p-10">
            <div className="text-center mb-8">
                <p className="eyebrow mb-3">Guestlist</p>
                <h2 className="font-display uppercase text-5xl mb-2">Join the list</h2>
                <p className="text-mute">Create your Project X account</p>
            </div>

            {error && <div className="bg-brand/10 text-brand-soft p-3 rounded-lg mb-6 text-center text-sm border border-brand/30">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-5">
                {!showOTP ? (
                    <>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-mute mb-2">Full Name</label>
                            <input
                                type="text"
                                required
                                className="field"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
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
                        <p className="text-sm text-green-400 bg-green-500/10 p-3 mb-4 rounded-lg border border-green-500/30">
                            An OTP has been sent to your email. Please verify your account.
                        </p>
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
                    {loading ? 'Processing...' : (showOTP ? 'Verify & Complete' : 'Sign Up')}
                </button>
            </form>

            {!showOTP && (
                <p className="text-center mt-6 text-mute text-sm">
                    Already have an account? <Link to="/login" className="text-bone font-bold hover:text-brand">Sign in</Link>
                </p>
            )}
        </div>
    );
};

export default Register;
