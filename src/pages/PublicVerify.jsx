import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api';
import { useParams } from 'react-router-dom';
import LcTemplate from '../components/LcTemplate';
import './Verify.css';

function extractCertificateIdFromText(text) {
  const s = String(text || '').trim();
  if (!s) return null;
  const m = s.match(/0x[a-fA-F0-9]{64}/);
  return m ? m[0] : null;
}

export default function PublicVerify() {
  const params = useParams();
  const [file, setFile] = useState(null);
  const [zipFile, setZipFile] = useState(null);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null);
  const [fragment, setFragment] = useState(null);
  const [certStatus, setCertStatus] = useState(null);
  const [batchStatus, setBatchStatus] = useState('');
  const [batchResult, setBatchResult] = useState(null);

  const [scanOpen, setScanOpen] = useState(false);
  const [scanError, setScanError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(0);

  const certificateIdFromRoute = useMemo(() => {
    const fromParams = params?.certificateId ? String(params.certificateId) : '';
    const m = fromParams.match(/0x[a-fA-F0-9]{64}/);
    return m ? m[0] : '';
  }, [params?.certificateId]);

  useEffect(() => {
    if (!certificateIdFromRoute) return;
    (async () => {
      try {
        const stRes = await api.get(`/api/public/certificates/${encodeURIComponent(certificateIdFromRoute)}/status`);
        setCertStatus(stRes.data || null);
        setFragment(stRes.data?.decoded || null);
      } catch {
        setFragment(null);
        setCertStatus(null);
      }
    })();
  }, [certificateIdFromRoute]);

  useEffect(() => {
    if (!scanOpen) return;

    const start = async () => {
      setScanError('');
      if (!('BarcodeDetector' in window)) {
        setScanError('QR scan is not supported in this browser. Please use Chrome on Android, or upload a file.');
        return;
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
      } catch (e) {
        setScanError(e.message || 'Camera permission denied');
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

      const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
      const tick = async () => {
        try {
          if (!videoRef.current) return;
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes && barcodes.length) {
            const raw = barcodes[0]?.rawValue || '';
            const certId = extractCertificateIdFromText(raw);
            if (certId) {
              setScanOpen(false);
              window.location.href = `/verify/${encodeURIComponent(certId)}`;
              return;
            }
          }
        } catch {
          // ignore scan errors
        }
        rafRef.current = window.requestAnimationFrame(tick);
      };
      rafRef.current = window.requestAnimationFrame(tick);
    };

    start();

    return () => {
      try {
        if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      } catch {
        // ignore
      }
      rafRef.current = 0;

      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }
      } catch {
        // ignore
      }
      streamRef.current = null;
    };
  }, [scanOpen]);

  const handleVerify = async () => {
    if (!file) {
      alert('Please upload a file');
      return;
    }

    setStatus('Verifying...');
    setResult(null);
    setFragment(null);

    const formData = new FormData();
    formData.append('scanFile', file);

    try {
      const res = await api.post('/api/public/verify', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
      setStatus('Completed');

      if (res.data?.certificateId) {
        try {
          const fragRes = await api.get(`/api/public/certificates/${encodeURIComponent(res.data.certificateId)}/fragment`);
          setFragment(fragRes.data?.decoded || null);
        } catch {
          setFragment(null);
        }
      }
    } catch (e) {
      setStatus('Verification Failed');
      setResult({ error: e.response?.data?.error || e.message });
    }
  };

  const downloadBatchReport = () => {
    if (!batchResult) return;
    const blob = new Blob([JSON.stringify(batchResult, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch_verify_report_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBatchVerify = async () => {
    if (!zipFile) {
      alert('Please upload a ZIP file');
      return;
    }
    setBatchStatus('Batch verifying...');
    setBatchResult(null);

    const fd = new FormData();
    fd.append('zipFile', zipFile);

    try {
      const res = await api.post('/api/public/batch-verify', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setBatchResult(res.data);
      setBatchStatus('Batch verify completed.');
    } catch (e) {
      setBatchStatus('Batch verify failed.');
      setBatchResult({ error: e.response?.data?.error || e.message });
    }
  };

  const showPreview = fragment?.certificateId && fragment?.grNo;

  const previewQrValue = useMemo(() => {
    const certId = fragment?.certificateId || certificateIdFromRoute;
    if (!certId) return '';
    return `${window.location.origin}/verify/${encodeURIComponent(certId)}`;
  }, [fragment?.certificateId, certificateIdFromRoute]);

  return (
    <div>
      <div className="ui-card">
        <div className="ui-card-body">
          <h2 className="ui-card-title">Public Verification</h2>
          <div className="ui-card-sub">Upload a scan. The QR provides the LC ID, preview is fetched from DB, and the OCR hash is checked against DB + blockchain.</div>

          <div className="ui-divider" />

          <div className="ui-field">
            <label className="ui-label">Upload Scanned LC (PDF/Image)</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              capture="environment"
              onChange={(e) => setFile(e.target.files[0])}
              className="ui-input"
            />
          </div>

          <div className="ui-row" style={{ marginTop: 14 }}>
            <button onClick={handleVerify} className="ui-btn ui-btn-primary" type="button">
              Verify Document
            </button>
            <button onClick={() => setScanOpen((v) => !v)} className="ui-btn" type="button">
              {scanOpen ? 'Close QR Scanner' : 'Scan QR'}
            </button>
          </div>

          {scanOpen && (
            <div className="ui-alert" style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 900, marginBottom: 8 }}>Scan QR</div>
              {scanError ? (
                <div style={{ opacity: 0.9 }}>{scanError}</div>
              ) : (
                <>
                  <div style={{ opacity: 0.85, marginBottom: 10 }}>
                    Point the camera at the QR. It will open the verify link automatically.
                  </div>
                  <video ref={videoRef} style={{ width: '100%', maxWidth: 420, borderRadius: 12 }} playsInline muted />
                </>
              )}
            </div>
          )}

          {status && <div className="ui-alert">{status}</div>}

          {certificateIdFromRoute && certStatus && !certStatus.error && (
            <div className={certStatus.chainAnchored ? 'ui-alert ui-alert-success' : 'ui-alert'} style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>QR Link Verification</div>
              <div style={{ color: 'rgba(255,255,255,0.80)', marginBottom: 10 }}>
                {certStatus.chainAnchored
                  ? 'Valid: certificate hash is anchored on-chain.'
                  : certStatus.docHash
                  ? 'Found in DB, but not anchored on-chain yet.'
                  : 'Found in DB. Anchor will appear after registration (OFF mode).'}
              </div>
              <div className="ui-kv">
                <div className="ui-k">Certificate ID</div>
                <div className="ui-v">{certStatus.certificateId}</div>
                <div className="ui-k">Mode</div>
                <div className="ui-v">{certStatus.mode}</div>
                <div className="ui-k">Doc Hash</div>
                <div className="ui-v">{certStatus.docHash || '—'}</div>
                <div className="ui-k">Tx Hash</div>
                <div className="ui-v">{certStatus.txHash || '—'}</div>
              </div>
              <div style={{ marginTop: 8, opacity: 0.9 }}>
                For tamper-proof verification, also upload/scan the document (OCR hash match).
              </div>
            </div>
          )}

          {result && result.error && (
            <div className="ui-alert ui-alert-danger">
              <div style={{ fontWeight: 850, marginBottom: 6 }}>Error</div>
              <div style={{ color: 'rgba(255,255,255,0.85)' }}>{result.error}</div>
            </div>
          )}

          {result && !result.error && (
            <div className={result.verified ? 'ui-alert ui-alert-success' : 'ui-alert ui-alert-danger'}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>
                {result.verified ? 'Verified Successfully' : 'Verification Failed'}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.80)', marginBottom: 10 }}>
                {result.verified
                  ? 'Hash matches DB and is anchored on-chain.'
                  : result.hashMatches
                  ? 'Hash matches DB but not anchored on-chain.'
                  : 'Hash mismatch (tampered / different document).'}
              </div>
              <div className="ui-kv">
                <div className="ui-k">Certificate ID</div>
                <div className="ui-v">{result.certificateId}</div>
                <div className="ui-k">Computed Hash</div>
                <div className="ui-v">{result.computedHash}</div>
                {result.txHash ? (
                  <>
                    <div className="ui-k">Tx Hash</div>
                    <div className="ui-v">{result.txHash}</div>
                  </>
                ) : null}
              </div>
            </div>
          )}

          <div className="ui-divider" />

          <h3 className="ui-card-title" style={{ fontSize: 16 }}>Batch Verify (ZIP)</h3>
          <div className="ui-card-sub">Upload a ZIP of LC scans. The system verifies each file and returns a report.</div>

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
            <button onClick={handleBatchVerify} className="ui-btn ui-btn-primary" type="button">
              Batch Verify ZIP
            </button>
            {batchResult && !batchResult.error ? (
              <button onClick={downloadBatchReport} className="ui-btn" type="button">Download report.json</button>
            ) : null}
          </div>

          {batchStatus && <div className="ui-alert" style={{ marginTop: 12 }}>{batchStatus}</div>}

          {batchResult && batchResult.error && (
            <div className="ui-alert ui-alert-danger" style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 850, marginBottom: 6 }}>Error</div>
              <div style={{ color: 'rgba(255,255,255,0.85)' }}>{batchResult.error}</div>
            </div>
          )}

          {batchResult && !batchResult.error && (
            <div className="ui-alert" style={{ marginTop: 12 }}>
              <div className="ui-kv">
                <div className="ui-k">Processed</div>
                <div className="ui-v">{batchResult?.totals?.processedFiles ?? '—'}</div>
                <div className="ui-k">Verified</div>
                <div className="ui-v">{batchResult?.totals?.verified ?? '—'}</div>
                <div className="ui-k">Failed</div>
                <div className="ui-v">{batchResult?.totals?.failed ?? '—'}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showPreview && (
        <LcTemplate
          grNo={fragment.grNo}
          studentName={fragment.studentName}
          uid={''}
          date={new Date(fragment.createdAt || Date.now()).toISOString().split('T')[0]}
          qrValue={previewQrValue}
        />
      )}
    </div>
  );
}
