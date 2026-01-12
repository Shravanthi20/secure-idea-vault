import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function Dashboard() {
    const { user, logout } = useAuth();
    const [searchId, setSearchId] = useState('');
    const [ideaData, setIdeaData] = useState(null);
    const [myIdeas, setMyIdeas] = useState([]);
    const [sharedIdeas, setSharedIdeas] = useState([]); // New state
    const [error, setError] = useState('');
    const [qrCode, setQrCode] = useState(null);

    React.useEffect(() => {
        fetchMyIdeas();
    }, []);

    const fetchMyIdeas = async () => {
        try {
            const res = await api.get('/ideas');
            // Support both old array format (fallback) and new object format
            if (Array.isArray(res.data)) {
                setMyIdeas(res.data);
            } else {
                setMyIdeas(res.data.owned || []);
                setSharedIdeas(res.data.shared || []);
            }
        } catch (err) {
            console.error("Failed to fetch list", err);
        }
    };

    const fetchIdea = async (eOrId) => {
        if (eOrId && eOrId.preventDefault) eOrId.preventDefault();
        const id = eOrId && eOrId.preventDefault ? searchId : eOrId; // Handle event or direct ID

        setError('');
        setIdeaData(null);
        setQrCode(null);
        try {
            const res = await api.get(`/ideas/${id}`);
            setIdeaData(res.data);
            setSearchId(id); // update input if clicked from list
        } catch (err) {
            setError(err.response?.data || 'Idea not found or access denied');
        }
    };

    const generateQr = async (id) => {
        try {
            const res = await api.get(`/ideas/${id}/qrcode`);
            setQrCode(res.data.qrCode);
        } catch (err) {
            alert("Failed to generate QR");
        }
    };

    const downloadFile = async (id) => {
        try {
            const response = await api.get(`/ideas/download/${id}`, { responseType: 'blob' });
            // Create a blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `secure-idea-${id}.txt`); // Default filename
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Download failed", err);
            alert("Download failed. You might not have permission.");
        }
    };

    return (
        <div>
            <nav className="navbar">
                <div className="nav-brand">Secure Idea Vault</div>
                <div className="nav-links">
                    <span>Welcome, {user?.role}</span>
                    <button className="btn btn-secondary" onClick={logout}>Logout</button>
                </div>
            </nav>

            <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>

                {/* Sidebar List */}
                <div className="card">
                    <h3>My Safe Box</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>Your secured intellectual property.</p>
                    <div style={{ marginTop: '15px', maxHeight: '60vh', overflowY: 'auto' }}>

                        <h4 style={{ marginTop: '0px', color: '#4ade80' }}>Owned by Me</h4>
                        {myIdeas.length === 0 && <p style={{ fontSize: '0.8rem' }}>No uploaded ideas.</p>}
                        {myIdeas.map(idea => (
                            <div
                                key={idea._id}
                                onClick={() => fetchIdea(idea._id)}
                                style={{
                                    padding: '10px',
                                    borderBottom: '1px solid var(--border-color)',
                                    cursor: 'pointer',
                                    background: searchId === idea._id ? 'var(--input-bg)' : 'transparent'
                                }}
                            >
                                <div style={{ fontWeight: 'bold', fontSize: '0.9rem', wordBreak: 'break-all' }}>ID: {idea._id}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
                                    {new Date(idea.timestamp || idea.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        ))}

                        <h4 style={{ marginTop: '20px', color: '#fbbf24' }}>Shared with Me</h4>
                        {sharedIdeas.length === 0 && <p style={{ fontSize: '0.8rem' }}>No shared ideas.</p>}
                        {sharedIdeas.map(idea => (
                            <div
                                key={idea._id}
                                onClick={() => fetchIdea(idea._id)}
                                style={{
                                    padding: '10px',
                                    borderBottom: '1px solid var(--border-color)',
                                    cursor: 'pointer',
                                    background: searchId === idea._id ? 'var(--input-bg)' : 'transparent'
                                }}
                            >
                                <div style={{ fontWeight: 'bold', fontSize: '0.9rem', wordBreak: 'break-all' }}>ID: {idea._id}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
                                    {new Date(idea.timestamp || idea.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h1>Dashboard</h1>
                        <Link to="/upload" className="btn btn-primary">
                            + New Submission
                        </Link>
                    </div>

                    <div className="card">
                        <h3>Decrypt & View</h3>
                        <form onSubmit={fetchIdea} style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <input
                                className="input-control"
                                placeholder="Paste Idea ID manually..."
                                value={searchId}
                                onChange={(e) => setSearchId(e.target.value)}
                            />
                            <button type="submit" className="btn btn-primary">Decrypt</button>
                        </form>
                        {error && <p style={{ color: 'var(--error)', marginTop: '10px' }}>{error}</p>}
                    </div>

                    {ideaData && (
                        <div className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <h2>Idea Content</h2>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button className="btn btn-primary" onClick={() => generateQr(searchId)}>
                                        Generate Ownership QR
                                    </button>
                                    <button className="btn btn-secondary" onClick={() => downloadFile(searchId)}>
                                        Download Original
                                    </button>
                                </div>
                            </div>
                            <hr style={{ borderColor: 'var(--border-color)' }} />
                            <pre style={{
                                background: 'black',
                                padding: '15px',
                                borderRadius: '8px',
                                whiteSpace: 'pre-wrap',
                                color: '#4ade80',
                                maxHeight: '400px',
                                overflow: 'auto'
                            }}>
                                {typeof ideaData === 'string' ? ideaData : JSON.stringify(ideaData, null, 2)}
                            </pre>

                            {qrCode && (
                                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                                    <h4>Proof of Ownership QR</h4>
                                    <img src={qrCode} alt="Idea QR Code" style={{ border: '10px solid white', borderRadius: '8px' }} />
                                    <p style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>
                                        Scan to verify digital signature and ownership.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
