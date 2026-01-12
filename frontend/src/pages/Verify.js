import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';

function Verify() {
    const { id } = useParams();
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verify = async () => {
            try {
                const res = await api.get(`/verify/${id}`);
                setResult(res.data);
            } catch (err) {
                setError(err.response?.data || 'Verification Failed');
            } finally {
                setLoading(false);
            }
        };
        verify();
    }, [id]);

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
            <div className="card" style={{ width: '500px', textAlign: 'center' }}>
                <h2>Public Verification Ledger</h2>

                {loading && <div className="loader"></div>}

                {error && (
                    <div style={{ marginTop: '20px' }}>
                        <div style={{ fontSize: '3rem' }}>❌</div>
                        <h3 style={{ color: 'var(--error)' }}>Verification Failed</h3>
                        <p>{error}</p>
                    </div>
                )}

                {result && (
                    <div style={{ marginTop: '20px' }}>
                        <div style={{ fontSize: '3rem' }}>
                            {result.valid ? '✅' : '⚠️'}
                        </div>
                        <h3 style={{ color: result.valid ? 'var(--success)' : 'var(--error)' }}>
                            {result.valid ? 'Authentic Idea' : 'Integrity Compromised'}
                        </h3>

                        <div style={{ textAlign: 'left', marginTop: '30px', background: 'var(--input-bg)', padding: '15px', borderRadius: '8px' }}>
                            <div style={{ marginBottom: '10px' }}>
                                <small style={{ color: 'var(--secondary)' }}>Owner Identity</small>
                                <div style={{ fontWeight: 'bold' }}>{result.owner}</div>
                            </div>
                            <div>
                                <small style={{ color: 'var(--secondary)' }}>Data Hash (SHA-256)</small>
                                <div style={{ fontFamily: 'monospace', wordBreak: 'break-all', fontSize: '0.9rem' }}>
                                    {result.hash}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Verify;
