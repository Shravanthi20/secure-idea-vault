import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';

function UploadIdea() {
    const location = useLocation();
    const { parentIdeaId, parentTitle } = location.state || {};

    const [title, setTitle] = useState(parentTitle || '');
    const [data, setData] = useState('');
    const [file, setFile] = useState(null);
    const [type, setType] = useState('text');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // ACL Mode: 'default' (inherit) or 'new'
    const [aclMode, setAclMode] = useState(parentIdeaId ? 'default' : 'new');

    // Collaborators State
    // Array of objects: { email: "", permission: "VIEW" }
    const [collaborators, setCollaborators] = useState([]);
    const [currentEmail, setCurrentEmail] = useState('');
    const [currentRole, setCurrentRole] = useState('VIEW');

    const navigate = useNavigate();

    useEffect(() => {
        if (parentTitle) {
            setTitle(parentTitle);
        }
    }, [parentTitle]);

    const addCollaborator = () => {
        if (!currentEmail.trim()) return;
        // Prevent duplicates
        if (collaborators.some(c => c.email === currentEmail.trim())) {
            setError("User already added");
            return;
        }
        setCollaborators([...collaborators, { email: currentEmail.trim(), permission: currentRole }]);
        setCurrentEmail('');
        setCurrentRole('VIEW'); // Reset to default
        setError('');
    };

    const removeCollaborator = (emailToRemove) => {
        setCollaborators(collaborators.filter(c => c.email !== emailToRemove));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const formData = new FormData();
        formData.append('title', title);

        if (parentIdeaId) {
            formData.append('parentIdeaId', parentIdeaId);
            formData.append('aclMode', aclMode);
        }

        if (type === 'text') {
            formData.append('data', data);
        } else {
            if (!file) {
                setLoading(false);
                return setError("Please select a file");
            }
            formData.append('file', file);
        }

        // Send collaborators as a JSON string
        if (aclMode === 'new' && collaborators.length > 0) {
            formData.append('collaborators', JSON.stringify(collaborators));
        }

        try {
            await api.post('/ideas/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            navigate('/');
        } catch (err) {
            setError(err.response?.data || 'Upload failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ maxWidth: '600px', marginTop: '50px' }}>
            <div className="card">
                <h2 style={{ marginBottom: '20px' }}>
                    {parentIdeaId ? `New Version for: ${parentTitle}` : 'Secure Idea Submit'}
                </h2>

                {error && <div style={{ color: 'var(--error)', marginBottom: '10px' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Idea Name (Title)</label>
                        <input
                            type="text"
                            className="input-control"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Project A"
                            required
                            disabled={!!parentIdeaId} // Lock title if versioning (optional, but good for consistency)
                        />
                    </div>

                    <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button
                            type="button"
                            className={`btn ${type === 'text' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setType('text')}
                        >
                            Text Entry
                        </button>
                        <button
                            type="button"
                            className={`btn ${type === 'file' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setType('file')}
                        >
                            File Upload
                        </button>
                    </div>

                    {type === 'text' ? (
                        <div className="input-group">
                            <label>Idea Description</label>
                            <textarea
                                className="input-control"
                                rows="6"
                                value={data}
                                onChange={(e) => setData(e.target.value)}
                                placeholder="Describe your research or startup idea..."
                                required
                            />
                        </div>
                    ) : (
                        <div className="input-group">
                            <label>Project File (PDF, Doc, etc.)</label>
                            <input
                                type="file"
                                className="input-control"
                                onChange={(e) => setFile(e.target.files[0])}
                                required
                            />
                        </div>
                    )}

                    {/* Access Control Settings for Versioning */}
                    {parentIdeaId && (
                        <div className="input-group" style={{ marginTop: '20px', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
                            <label>Access Control Settings</label>
                            <div style={{ display: 'flex', gap: '15px', marginTop: '5px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="aclMode"
                                        value="default"
                                        checked={aclMode === 'default'}
                                        onChange={() => setAclMode('default')}
                                    />
                                    <span>Same as previous version (Inherit)</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="aclMode"
                                        value="new"
                                        checked={aclMode === 'new'}
                                        onChange={() => setAclMode('new')}
                                    />
                                    <span>New settings</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Collaborator Section - Show if New Idea OR (Versioning AND New Settings) */}
                    {(!parentIdeaId || aclMode === 'new') && (
                        <div className="input-group" style={{ marginTop: '20px', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
                            <label>Manage Collaborators</label>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                <input
                                    type="email"
                                    className="input-control"
                                    placeholder="Colleague Email"
                                    value={currentEmail}
                                    onChange={(e) => setCurrentEmail(e.target.value)}
                                    style={{ flex: 2 }}
                                />
                                <select
                                    className="input-control"
                                    value={currentRole}
                                    onChange={(e) => setCurrentRole(e.target.value)}
                                    style={{ flex: 1 }}
                                >
                                    <option value="VIEW">VIEW</option>
                                    <option value="VERIFY">VERIFY</option>
                                </select>
                                <button type="button" className="btn btn-secondary" onClick={addCollaborator}>Add</button>
                            </div>

                            {/* List of added collaborators */}
                            {collaborators.length > 0 && (
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                    {collaborators.map((c, index) => (
                                        <li key={index} style={{ background: '#f9f9f9', padding: '5px 10px', marginBottom: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '4px' }}>
                                            <span>
                                                <strong>{c.email}</strong> - <span style={{ fontSize: '0.85em', color: '#666' }}>{c.permission}</span>
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => removeCollaborator(c.email)}
                                                style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', fontSize: '1.2em' }}
                                            >
                                                &times;
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => navigate('/')}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Encrypting & Uploading...' : 'Secure & Submit'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default UploadIdea;
