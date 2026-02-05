import React, { useEffect, useRef, useState } from 'react';
import { api, getSchoolPrivateKey } from '../lib/api';

export default function SchoolRegister() {
  const [mode, setMode] = useState('OFF');
  const [file, setFile] = useState(null);
  const [zipFile, setZipFile] = useState(null);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null);
  const [batchStatus, setBatchStatus] = useState('');
  const [batchResult, setBatchResult] = useState(null);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [capturedPreviewUrl, setCapturedPreviewUrl] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/api/tenant/settings');
        const m = String(res.data?.computerised_mode || 'OFF').toUpperCase() === 'ON' ? 'ON' : 'OFF';
        setMode(m);
      } catch {
        setMode('OFF');
      }
    })();
  }, []);

  if (mode === 'ON') {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-6">
        <div className="rounded-2xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur">
          <div className="p-5">
            <h2 className="text-lg font-extrabold text-slate-900">Register (Disabled)</h2>
            <p className="mt-2 text-sm text-slate-700">
              Computerised Mode is <b>ON</b>. Upload/OCR register flow is hidden because certificates are anchored during generation.
            </p>
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              Go to <a className="font-bold underline" href="/school/generate">Generate</a> to create and anchor a computerised LC.
            </div>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (!cameraOpen) return;

    const start = async () => {
      setCameraError('');

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Camera is not supported in this browser. Please use Upload Scan instead.');
        return;
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
      } catch (e) {
        setCameraError(e.message || 'Camera permission denied');
        return;
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch {
          // ignore autoplay issues
        }
      }
    };

    start();

    return () => {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }
      } catch {
        // ignore
      }
      streamRef.current = null;
    };
  }, [cameraOpen]);

  const captureFromCamera = async () => {
    const video = videoRef.current;
    if (!video) return;
    const w = video.videoWidth || 0;
    const h = video.videoHeight || 0;
    if (!w || !h) {
      setCameraError('Camera not ready yet. Please wait 1-2 seconds and try again.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, w, h);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    if (!blob) {
      setCameraError('Capture failed. Please try again.');
      return;
    }

    const captured = new File([blob], `lc_scan_${new Date().toISOString().replace(/[:.]/g, '-')}.jpg`, {
      type: 'image/jpeg',
    });
    setFile(captured);

    try {
      if (capturedPreviewUrl) URL.revokeObjectURL(capturedPreviewUrl);
    } catch {
      // ignore
    }
    setCapturedPreviewUrl(URL.createObjectURL(blob));
    setCameraOpen(false);
  };

  const handleRegister = async () => {
    if (mode === 'ON') {
      alert('Computerised ON: Register upload is disabled. Anchoring happens during Generate.');
      return;
    }

    if (!file) {
      alert('Please upload the scanned LC (PDF/Image).');
      return;
    }

    const confirmAnchor = window.confirm(
      'Are you sure you want to anchor this document on-chain? This costs gas.'
    );
    if (!confirmAnchor) return;

    const privateKey = getSchoolPrivateKey();
    if (!privateKey) {
      alert('Missing school private key in browser. Please do First Login again.');
      return;
    }

    setStatus('Processing QR + OCR + Anchoring...');
    setResult(null);

    const formData = new FormData();
    formData.append('scanFile', file);

    try {
      const res = await api.post('/api/certificates/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-school-private-key': privateKey,
        },
      });
      setResult(res.data);
      setStatus(res.data?.anchoredAlready ? 'Already Anchored (no changes made)' : 'Registration Completed');
    } catch (e) {
      setStatus('Registration Failed');
      const payload = e.response?.data;
      if (payload && typeof payload === 'object') {
        setResult(payload);
      } else {
        setResult({ error: e.message });
      }
    }
  };

  const downloadBatchReport = () => {
    if (!batchResult) return;
    const blob = new Blob([JSON.stringify(batchResult, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch_register_report_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBatchRegister = async () => {
    if (mode === 'ON') {
      alert('Computerised ON: Register upload is disabled. Anchoring happens during Generate.');
      return;
    }
    if (!zipFile) {
      alert('Please upload a ZIP file that contains scanned LCs (PDF/Images).');
      return;
    }

    const confirmAnchor = window.confirm(
      'Batch register will anchor multiple documents on-chain (costs gas). Continue?'
    );
    if (!confirmAnchor) return;

    const privateKey = getSchoolPrivateKey();
    if (!privateKey) {
      alert('Missing school private key in browser. Please do First Login again.');
      return;
    }

    setBatchStatus('Extracting ZIP → OCR+QR → Anchoring batch...');
    setBatchResult(null);

    const fd = new FormData();
    fd.append('zipFile', zipFile);

    try {
      const res = await api.post('/api/certificates/batch-register', fd, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-school-private-key': privateKey,
        },
      });
      setBatchResult(res.data);
      setBatchStatus('Batch register completed.');
    } catch (e) {
      setBatchStatus('Batch register failed.');
      const payload = e.response?.data;
      if (payload && typeof payload === 'object') {
        setBatchResult(payload);
      } else {
        setBatchResult({ error: e.message });
      }
    }
  };

  return (
    <div className="ui-card">
      <div className="ui-card-body">
        <h2 className="ui-card-title">Register (Anchor on-chain)</h2>
        <div className="ui-card-sub">
          Upload the fully handwritten + signed LC scan. The system reads QR → LC ID, OCRs text, hashes it (keccak256), stores in DB,
          and anchors the hash on Polygon Amoy.
        </div>

        {mode === 'ON' && (
          <div className="ui-alert ui-alert-danger" style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Computerised ON is enabled</div>
            <div>Register upload is disabled because hash+anchor happens at generation time.</div>
          </div>
        )}

        <div className="ui-divider" />

        <div className="ui-field">
          <label className="ui-label">Upload Scan (PDF/Image) or Scan Full Document (Camera)</label>
          <input
            type="file"
            accept="image/*,application/pdf"
            capture="environment"
            onChange={(e) => setFile(e.target.files[0])}
            className="ui-input"
          />
          <div className="ui-row" style={{ marginTop: 10, gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => setCameraOpen((v) => !v)}
              className="ui-btn"
              type="button"
              disabled={mode === 'ON'}
            >
              {cameraOpen ? 'Close Camera' : 'Open Camera'}
            </button>
            <button
              onClick={() => {
                setFile(null);
                try {
                  if (capturedPreviewUrl) URL.revokeObjectURL(capturedPreviewUrl);
                } catch {
                  // ignore
                }
                setCapturedPreviewUrl('');
              }}
              className="ui-btn"
              type="button"
            >
              Clear Selected File
            </button>
          </div>

          {cameraOpen && (
            <div className="ui-alert" style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 900, marginBottom: 8 }}>Scan Full Document</div>
              {cameraError ? (
                <div style={{ opacity: 0.9 }}>{cameraError}</div>
              ) : (
                <>
                  <div style={{ opacity: 0.85, marginBottom: 10 }}>
                    Keep the whole LC inside the frame, with good light. Tap Capture to use this photo for anchoring.
                    For multi-page scans, use a PDF scanner app and upload the PDF.
                  </div>
                  <video ref={videoRef} style={{ width: '100%', maxWidth: 520, borderRadius: 12 }} playsInline muted />
                  <div className="ui-row" style={{ marginTop: 10, gap: 10, flexWrap: 'wrap' }}>
                    <button onClick={captureFromCamera} className="ui-btn ui-btn-primary" type="button">
                      Capture Photo
                    </button>
                    <button onClick={() => setCameraOpen(false)} className="ui-btn" type="button">
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {capturedPreviewUrl && (
            <div className="ui-alert" style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 850, marginBottom: 8 }}>Captured Preview</div>
              <img src={capturedPreviewUrl} alt="Captured LC" style={{ width: '100%', maxWidth: 520, borderRadius: 12 }} />
            </div>
          )}
        </div>

        <div className="ui-row" style={{ marginTop: 14 }}>
          <button onClick={handleRegister} className="ui-btn ui-btn-primary" type="button">
            Anchor to Blockchain
          </button>
        </div>

        {status && <div className="ui-alert">{status}</div>}

        {result && !result.error && !result.anchoredAlready && (
          <div className="ui-alert ui-alert-success">
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Anchored Successfully</div>
            <div className="ui-kv">
              <div className="ui-k">Certificate ID</div>
              <div className="ui-v">{result.certificateId}</div>
              <div className="ui-k">Tx Hash</div>
              <div className="ui-v">{result.txHash}</div>
              <div className="ui-k">Document Hash</div>
              <div className="ui-v">{result.documentHash}</div>
            </div>
          </div>
        )}

        {result && !result.error && result.anchoredAlready && (
          <div className="ui-alert ui-alert-success">
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Already Anchored</div>
            <div style={{ opacity: 0.9, marginBottom: 10 }}>
              This LC is already anchored on-chain. No re-anchoring was performed and the original record was not changed.
            </div>
            <div className="ui-kv">
              <div className="ui-k">Certificate ID</div>
              <div className="ui-v">{result.certificateId}</div>
              <div className="ui-k">Tx Hash</div>
              <div className="ui-v">{result.txHash || '—'}</div>
              <div className="ui-k">Document Hash</div>
              <div className="ui-v">{result.documentHash || '—'}</div>
            </div>
          </div>
        )}

        {result && result.error && (
          <div className="ui-alert ui-alert-danger">
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Registration Failed</div>
            {result.code === 'CERTIFICATE_ID_MISMATCH' ? (
              <>
                <div style={{ color: 'rgba(255,255,255,0.92)', fontWeight: 850 }}>
                  This QR / Certificate ID is already anchored with a different LC.
                </div>
                <div style={{ color: 'rgba(255,255,255,0.85)', marginTop: 6 }}>{result.error}</div>
                {typeof result.chainAnchored !== 'undefined' ? (
                  <div style={{ marginTop: 10, color: 'rgba(255,255,255,0.85)' }}>
                    Blockchain status (original):{' '}
                    <span style={{ fontWeight: 850 }}>
                      {result.chainAnchored ? 'Already anchored on-chain' : 'Not anchored on-chain'}
                    </span>
                    {result.chainAnchoredAt ? (
                      <span style={{ opacity: 0.85 }}> (anchoredAt: {String(result.chainAnchoredAt)})</span>
                    ) : null}
                  </div>
                ) : null}
                <div className="ui-kv" style={{ marginTop: 10 }}>
                  <div className="ui-k">Certificate ID</div>
                  <div className="ui-v">{result.certificateId || '—'}</div>
                  <div className="ui-k">Existing Hash (Original)</div>
                  <div className="ui-v">{result.existingDocumentHash || '—'}</div>
                  <div className="ui-k">Uploaded Hash (This scan)</div>
                  <div className="ui-v">{result.providedDocumentHash || '—'}</div>
                </div>
                <div style={{ marginTop: 10, color: 'rgba(255,255,255,0.7)' }}>
                  Tip: Upload the original LC scan that matches the anchored record.
                </div>
              </>
            ) : result.code === 'CERTIFICATE_ALREADY_ANCHORED_NO_HASH' ? (
              <>
                <div style={{ color: 'rgba(255,255,255,0.92)', fontWeight: 850 }}>Already anchored (protected)</div>
                <div style={{ color: 'rgba(255,255,255,0.85)', marginTop: 6 }}>{result.error}</div>
                <div style={{ marginTop: 10, color: 'rgba(255,255,255,0.7)' }}>
                  Ask admin to backfill the missing stored hash for this certificate before doing any re-register operations.
                </div>
              </>
            ) : (
              <div style={{ color: 'rgba(255,255,255,0.85)' }}>{result.error}</div>
            )}
            {String(result.error || '').toLowerCase().includes('insufficient') ? (
              <div style={{ marginTop: 10, color: 'rgba(255,255,255,0.65)' }}>
                Tip: the school signing wallet must have Amoy MATIC to pay gas.
              </div>
            ) : null}
          </div>
        )}

        <div className="ui-divider" />

        <h3 className="ui-card-title" style={{ fontSize: 16 }}>Batch Register (ZIP)</h3>
        <div className="ui-card-sub">
          Upload a ZIP containing multiple scanned LCs (PDF/Images). System processes one-by-one: QR → LC ID, OCR → hash, DB update, anchor on-chain.
          Duplicate certificate IDs inside the same zip are skipped.
        </div>

        <div className="ui-field" style={{ marginTop: 10 }}>
          <label className="ui-label">Upload ZIP</label>
          <input
            type="file"
            accept="application/zip,.zip"
            onChange={(e) => setZipFile(e.target.files?.[0] || null)}
            className="ui-input"
          />
        </div>

        <div className="ui-row" style={{ marginTop: 14, gap: 10, flexWrap: 'wrap' }}>
          <button onClick={handleBatchRegister} className="ui-btn ui-btn-primary" type="button">
            Batch Anchor ZIP
          </button>
          {batchResult && !batchResult.error ? (
            <button onClick={downloadBatchReport} className="ui-btn" type="button">Download report.json</button>
          ) : null}
        </div>

        {batchStatus && <div className="ui-alert" style={{ marginTop: 12 }}>{batchStatus}</div>}

        {batchResult && batchResult.error && (
          <div className="ui-alert ui-alert-danger" style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Batch Register Failed</div>
            <div style={{ color: 'rgba(255,255,255,0.85)' }}>{batchResult.error}</div>
          </div>
        )}

        {batchResult && !batchResult.error && (
          <div className="ui-alert ui-alert-success" style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Batch Register Report</div>
            <div className="ui-kv">
              <div className="ui-k">Processed</div>
              <div className="ui-v">{batchResult?.totals?.processedFiles ?? '—'}</div>
              <div className="ui-k">Anchored Now</div>
              <div className="ui-v">{batchResult?.totals?.anchoredNow ?? '—'}</div>
              <div className="ui-k">Batch TxHash</div>
              <div className="ui-v">{batchResult?.totals?.batchTxHash || '—'}</div>
              <div className="ui-k">Failed</div>
              <div className="ui-v">{batchResult?.totals?.failed ?? '—'}</div>
            </div>

            {Array.isArray(batchResult?.items) && batchResult.items.some((x) => x && x.error) ? (
              <details style={{ marginTop: 12 }}>
                <summary style={{ cursor: 'pointer', fontWeight: 800 }}>Show failed items</summary>
                <div style={{ marginTop: 10, overflowX: 'auto' }}>
                  <table className="ui-table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>File</th>
                        <th>Certificate ID</th>
                        <th>Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchResult.items
                        .filter((x) => x && x.error)
                        .slice(0, 25)
                        .map((x, idx) => (
                          <tr key={idx}>
                            <td>{x.file}</td>
                            <td>{x.certificateId || '—'}</td>
                            <td>{x.error}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {batchResult.items.filter((x) => x && x.error).length > 25 ? (
                    <div style={{ marginTop: 8, opacity: 0.8 }}>Only first 25 failures shown. Download report.json for full list.</div>
                  ) : null}
                </div>
              </details>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
