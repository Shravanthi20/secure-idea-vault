import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleCredentialsSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/auth/login', { email, password });
            setStep(2);
        } catch (err) {
            setError(err.response?.data || 'Login failed');
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await api.post('/auth/verify-otp', { email, otp });
            login(res.data.token);
            navigate('/');
        } catch (err) {
            setError(err.response?.data || 'Invalid OTP');
        }
    };

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
            <div className="card" style={{ width: '400px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
                    {step === 1 ? 'Login to Vault' : 'Enter OTP'}
                </h2>

                {error && <div style={{ color: 'var(--error)', marginBottom: '10px', textAlign: 'center' }}>{error}</div>}

                {step === 1 ? (
                    <form onSubmit={handleCredentialsSubmit}>
                        <div className="input-group">
                            <label>Email</label>
                            <input
                                type="email"
                                className="input-control"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label>Password</label>
                            <input
                                type="password"
                                className="input-control"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                            Get OTP
                        </button>
                        <p style={{ textAlign: 'center', marginTop: '1rem', color: 'var(--secondary)' }}>
                            New here? <Link to="/register">Create Account</Link>
                        </p>
                    </form>
                ) : (
                    <form onSubmit={handleOtpSubmit}>
                        <div className="input-group">
                            <label>One-Time Password (OTP)</label>
                            <input
                                type="text"
                                className="input-control"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="Check your email"
                                required
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                            Verify & Login
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ width: '100%', marginTop: '10px' }}
                            onClick={() => setStep(1)}
                        >
                            Back
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default Login;
