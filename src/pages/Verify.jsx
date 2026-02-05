import React, { useState } from 'react';
import axios from 'axios';
import './Verify.css';

const Verify = () => {
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('');
    const [result, setResult] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleVerify = async () => {
        if (!file) {
            alert("Please upload a file");
            return;
        }
        setStatus('Verifying...');
        setResult(null);

        const formData = new FormData();
        formData.append('scanImage', file);

        try {
            const response = await axios.post('http://localhost:3000/api/verify-doc', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setResult(response.data);
            setStatus('Completed');
        } catch (err) {
            console.error(err);
            setStatus('Verification Failed');
            setResult({ error: err.response?.data?.error || err.message });
        }
    };

    return (
        <div className="verify-container">
            <div className="verify-card">
                <h2 className="verify-title">Verify Certificate</h2>

                <div className="upload-section">
                    <label className="upload-label">Upload Scanned LC</label>
                    <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        className="upload-input"
                    />
                </div>

                <button onClick={handleVerify} className="btn-verify">
                    Verify Document
                </button>

                {status && <div className="status-msg">{status}</div>}

                {result && (
                    <div className={`result-box ${result.verified ? 'result-success' : 'result-fail'}`}>
                        {result.verified ? (
                            <div>
                                <h3 className="result-header">✅ Verified Successfully</h3>
                                <p className="result-detail">Document Hash Matches Blockchain Record.</p>
                                <p className="hash-text">Tx: {result.txHash}</p>
                            </div>
                        ) : (
                            <div>
                                <h3 className="result-header">❌ Verification Failed</h3>
                                <p className="result-detail">{result.error || "Hash mismatch. Document may be tampered."}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Verify;
