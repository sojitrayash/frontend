import React, { useState } from 'react';
import { API_BASE, getSchoolPrivateKey } from '../lib/api';

export default function SchoolErpImport() {
  const [csvFile, setCsvFile] = useState(null);
  const [includeHtml, setIncludeHtml] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);

  const runImport = async () => {
    setStatus('');
    const pk = String(getSchoolPrivateKey() || '').trim();
    if (!csvFile) return setStatus('✗ Please choose a CSV file.');
    if (!pk) return setStatus('✗ Missing School Private Key. Set it in Settings first.');

    setBusy(true);
    setProgress(0);
    setStatus('⟳ Uploading CSV and generating ZIP...');

    try {
      const fd = new FormData();
      fd.append('csvFile', csvFile);
      fd.append('includeHtml', includeHtml ? '1' : '0');

      const res = await fetch(`${API_BASE}/api/erp/import/csv`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('qv_token') || ''}`,
          'x-school-private-key': pk,
        },
        body: fd,
      });

      if (!res.ok) {
        let msg = `ERP import failed (${res.status})`;
        try {
          const j = await res.json();
          msg = j.error || msg;
        } catch {
          // ignore
        }
        throw new Error(msg);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `erp_import_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setProgress(100);
      setStatus('✓ ZIP file downloaded successfully!');
      setCsvFile(null);
    } catch (e) {
      setStatus('✗ ' + e.message);
      setProgress(0);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="ui-card" style={{ marginBottom: '24px' }}>
        <div className="ui-card-body">
          <h1 className="ui-card-title" style={{ fontSize: '28px', margin: '0 0 8px 0' }}>📥 ERP Import</h1>
          <p className="ui-card-sub" style={{ margin: '0' }}>
            Bulk certificate generation from ERP CSV data (Computerised ON only)
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
        {/* Left: Form */}
        <div className="ui-card">
          <div className="ui-card-body">
            <h3 className="ui-card-title" style={{ fontSize: '18px', marginTop: '0' }}>📋 Import Settings</h3>

            <div className="ui-field">
              <label className="ui-label">CSV File</label>
              <input
                className="ui-input"
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                disabled={busy}
              />
              <p style={{ fontSize: '12px', color: '#6B7280', margin: '8px 0 0 0', fontWeight: '500' }}>
                📄 Selected: {csvFile ? csvFile.name : 'No file selected'}
              </p>
            </div>

            <div style={{ marginBottom: '16px', padding: '12px', background: '#F8FAFC', borderRadius: 'var(--radius)', border: '1px solid #E5E7EB' }}>
              <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeHtml}
                  onChange={(e) => setIncludeHtml(e.target.checked)}
                  disabled={busy}
                  style={{ marginTop: '4px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#4B5563', margin: '0' }}>
                  <strong>Include Rendered HTML</strong>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px', fontWeight: '500' }}>
                    For debugging and previewing rendered templates (increases file size)
                  </div>
                </span>
              </label>
            </div>

            <div style={{ marginTop: '20px' }}>
              <button
                className="ui-btn ui-btn-primary"
                type="button"
                onClick={runImport}
                disabled={busy || !csvFile}
                style={{ width: '100%', padding: '12px', fontSize: '14px' }}
              >
                {busy ? '⟳ Running Import...' : '🚀 Run ERP Import'}
              </button>
            </div>

            {/* Status Messages */}
            {status && (
              <div
                className={status.includes('✗') ? 'ui-alert ui-alert-danger' : status.includes('✓') ? 'ui-alert ui-alert-success' : 'ui-alert'}
                style={{ marginTop: '16px' }}
              >
                {status}
              </div>
            )}

            {/* Progress Bar */}
            {busy && progress > 0 && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '6px', fontWeight: '600' }}>
                  Progress: {progress}%
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: '#E5E7EB',
                  borderRadius: '999px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, #003A5C 0%, #004B78 100%)',
                    width: `${progress}%`,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Instructions */}
        <div className="ui-card">
          <div className="ui-card-body">
            <h3 className="ui-card-title" style={{ fontSize: '18px', marginTop: '0' }}>📖 How It Works</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#003A5C', marginBottom: '6px' }}>1. Required Columns</div>
                <p style={{ fontSize: '13px', color: '#4B5563', margin: '0', fontWeight: '500' }}>
                  Your CSV must contain <strong>GR No</strong> and <strong>Student Name</strong> columns
                </p>
              </div>

              <div style={{ height: '1px', background: '#E5E7EB' }} />

              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#003A5C', marginBottom: '6px' }}>2. Extra Columns</div>
                <p style={{ fontSize: '13px', color: '#4B5563', margin: '0', fontWeight: '500' }}>
                  Additional columns become dynamic fields usable in your certificate templates
                </p>
              </div>

              <div style={{ height: '1px', background: '#E5E7EB' }} />

              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#003A5C', marginBottom: '6px' }}>3. Column Mapping</div>
                <p style={{ fontSize: '13px', color: '#4B5563', margin: '0', fontWeight: '500' }}>
                  If column names don't match template fields, set a rename map in Settings → ERP Config
                </p>
              </div>

              <div style={{ height: '1px', background: '#E5E7EB' }} />

              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#003A5C', marginBottom: '6px' }}>4. Processing</div>
                <p style={{ fontSize: '13px', color: '#4B5563', margin: '0', fontWeight: '500' }}>
                  Certificates are generated, hashed, and automatically anchored on-chain
                </p>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(245, 158, 11, 0.02) 100%)',
                border: '2px solid #FEF3C7',
                borderRadius: 'var(--radius)',
                padding: '12px',
                marginTop: '8px'
              }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#92400E' }}>⚠️ Requires Computerised Mode ON</div>
                <p style={{ fontSize: '12px', color: '#92400E', margin: '4px 0 0 0', fontWeight: '500' }}>
                  This feature only works when Computerised Mode is enabled in Settings
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
