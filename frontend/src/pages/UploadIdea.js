import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

function UploadIdea() {
    const [data, setData] = useState('');
    const [file, setFile] = useState(null);
    const [type, setType] = useState('text');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const formData = new FormData();
        if (type === 'text') {
            formData.append('data', data);
        } else {
            if (!file) {
                setLoading(false);
                return setError("Please select a file");
            }
            formData.append('file', file);
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
                <h2 style={{ marginBottom: '20px' }}>Secure Idea Submit</h2>

                {error && <div style={{ color: 'var(--error)', marginBottom: '10px' }}>{error}</div>}

                <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                    <button
                        className={`btn ${type === 'text' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setType('text')}
                    >
                        Text Entry
                    </button>
                    <button
                        className={`btn ${type === 'file' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setType('file')}
                    >
                        File Upload
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
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

                    <div className="input-group" style={{ marginTop: '20px' }}>
                        <label>Share with Email (Optional)</label>
                        <input
                            type="email"
                            className="input-control"
                            placeholder="collaborator@example.com"
                            value={sharedWith}
                            onChange={(e) => setSharedWith(e.target.value)}
                        />
                    </div>

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
