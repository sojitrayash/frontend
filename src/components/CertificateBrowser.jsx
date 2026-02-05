import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

function formatDate(value) {
  if (!value) return '—';
  try {
    const s = String(value);
    return s.length >= 10 ? s.slice(0, 10) : s;
  } catch {
    return '—';
  }
}

function getStatusColor(status) {
  const s = String(status || '').toUpperCase();
  if (s === 'REVOKED') return { bg: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '#FEE2E2' };
  if (s === 'ANCHORED') return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: '#D1FAE5' };
  if (s === 'HASHED') return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', border: '#DBEAFE' };
  return { bg: 'rgba(107, 114, 128, 0.1)', color: '#6B7280', border: '#F3F4F6' };
}

export default function CertificateBrowser({
  title,
  subtitle,
  loadList,
  loadMetrics,
  loadHtml,
  loadPdf,
  revoke,
  initialIncludeRevoked = false,
  renderExtraControls,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [metrics, setMetrics] = useState(null);

  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(25);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState([]);

  const [includeRevoked, setIncludeRevoked] = useState(Boolean(initialIncludeRevoked));

  const [selectedId, setSelectedId] = useState('');

  const [previewMode, setPreviewMode] = useState('HTML');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [html, setHtml] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');

  const pdfUrlRef = useRef('');
  const previewReqIdRef = useRef(0);

  const page = useMemo(() => Math.floor(offset / limit) + 1, [offset, limit]);
  const pages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const refresh = useCallback(
    async ({ keepSelection = true } = {}) => {
      setLoading(true);
      setError('');
      try {
        if (typeof loadMetrics === 'function') {
          const m = await loadMetrics();
          setMetrics(m || null);
        } else {
          setMetrics(null);
        }

        const res = await loadList({ q, limit, offset, includeRevoked });
        const nextItems = Array.isArray(res?.items) ? res.items : [];
        const nextTotal = Number(res?.total || 0);
        setItems(nextItems);
        setTotal(nextTotal);

        if (!keepSelection) {
          setSelectedId(nextItems[0]?.certificate_id || '');
          return;
        }

        const currentStillExists = nextItems.some((it) => it?.certificate_id === selectedId);
        if (!selectedId || !currentStillExists) {
          setSelectedId(nextItems[0]?.certificate_id || '');
        }
      } catch (e) {
        setError(e?.response?.data?.error || e.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    },
    [includeRevoked, limit, loadList, loadMetrics, offset, q, selectedId]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    return () => {
      if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current);
    };
  }, []);

  const selected = useMemo(() => items.find((it) => it?.certificate_id === selectedId) || null, [items, selectedId]);

  const loadPreview = useCallback(
    async (certId, mode) => {
      if (!certId) {
        setHtml('');
        if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current);
        pdfUrlRef.current = '';
        setPdfUrl('');
        return;
      }

      const reqId = ++previewReqIdRef.current;
      setPreviewLoading(true);
      setError('');

      try {
        if (mode === 'PDF') {
          const blob = await loadPdf(certId);
          if (reqId !== previewReqIdRef.current) return;
          if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current);
          const nextUrl = URL.createObjectURL(blob);
          pdfUrlRef.current = nextUrl;
          setPdfUrl(nextUrl);
        } else {
          const text = await loadHtml(certId);
          if (reqId !== previewReqIdRef.current) return;
          setHtml(String(text || ''));
        }
      } catch (e) {
        if (reqId !== previewReqIdRef.current) return;
        setError(e?.response?.data?.error || e.message || 'Failed to load preview');
      } finally {
        if (reqId === previewReqIdRef.current) setPreviewLoading(false);
      }
    },
    [loadHtml, loadPdf]
  );

  useEffect(() => {
    loadPreview(selectedId, previewMode);
  }, [selectedId, previewMode, loadPreview]);

  const onRevoke = async () => {
    if (!selectedId) return;
    if (String(selected?.status || '').toUpperCase() === 'REVOKED') return;

    const ok = window.confirm(`Revoke this certificate?\n\nCertificate ID: ${selectedId}\n\nThis keeps verification history; status becomes REVOKED.`);
    if (!ok) return;

    setError('');
    try {
      await revoke(selectedId);
      await refresh({ keepSelection: false });
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to revoke');
    }
  };

  return (
    <>
      {/* Header with Title and Metrics */}
      <div className="ui-card" style={{ marginBottom: '24px' }}>
        <div className="ui-card-body">
          <div className="ui-card-header">
            <div>
              <h1 className="ui-card-title" style={{ fontSize: '24px', marginBottom: '4px' }}>📜 {title}</h1>
              {subtitle && <p className="ui-card-sub" style={{ margin: '0' }}>{subtitle}</p>}
            </div>
            <button className="ui-btn" onClick={() => refresh()} disabled={loading}>
              {loading ? '⟳ Refreshing...' : '⟳ Refresh'}
            </button>
          </div>

          {/* Metrics */}
          {metrics ? (
            <div className="ui-stat-grid" style={{ marginTop: '20px' }}>
              {Object.entries(metrics).map(([k, v]) => (
                <div key={k} className="ui-stat-card">
                  <div className="ui-stat-label">{String(k).replace(/_/g, ' ')}</div>
                  <div className="ui-stat-value">{String(v)}</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="ui-card" style={{ marginBottom: '24px' }}>
        <div className="ui-card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
            <div className="ui-field" style={{ margin: '0' }}>
              <label className="ui-label">Search</label>
              <input
                className="ui-input"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="GR No / Student / Certificate ID"
              />
            </div>

            <div className="ui-field" style={{ margin: '0' }}>
              <label className="ui-label">Page Size</label>
              <select
                className="ui-input"
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setOffset(0);
                }}
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n} per page
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                id="includeRevoked"
                type="checkbox"
                checked={includeRevoked}
                onChange={(e) => {
                  setIncludeRevoked(e.target.checked);
                  setOffset(0);
                }}
                style={{ cursor: 'pointer', width: '18px', height: '18px' }}
              />
              <label htmlFor="includeRevoked" style={{ fontSize: '13px', fontWeight: '600', color: '#4B5563', cursor: 'pointer', margin: '0' }}>
                Include revoked
              </label>
            </div>

            {typeof renderExtraControls === 'function' && renderExtraControls()}

            <button
              className="ui-btn ui-btn-primary"
              onClick={() => {
                setOffset(0);
                refresh();
              }}
              disabled={loading}
              style={{ height: '44px' }}
            >
              🔍 Search
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
        {/* Left: Certificate List */}
        <div className="ui-card">
          <div className="ui-card-header">
            <div>
              <h3 className="ui-card-title" style={{ fontSize: '16px', margin: '0' }}>📋 All Certificates</h3>
              <p className="ui-card-sub" style={{ fontSize: '12px', margin: '4px 0 0 0' }}>Page {page} of {pages} • Total: {total}</p>
            </div>
          </div>

          <div style={{ maxHeight: '600px', overflowY: 'auto', borderTop: '1px solid #E5E7EB' }}>
            {loading ? (
              <div className="ui-alert" style={{ margin: '16px' }}>⟳ Loading certificates...</div>
            ) : items.length === 0 ? (
              <div className="ui-alert" style={{ margin: '16px' }}>No certificates found.</div>
            ) : (
              <div style={{ padding: '8px' }}>
                {items.map((it) => {
                  const active = it?.certificate_id === selectedId;
                  const statusColor = getStatusColor(it?.status);
                  return (
                    <button
                      key={it?.certificate_id}
                      onClick={() => setSelectedId(it?.certificate_id)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        marginBottom: '8px',
                        border: active ? '2px solid #003A5C' : '1px solid #E5E7EB',
                        borderRadius: 'var(--radius)',
                        background: active ? '#F8FAFC' : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => {
                        if (!active) e.target.style.background = '#FFFFFF';
                        e.target.style.borderColor = '#003A5C';
                      }}
                      onMouseLeave={(e) => {
                        if (!active) e.target.style.background = 'white';
                        e.target.style.borderColor = '#E5E7EB';
                      }}
                    >
                      <div style={{ fontWeight: '700', color: '#1A202C', fontSize: '14px', marginBottom: '4px' }}>
                        {it?.student_name || it?.certificate_id || '—'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '6px' }}>
                        GR: {it?.gr_no || '—'}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <div className="ui-pill" style={{ borderColor: statusColor.border, background: statusColor.bg, color: statusColor.color, fontSize: '11px' }}>
                          {String(it?.status || '—').toUpperCase()}
                        </div>
                        <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                          {formatDate(it?.created_at)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          <div style={{ borderTop: '1px solid #E5E7EB', padding: '12px', display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
            <button
              className="ui-btn"
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={loading || offset === 0}
            >
              ← Previous
            </button>
            <button
              className="ui-btn"
              onClick={() => setOffset(Math.min((pages - 1) * limit, offset + limit))}
              disabled={loading || page >= pages}
            >
              Next →
            </button>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="ui-card">
          <div className="ui-card-header">
            <div>
              <h3 className="ui-card-title" style={{ fontSize: '16px', margin: '0' }}>👀 Preview</h3>
              <p className="ui-card-sub" style={{ fontSize: '12px', margin: '4px 0 0 0' }}>
                {selectedId ? `ID: ${selectedId.slice(0, 16)}...` : 'Select a certificate'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', borderRadius: '6px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => setPreviewMode('HTML')}
                  style={{
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: '700',
                    background: previewMode === 'HTML' ? '#003A5C' : 'white',
                    color: previewMode === 'HTML' ? 'white' : '#4B5563',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  HTML
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('PDF')}
                  style={{
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: '700',
                    background: previewMode === 'PDF' ? '#003A5C' : 'white',
                    color: previewMode === 'PDF' ? 'white' : '#4B5563',
                    border: 'none',
                    cursor: 'pointer',
                    borderLeft: '1px solid #E5E7EB'
                  }}
                >
                  PDF
                </button>
              </div>

              {selectedId && previewMode === 'PDF' && pdfUrl && (
                <a 
                  className="ui-btn" 
                  href={pdfUrl} 
                  download={`certificate-${selectedId}.pdf`}
                  style={{ padding: '8px 12px', fontSize: '12px' }}
                >
                  ⬇️ Download
                </a>
              )}

              {typeof revoke === 'function' && selectedId && (
                <button
                  className="ui-btn ui-btn-danger"
                  onClick={onRevoke}
                  disabled={String(selected?.status || '').toUpperCase() === 'REVOKED'}
                  style={{ padding: '8px 12px', fontSize: '12px' }}
                >
                  🗑️ Revoke
                </button>
              )}
            </div>
          </div>

          {/* Certificate Details */}
          {selected && (
            <div style={{ borderTop: '1px solid #E5E7EB', padding: '16px', background: '#F8FAFC' }}>
              <div className="ui-stat-grid" style={{ marginBottom: '0' }}>
                <div className="ui-stat-card" style={{ padding: '12px' }}>
                  <div className="ui-stat-label">Student</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#1A202C' }}>{selected.student_name || '—'}</div>
                </div>
                <div className="ui-stat-card" style={{ padding: '12px' }}>
                  <div className="ui-stat-label">GR No</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#1A202C' }}>{selected.gr_no || '—'}</div>
                </div>
                <div className="ui-stat-card" style={{ padding: '12px' }}>
                  <div className="ui-stat-label">Template</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#1A202C' }}>{selected.template_key || '—'}</div>
                </div>
                <div className="ui-stat-card" style={{ padding: '12px' }}>
                  <div className="ui-stat-label">Status</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#1A202C' }}>
                    <div className="ui-pill" style={{ ...getStatusColor(selected.status), display: 'inline-flex' }}>
                      {selected.status || '—'}
                    </div>
                  </div>
                </div>
                <div className="ui-stat-card" style={{ padding: '12px' }}>
                  <div className="ui-stat-label">Created</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#1A202C' }}>{formatDate(selected.created_at)}</div>
                </div>
                <div className="ui-stat-card" style={{ padding: '12px' }}>
                  <div className="ui-stat-label">Anchored</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#1A202C' }}>{formatDate(selected.anchored_at)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Preview Content */}
          <div style={{ borderTop: '1px solid #E5E7EB', padding: '16px', minHeight: '400px' }}>
            {previewLoading ? (
              <div className="ui-alert">⟳ Loading preview...</div>
            ) : !selectedId ? (
              <div className="ui-alert">← Select a certificate from the left to view preview</div>
            ) : error ? (
              <div className="ui-alert ui-alert-danger">{error}</div>
            ) : previewMode === 'PDF' ? (
              pdfUrl ? (
                <iframe title="PDF Preview" style={{ width: '100%', height: '500px', border: '1px solid #E5E7EB', borderRadius: 'var(--radius)' }} src={pdfUrl} />
              ) : (
                <div className="ui-alert">PDF preview not available.</div>
              )
            ) : html ? (
              <iframe
                title="HTML Preview"
                style={{ width: '100%', height: '500px', border: '1px solid #E5E7EB', borderRadius: 'var(--radius)', background: 'white' }}
                sandbox="allow-same-origin"
                srcDoc={html}
              />
            ) : (
              <div className="ui-alert">HTML preview not available.</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
