import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

function applyPreview(templateHtml, sample) {
  let html = String(templateHtml || '');

  const fieldLookup = new Map(Object.entries(sample || {}).map(([k, v]) => [String(k).trim().toLowerCase(), v]));
  const getField = (name) => {
    const v = fieldLookup.get(String(name || '').trim().toLowerCase());
    return v == null ? '' : String(v);
  };

  const qrStub = `<div style="width:82px;height:82px;border:2px solid #0f172a;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;background:#fff">QR</div>`;

  html = html.replace(/{{\s*QR\s*}}/g, qrStub);
  html = html.replace(/{{\s*verifyUrl\s*}}/g, sample.verifyUrl || '');
  html = html.replace(/{{\s*mode\s*}}/g, sample.mode || '');
  html = html.replace(/{{\s*grNo\s*}}/g, getField('grNo'));
  html = html.replace(/{{\s*studentName\s*}}/g, getField('studentName'));
  html = html.replace(/{{\s*uid\s*}}/g, getField('uid'));
  html = html.replace(/{{\s*date\s*}}/g, getField('date'));
  html = html.replace(/{{\s*certificateId\s*}}/g, getField('certificateId'));

  html = html.replace(/{{\s*field\s*:\s*([^}]+)\s*}}/gi, (_, name) => getField(name));

  // Hide marker content in preview
  html = html.replace(/{{\s*VD_MARKER\s*}}/g, '<!-- VD_MARKER -->');

  if (!/<html[\s>]/i.test(html)) {
    html = `<!doctype html><html><head><meta charset="utf-8" /></head><body>${html}</body></html>`;
  }

  return html;
}

