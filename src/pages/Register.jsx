import React, { useState } from 'react';
import axios from 'axios';
import './Register.css';

const Register = () => {
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('');
    const [result, setResult] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleRegister = async () => {
        if (!file) {
            alert("Please upload the handwritten LC scan.");
            return;
        }

        const confirmAnchor = window.confirm("Are you sure you want to anchor this document to the blockchain? This action cannot be undone and will incur gas fees.");
        if (!confirmAnchor) return;

        setStatus('Processing OCR & Anchoring to Blockchain...');
        setResult(null);

        const formData = new FormData();
        formData.append('scanImage', file);

        try {
            // Updated endpoint to match backend functionality
            const response = await axios.post('http://localhost:3000/api/register', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setResult(response.data);
            setStatus('Registration Completed');
        } catch (err) {
            console.error(err);
            setStatus('Registration Failed');
            setResult({ error: err.response?.data?.error || err.message });
        }
    };

    return (
        <div className="register-container">
            <div className="register-card">
                <h2 className="register-title">Register Certificate (School Admin)</h2>

                <div className="register-step">
                    <strong>Step 3: Upload & Anchor</strong><br />
                    Please upload the fully handwritten and signed Leaving Certificate scan.<br />
                    The system will calculate the hash from the scan and anchor it to the blockchain.
                </div>

                <div className="upload-section">
                    <label className="upload-label">Upload Handwritten Scan</label>
                    <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        className="upload-input"
                    />
                </div>

                <button onClick={handleRegister} className="btn-register">
                    Anchor to Blockchain
                </button>

                {status && <div className="status-msg">{status}</div>}

                {result && !result.error && (
                    <div className="result-box">
                        <h3 className="result-header">✅ Anchored Successfully</h3>
                        <p className="result-detail">The document hash has been permanently stored on the Polygon Blockchain.</p>

                        <div style={{ marginTop: '15px' }}>
                            <strong>Transaction Hash:</strong>
                            <p className="hash-text">{result.txHash}</p>
                        </div>

                        <div style={{ marginTop: '10px' }}>
                            <strong>Document Hash (OCR):</strong>
                            <p className="hash-text">{result.documentHash}</p>
                        </div>
                    </div>
                )}

                {result && result.error && (
                    <div className="result-box" style={{ borderColor: '#fecaca', backgroundColor: '#fef2f2' }}>
                        <h3 className="result-header" style={{ color: '#991b1b' }}>❌ Failed</h3>
                        <p className="result-detail">{result.error}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Register;
