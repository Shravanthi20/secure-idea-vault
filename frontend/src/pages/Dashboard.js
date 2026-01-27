import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [searchId, setSearchId] = useState('');
    const [ideaData, setIdeaData] = useState(null);
    const [myIdeas, setMyIdeas] = useState([]); // Flat list
    const [sharedIdeas, setSharedIdeas] = useState([]); // Flat list
    const [error, setError] = useState('');
    const [qrCode, setQrCode] = useState(null);

    React.useEffect(() => {
        fetchMyIdeas();
    }, []);

    const fetchMyIdeas = async () => {
        try {
            const res = await api.get('/ideas');
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

    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [auditLogs, setAuditLogs] = useState(null); // null means not loaded or denied
    const [showAudit, setShowAudit] = useState(false);

    const [showAccessModal, setShowAccessModal] = useState(false);
    const [accessList, setAccessList] = useState([]);
    const [accessEmail, setAccessEmail] = useState('');
    const [accessPerms, setAccessPerms] = useState({ Idea: true, Comment: false, AuditLog: false });

    // ... fetchMyIdeas ...

    const openAccessModal = async (ideaId) => {
        try {
            const res = await api.get(`/acl/${ideaId}`);
            setAccessList(res.data);
            setShowAccessModal(true);
        } catch (err) {
            alert("Failed to load access list");
        }
    };

    const closeAccessModal = () => {
        setShowAccessModal(false);
        setAccessEmail('');
        setAccessPerms({ Idea: true, Comment: false, AuditLog: false });
    };

    const handleGrantAccess = async () => {
        if (!accessEmail) return alert("Enter email");
        const permissions = [];
        if (accessPerms.Idea) permissions.push({ objectType: 'Idea', permission: 'VIEW' });
        if (accessPerms.Comment) permissions.push({ objectType: 'Comment', permission: 'VIEW' });
        if (accessPerms.AuditLog) permissions.push({ objectType: 'AuditLog', permission: 'VIEW' });

        if (permissions.length === 0) return alert("Select at least one permission");

        try {
            await api.post(`/acl/${searchId}`, { email: accessEmail, permissions });
            setAccessEmail('');
            // Refresh list
            const res = await api.get(`/acl/${searchId}`);
            setAccessList(res.data);
            alert("Access granted!");
        } catch (err) {
            alert(err.response?.data || "Failed to grant access");
        }
    };

    const handleRevokeAccess = async (aclId) => {
        if (!window.confirm("Revoke this permission?")) return;
        try {
            await api.delete(`/acl/${aclId}`);
            // Refresh list
            const res = await api.get(`/acl/${searchId}`);
            setAccessList(res.data);
        } catch (err) {
            alert("Failed to revoke access");
        }
    };

    const fetchIdea = async (eOrId) => {
        if (eOrId && eOrId.preventDefault) eOrId.preventDefault();
        const id = eOrId && eOrId.preventDefault ? searchId : eOrId; // Handle event or direct ID

        setError('');
        setIdeaData(null);
        setQrCode(null);
        setComments([]);
        setAuditLogs(null);
        setShowAudit(false);

        try {
            // 1. Fetch Idea Content
            const res = await api.get(`/ideas/${id}`);
            setIdeaData(res.data);
            setSearchId(id); // update input if clicked from list

            // 2. Fetch Comments (Object 2) - Fail gracefully if 403
            try {
                const commRes = await api.get(`/ideas/${id}/comments`);
                setComments(commRes.data);
            } catch (ignore) {
                console.log("No comment access");
            }

        } catch (err) {
            setError(err.response?.data || 'Idea not found or access denied');
        }
    };

    const handlePostComment = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/ideas/${searchId}/comments`, { text: newComment });
            setNewComment('');
            // Refresh comments
            const commRes = await api.get(`/ideas/${searchId}/comments`);
            setComments(commRes.data);
        } catch (err) {
            alert("Failed to post comment. You might not have permission.");
        }
    };

    const fetchAuditLogs = async () => {
        try {
            const res = await api.get(`/ideas/${searchId}/audit`);
            setAuditLogs(res.data);
            setShowAudit(true);
        } catch (err) {
            alert("Access Denied: You do not have permission to view Audit Logs.");
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
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `secure-decrypted-file-${id}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Download failed", err);
            alert("Download failed. You might not have permission.");
        }
    };

    // Helper to group ideas by rootIdeaId
    const groupIdeas = (ideasList) => {
        const groups = {};
        ideasList.forEach(idea => {
            const rootId = idea.rootIdeaId || idea._id; // Fallback to self if no root
            if (!groups[rootId]) {
                groups[rootId] = {
                    title: idea.title || `Idea ${rootId.substr(0, 8)}...`, // Use title or fallback
                    rootId: rootId,
                    versions: []
                };
            }
            groups[rootId].versions.push(idea);
        });

        // Sort versions within groups (descending or ascending? usually descending v3, v2, v1)
        Object.values(groups).forEach(group => {
            group.versions.sort((a, b) => (b.version || 1) - (a.version || 1));
            // Update group title to the latest version's title (in case it changed)
            if (group.versions[0].title) group.title = group.versions[0].title;
        });

        return Object.values(groups);
    };

    const handleAddVersion = (e, idea) => {
        e.stopPropagation();
        navigate('/upload', {
            state: {
                parentIdeaId: idea._id,
                parentTitle: idea.title
            }
        });
    };

    const renderIdeaGroup = (group) => (
        <div key={group.rootId} style={{ marginBottom: '15px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#4ade80', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{group.title}</span>
                {/* Button to add new version based on the LATEST version */}
                <button
                    className="btn btn-sm btn-secondary"
                    style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                    onClick={(e) => handleAddVersion(e, group.versions[0])}
                >
                    + New Ver
                </button>
            </div>
            <div style={{ paddingLeft: '10px', marginTop: '5px' }}>
                {group.versions.map(v => (
                    <div
                        key={v._id}
                        onClick={() => fetchIdea(v._id)}
                        style={{
                            padding: '5px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            color: searchId === v._id ? '#fff' : 'var(--secondary)',
                            background: searchId === v._id ? 'var(--input-bg)' : 'transparent',
                            borderRadius: '4px',
                            display: 'flex',
                            justifyContent: 'space-between'
                        }}
                    >
                        <span>v{v.version || 1} - <span style={{ fontSize: '0.75rem' }}>{new Date(v.timestamp || v.createdAt).toLocaleDateString()}</span></span>
                        {/* {v.rootIdeaId && <span style={{fontSize:'0.7rem', border:'1px solid #555', padding:'0 4px', borderRadius:'3px'}}>Ver</span>} */}
                    </div>
                ))}
            </div>
        </div>
    );

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

                        <h4 style={{ marginTop: '0px', color: '#fff', borderBottom: '1px solid #333', paddingBottom: '5px' }}>Projects</h4>
                        {myIdeas.length === 0 && <p style={{ fontSize: '0.8rem' }}>No uploaded ideas.</p>}
                        {groupIdeas(myIdeas).map(group => renderIdeaGroup(group))}

                        <h4 style={{ marginTop: '20px', color: '#fbbf24', borderBottom: '1px solid #333', paddingBottom: '5px' }}>Shared with Me</h4>
                        {sharedIdeas.length === 0 && <p style={{ fontSize: '0.8rem' }}>No shared ideas.</p>}
                        {/* Shared ideas might also be grouped if we receive multiple versions */}
                        {groupIdeas(sharedIdeas).map(group => (
                            <div key={group.rootId} style={{ marginBottom: '15px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                                <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#fbbf24' }}>
                                    {group.title} <span style={{ fontSize: '0.7rem', color: '#888' }}>(Shared)</span>
                                </div>
                                <div style={{ paddingLeft: '10px', marginTop: '5px' }}>
                                    {group.versions.map(v => (
                                        <div
                                            key={v._id}
                                            onClick={() => fetchIdea(v._id)}
                                            style={{
                                                padding: '5px',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem',
                                                color: searchId === v._id ? '#fff' : 'var(--secondary)',
                                                background: searchId === v._id ? 'var(--input-bg)' : 'transparent'
                                            }}
                                        >
                                            v{v.version || 1}
                                        </div>
                                    ))}
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
                            + New Project
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
                                <div>
                                    <h2 style={{ margin: 0 }}>Idea Content <span style={{ fontSize: '0.6em', verticalAlign: 'middle', background: '#333', padding: '2px 6px', borderRadius: '4px' }}>v{ideaData.version || 1}</span></h2>
                                    <small style={{ color: '#888' }}>{ideaData.title}</small>
                                </div>
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
                                {/* Check if it looks like a binary file (e.g. PDF header) */}
                                {(typeof ideaData === 'string' && ideaData.substring(0, 10).includes('%PDF'))
                                    ? " [Encrypted PDF Document] \n\n This file contains binary data and cannot be displayed as text. \n Please click 'Download Original' above to view the PDF."
                                    : (typeof ideaData === 'string' ? ideaData : JSON.stringify(ideaData, null, 2))
                                }
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

                            {/* --- COMMENTS SECTION (Object 2) --- */}
                            <div style={{ marginTop: '30px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                                <h3>Discussion</h3>
                                <div style={{ maxHeight: '200px', overflowY: 'auto', background: 'var(--input-bg)', padding: '10px', borderRadius: '5px', marginBottom: '10px' }}>
                                    {comments.length === 0 ? <p style={{ color: '#666' }}>No comments yet or access denied.</p> : (
                                        comments.map(c => (
                                            <div key={c._id} style={{ marginBottom: '10px', borderBottom: '1px solid #333', paddingBottom: '5px' }}>
                                                <div style={{ fontSize: '0.8rem', color: '#4ade80' }}>{c.userId?.email || 'Unknown'} <span style={{ color: '#666' }}>{new Date(c.timestamp).toLocaleString()}</span></div>
                                                <div>{c.text}</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <form onSubmit={handlePostComment} style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        className="input-control"
                                        value={newComment}
                                        onChange={e => setNewComment(e.target.value)}
                                        placeholder="Type a comment..."
                                    />
                                    <button type="submit" className="btn btn-secondary">Post</button>
                                </form>
                            </div>

                            {/* --- AUDIT LOGS SECTION (Object 3) --- */}
                            <div style={{ marginTop: '30px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3>Audit Logs</h3>
                                    <button className="btn btn-sm btn-secondary" onClick={fetchAuditLogs}>View Logs</button>
                                </div>
                                {showAudit && auditLogs && (
                                    <div style={{ marginTop: '10px', background: '#222', padding: '10px', borderRadius: '5px', fontSize: '0.8rem' }}>
                                        <table style={{ width: '100%', textAlign: 'left' }}>
                                            <thead>
                                                <tr style={{ color: '#888' }}>
                                                    <th>Time</th>
                                                    <th>User</th>
                                                    <th>Action</th>
                                                    <th>IP</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {auditLogs.map(log => (
                                                    <tr key={log._id}>
                                                        <td>{new Date(log.timestamp).toLocaleString()}</td>
                                                        <td>{log.userId || 'System'}</td>
                                                        <td>{log.action}</td>
                                                        <td>{log.ipAddress}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                            {/* --- ACCESS CONTROL SECTION (Owner Only) --- */
                                ideaData.ownerId === user?.uid && ( // Assuming user.uid is available in context and ideaData has ownerId
                                    <div style={{ marginTop: '20px', textAlign: 'right' }}>
                                        <button className="btn btn-sm btn-secondary" onClick={() => openAccessModal(ideaData._id)}>
                                            Manage Access
                                        </button>
                                    </div>
                                )}
                        </div>
                    )}
                </div>
            </div>

            {/* --- MANAGE ACCESS MODAL --- */}
            {showAccessModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="card" style={{ width: '500px', maxHeight: '80vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3>Manage Access</h3>
                            <button onClick={closeAccessModal} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
                        </div>

                        {/* Add Collaborator Form */}
                        <div style={{ background: '#222', padding: '10px', borderRadius: '5px', marginBottom: '20px' }}>
                            <h4>Grant Access</h4>
                            <input
                                className="input-control"
                                placeholder="User Email"
                                value={accessEmail}
                                onChange={e => setAccessEmail(e.target.value)}
                                style={{ marginBottom: '10px' }}
                            />
                            <div style={{ display: 'flex', gap: '15px', marginBottom: '10px', fontSize: '0.9rem' }}>
                                <label><input type="checkbox" checked={accessPerms.Idea} onChange={e => setAccessPerms({ ...accessPerms, Idea: e.target.checked })} /> View Idea</label>
                                <label><input type="checkbox" checked={accessPerms.Comment} onChange={e => setAccessPerms({ ...accessPerms, Comment: e.target.checked })} /> View Comments</label>
                                <label><input type="checkbox" checked={accessPerms.AuditLog} onChange={e => setAccessPerms({ ...accessPerms, AuditLog: e.target.checked })} /> View Audit Logs</label>
                            </div>
                            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleGrantAccess}>Grant Selected Permissions</button>
                        </div>

                        {/* Current Access List */}
                        <h4>Collaborators & Permissions</h4>
                        {accessList.length === 0 ? <p style={{ color: '#666' }}>No collaborators found.</p> : (
                            <table style={{ width: '100%', fontSize: '0.85rem', textAlign: 'left', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #444', color: '#888' }}>
                                        <th style={{ padding: '5px' }}>User</th>
                                        <th style={{ padding: '5px' }}>Object</th>
                                        <th style={{ padding: '5px' }}>Perm</th>
                                        <th style={{ padding: '5px' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {accessList.map(entry => (
                                        <tr key={entry._id} style={{ borderBottom: '1px solid #333' }}>
                                            <td style={{ padding: '5px' }}>{entry.subjectId?.email || 'Unknown'}</td>
                                            <td style={{ padding: '5px' }}>{entry.objectType}</td>
                                            <td style={{ padding: '5px' }}>{entry.permission}</td>
                                            <td style={{ padding: '5px' }}>
                                                {/* Don't show revoke for Owner themselves if they show up */}
                                                {(entry.subjectId?._id !== user.uid) && (
                                                    <button
                                                        style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}
                                                        onClick={() => handleRevokeAccess(entry._id)}
                                                    >
                                                        Revoke
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;