export default function SchoolTemplates() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  const [baseTemplates, setBaseTemplates] = useState([]);
  const [tenantTemplates, setTenantTemplates] = useState([]);
  const [activeTemplateKey, setActiveTemplateKey] = useState('lc_default_v1');

  const [selectedKey, setSelectedKey] = useState('lc_default_v1');
  const [name, setName] = useState('');
  const [html, setHtml] = useState('');
  const [source, setSource] = useState('');

  const [newKey, setNewKey] = useState('');

  const templates = useMemo(() => {
    const merged = new Map();
    for (const t of baseTemplates) merged.set(t.key, { ...t, source: 'BASE' });
    for (const t of tenantTemplates) merged.set(t.key, { ...t, source: 'TENANT' });
    return Array.from(merged.values()).sort((a, b) => a.key.localeCompare(b.key));
  }, [baseTemplates, tenantTemplates]);

  const loadList = async () => {
    setLoading(true);
    setStatus('');
    try {
      const res = await api.get('/api/templates');
      setBaseTemplates(res.data.templates || []);
      setTenantTemplates(res.data.tenantTemplates || []);
      setActiveTemplateKey(res.data.activeTemplateKey || 'lc_default_v1');

      const initialKey = res.data.activeTemplateKey || 'lc_default_v1';
      setSelectedKey(initialKey);
    } catch (e) {
      setStatus('✗ ' + (e.response?.data?.error || e.message));
    } finally {
      setLoading(false);
    }
  };

  const loadTemplate = async (key) => {
    setStatus('');
    try {
      const res = await api.get(`/api/templates/${encodeURIComponent(key)}`);
      setName(res.data.name || key);
      setHtml(res.data.html || '');
      setSource(res.data.source || '');
    } catch (e) {
      setStatus('✗ ' + (e.response?.data?.error || e.message));
      setName('');
      setHtml('');
      setSource('');
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  useEffect(() => {
    if (!selectedKey) return;
    loadTemplate(selectedKey);
  }, [selectedKey]);

  const save = async () => {
    setSaving(true);
    setStatus('⟳ Saving...');
    try {
      await api.put(`/api/templates/${encodeURIComponent(selectedKey)}`, { name, html });
      setStatus('✓ Template saved');
      await loadList();
      await loadTemplate(selectedKey);
    } catch (e) {
      setStatus('✗ ' + (e.response?.data?.error || e.message));
    } finally {
      setSaving(false);
    }
  };

  const createNew = async () => {
    const k = String(newKey || '').trim();
    if (!k) {
      setStatus('✗ Enter a new template key first.');
      return;
    }
    const htmlToSave = String(html || '').trim() || '<div style="padding:24px">{{QR}}<div>{{studentName}}</div><div>{{grNo}}</div>{{VD_MARKER}}</div>';
    setSaving(true);
    setStatus('⟳ Creating...');
    try {
      await api.put(`/api/templates/${encodeURIComponent(k)}`, { name: name || k, html: htmlToSave });
      await loadList();
      setSelectedKey(k);
      setNewKey('');
      setStatus('✓ Template created');
    } catch (e) {
      setStatus('✗ ' + (e.response?.data?.error || e.message));
    } finally {
      setSaving(false);
    }
  };

  const setActive = async () => {
    setSaving(true);
    setStatus('⟳ Setting active...');
    try {
      const res = await api.put('/api/tenant/template', { activeTemplateKey: selectedKey });
      setActiveTemplateKey(res.data.activeTemplateKey || selectedKey);
      setStatus('✓ Active template updated');
    } catch (e) {
      setStatus('✗ ' + (e.response?.data?.error || e.message));
    } finally {
      setSaving(false);
    }
  };

  const sample = {
    grNo: '12345',
    studentName: 'JAY PATEL',
    uid: '1234-5678-9012',
    date: new Date().toISOString().slice(0, 10),
    certificateId: '0xCERTIFICATE_ID',
    mode: 'ON',
    verifyUrl: `${window.location.origin}/verify`,
    'Religion & Caste': 'Hindu',
  };

  const previewHtml = useMemo(() => applyPreview(html, sample), [html]);

  return (
    <>
      {/* Header */}
      <div className="ui-card" style={{ marginBottom: '24px' }}>
        <div className="ui-card-body">
          <h1 className="ui-card-title" style={{ fontSize: '28px', margin: '0 0 8px 0' }}>🎨 Template Manager</h1>
          <p className="ui-card-sub" style={{ margin: '0' }}>
            Customize certificate HTML templates with dynamic fields and styling
          </p>
        </div>
      </div>

      {/* Status Messages */}
      {status && (
        <div className={status.includes('✗') ? 'ui-alert ui-alert-danger' : 'ui-alert ui-alert-success'} style={{ marginBottom: '24px' }}>
          {status}
        </div>
      )}

      {loading ? (
        <div className="ui-card">
          <div className="ui-card-body">
            <div className="ui-alert">⟳ Loading templates...</div>
          </div>
        </div>
      ) : (
        <>
          {/* Template Selection & Controls */}
          <div className="ui-card" style={{ marginBottom: '24px' }}>
            <div className="ui-card-body">
              <h3 className="ui-card-title" style={{ fontSize: '18px', marginTop: '0', marginBottom: '16px' }}>📋 Select Template</h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
                <div className="ui-field" style={{ margin: '0' }}>
                  <label className="ui-label">Current Template</label>
                  <select className="ui-input" value={selectedKey} onChange={(e) => setSelectedKey(e.target.value)} disabled={saving}>
                    {templates.map((t) => (
                      <option key={t.key} value={t.key}>
                        {t.key} {t.source === 'TENANT' ? '(Custom)' : '(Standard)'}
                      </option>
                    ))}
                  </select>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '6px', fontWeight: '500' }}>
                    Active: <strong>{activeTemplateKey}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="ui-btn" onClick={() => loadTemplate(selectedKey)} disabled={saving || !selectedKey}>
                    ↻ Reload
                  </button>
                  <button className="ui-btn ui-btn-primary" onClick={setActive} disabled={saving || !selectedKey || selectedKey === activeTemplateKey}>
                    ✓ Set Active
                  </button>
                </div>
              </div>

              <div style={{ height: '1px', background: '#E5E7EB', margin: '20px 0' }} />

              <h3 className="ui-card-title" style={{ fontSize: '18px', marginTop: '0', marginBottom: '16px' }}>➕ Create New Template</h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
                <div className="ui-field" style={{ margin: '0' }}>
                  <label className="ui-label">New Template Key</label>
                  <input
                    className="ui-input"
                    placeholder="e.g. lc_my_school_v1"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    disabled={saving}
                  />
                  <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '6px', fontWeight: '500' }}>
                    Creates a custom tenant-only template
                  </div>
                </div>

                <button className="ui-btn ui-btn-success" onClick={createNew} disabled={saving || !newKey}>
                  ➕ Create Template
                </button>
              </div>
            </div>
          </div>

          {/* Editor & Preview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
            {/* Left: Editor */}
            <div className="ui-card">
              <div className="ui-card-body">
                <h3 className="ui-card-title" style={{ fontSize: '18px', marginTop: '0' }}>✏️ Edit HTML</h3>

                <div className="ui-field" style={{ marginBottom: '16px' }}>
                  <label className="ui-label">Template Name</label>
                  <input className="ui-input" value={name} onChange={(e) => setName(e.target.value)} disabled={saving} placeholder="Template name" />
                </div>

                <div className="ui-field">
                  <label className="ui-label">HTML Code</label>
                  <textarea
                    className="ui-input"
                    style={{
                      minHeight: '500px',
                      fontFamily: '"Monaco", "Courier New", monospace',
                      fontSize: '12px',
                      lineHeight: '1.5',
                      backgroundColor: '#0F172A',
                      color: '#E5E7EB',
                      padding: '12px'
                    }}
                    value={html}
                    onChange={(e) => setHtml(e.target.value)}
                    disabled={saving}
                    spellCheck={false}
                  />
                </div>

                <div style={{ marginTop: '16px' }}>
                  <button className="ui-btn ui-btn-primary" onClick={save} disabled={saving || !selectedKey} style={{ width: '100%' }}>
                    💾 {saving ? 'Saving...' : 'Save Template'}
                  </button>
                </div>

                {/* Available Placeholders */}
                <div style={{ marginTop: '20px', padding: '12px', background: '#F8FAFC', borderRadius: 'var(--radius)', border: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#003A5C', marginBottom: '8px' }}>📌 Available Placeholders</div>
                  <div style={{ fontSize: '11px', color: '#4B5563', lineHeight: '1.6', fontFamily: '"Monaco", "Courier New", monospace' }}>
                    <div>- <code style={{ background: '#fff', padding: '2px 4px', borderRadius: '3px' }}>{'{{QR}}'}</code> - QR Code</div>
                    <div>- <code style={{ background: '#fff', padding: '2px 4px', borderRadius: '3px' }}>{'{{grNo}}'}</code> - GR Number</div>
                    <div>- <code style={{ background: '#fff', padding: '2px 4px', borderRadius: '3px' }}>{'{{studentName}}'}</code> - Student</div>
                    <div>- <code style={{ background: '#fff', padding: '2px 4px', borderRadius: '3px' }}>{'{{uid}}'}</code> - UID</div>
                    <div>- <code style={{ background: '#fff', padding: '2px 4px', borderRadius: '3px' }}>{'{{date}}'}</code> - Date</div>
                    <div>- <code style={{ background: '#fff', padding: '2px 4px', borderRadius: '3px' }}>{'{{field:ColName}}'}</code> - Custom</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Preview */}
            <div className="ui-card">
              <div className="ui-card-body">
                <h3 className="ui-card-title" style={{ fontSize: '18px', marginTop: '0', marginBottom: '12px' }}>👁️ Live Preview</h3>

                <div className="ui-alert ui-alert-info" style={{ marginBottom: '12px', fontSize: '12px' }}>
                  ℹ️ Preview uses sample data. The QR shown is a placeholder, not the actual QR code.
                </div>

                <div style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: 'var(--radius)',
                  overflow: 'hidden',
                  background: '#fff',
                  height: '600px'
                }}>
                  <iframe
                    title="template-preview"
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    srcDoc={previewHtml}
                    sandbox="allow-same-origin"
                  />
                </div>

                {/* Sample Data Info */}
                <div style={{ marginTop: '16px', padding: '12px', background: '#F8FAFC', borderRadius: 'var(--radius)', border: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#003A5C', marginBottom: '8px' }}>📊 Sample Data Used</div>
                  <div style={{ fontSize: '11px', color: '#4B5563', lineHeight: '1.6' }}>
                    <div>GR No: <strong>12345</strong></div>
                    <div>Student: <strong>JAY PATEL</strong></div>
                    <div>UID: <strong>1234-5678-9012</strong></div>
                    <div>Date: <strong>Today</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
