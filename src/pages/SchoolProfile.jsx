import React, { useEffect, useMemo, useState } from 'react';
import { api, getRole } from '../lib/api';
import { ROLES } from '../lib/rbac';

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error('Failed to read file'));
    r.onload = () => resolve(String(r.result || ''));
    r.readAsDataURL(file);
  });
}

export default function SchoolProfile() {
  const role = getRole();
  const canEdit = role === ROLES.SCHOOL_ADMIN;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  const [displayName, setDisplayName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [logoData, setLogoData] = useState('');

  const logoOk = useMemo(() => String(logoData || '').startsWith('data:image/'), [logoData]);

  const load = async () => {
    setLoading(true);
    setStatus('');
    try {
      const r = await api.get('/api/tenant/profile');
      const p = r.data?.profile || {};
      setDisplayName(p.display_name || '');
      setAddress(p.address || '');
      setPhone(p.phone || '');
      setLogoData(p.logo_data || '');
    } catch (e) {
      setStatus('Error: ' + (e.response?.data?.error || e.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!canEdit) return;

    setSaving(true);
    setStatus('');
    try {
      const payload = {
        displayName,
        address,
        phone,
        logoData: logoData || null,
      };
      const r = await api.put('/api/tenant/profile', payload);
      const p = r.data?.profile || {};
      setDisplayName(p.display_name || '');
      setAddress(p.address || '');
      setPhone(p.phone || '');
      setLogoData(p.logo_data || '');
      setStatus('✓ Profile saved successfully');
    } catch (e) {
      setStatus('Error: ' + (e.response?.data?.error || e.message));
    } finally {
      setSaving(false);
    }
  };

  const onPickLogo = async (file) => {
    if (!file) return;
    setStatus('');
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setLogoData(dataUrl);
      setStatus('✓ Logo selected');
    } catch (e) {
      setStatus('Error: ' + e.message);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="ui-card" style={{ marginBottom: '24px' }}>
        <div className="ui-card-body">
          <div className="ui-card-header">
            <div>
              <h1 className="ui-card-title" style={{ fontSize: '28px', margin: '0 0 4px 0' }}>🏫 School Profile</h1>
              <p className="ui-card-sub" style={{ margin: '0' }}>Manage school details and branding</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="ui-btn" onClick={load} disabled={loading}>
                ⟳ Refresh
              </button>
              <button className="ui-btn ui-btn-primary" onClick={save} disabled={!canEdit || loading || saving}>
                {saving ? '⟳ Saving...' : '💾 Save'}
              </button>
            </div>
          </div>

          {role === ROLES.SCHOOL_STAFF && (
            <div className="ui-alert ui-alert-warning" style={{ marginTop: '0' }}>
              📖 You are viewing in read-only mode. Only school admins can edit this profile.
            </div>
          )}

          {status && (
            <div className={status.includes('Error') ? 'ui-alert ui-alert-danger' : 'ui-alert ui-alert-success'} style={{ marginTop: '0' }}>
              {status}
            </div>
          )}
        </div>
      </div>

      {/* Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
        {/* Left: Form */}
        <div className="ui-card">
          <div className="ui-card-body">
            <h3 className="ui-card-title" style={{ fontSize: '18px', marginTop: '0' }}>📝 Details</h3>

            {loading ? (
              <div className="ui-alert">⟳ Loading profile...</div>
            ) : (
              <>
                <div className="ui-field">
                  <label className="ui-label">School Name</label>
                  <input
                    className="ui-input"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={!canEdit}
                    placeholder="Enter school name"
                  />
                </div>

                <div className="ui-field">
                  <label className="ui-label">Address</label>
                  <textarea
                    className="ui-input"
                    rows={4}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={!canEdit}
                    placeholder="Enter full address"
                    style={{ resize: 'none' }}
                  />
                </div>

                <div className="ui-field">
                  <label className="ui-label">Phone Number</label>
                  <input
                    className="ui-input"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={!canEdit}
                    placeholder="+91 (phone)"
                  />
                </div>

                <div className="ui-field">
                  <label className="ui-label">Logo (PNG/JPG)</label>
                  <input
                    className="ui-input"
                    type="file"
                    accept="image/*"
                    disabled={!canEdit}
                    onChange={(e) => onPickLogo(e.target.files?.[0] || null)}
                  />
                  <p style={{ fontSize: '12px', color: '#6B7280', margin: '6px 0 0 0', fontWeight: '500' }}>
                    💡 Square logo recommended. Max size: 5MB
                  </p>
                </div>

                {canEdit && (
                  <div style={{ marginTop: '12px' }}>
                    <button
                      className="ui-btn ui-btn-secondary"
                      onClick={() => setLogoData('')}
                      disabled={saving || !logoOk}
                      style={{ width: '100%' }}
                    >
                      🗑️ Remove Logo
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right: Preview */}
        <div className="ui-card">
          <div className="ui-card-body">
            <h3 className="ui-card-title" style={{ fontSize: '18px', marginTop: '0' }}>👁️ Preview</h3>

            {loading ? (
              <div className="ui-alert">⟳ Loading preview...</div>
            ) : (
              <div style={{
                background: 'linear-gradient(135deg, #F8FAFC 0%, #F3F7FF 100%)',
                padding: '20px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #E5E7EB'
              }}>
                {/* Logo Preview */}
                <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                  {logoOk ? (
                    <img
                      src={logoData}
                      alt="School logo"
                      style={{
                        maxWidth: '120px',
                        maxHeight: '120px',
                        borderRadius: 'var(--radius-md)',
                        border: '2px solid #E5E7EB',
                        objectFit: 'contain',
                        background: 'white'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '120px',
                      height: '120px',
                      margin: '0 auto',
                      borderRadius: 'var(--radius-md)',
                      border: '2px dashed #E5E7EB',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: '48px',
                      background: 'white'
                    }}>
                      🏫
                    </div>
                  )}
                </div>

                {/* School Name */}
                <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#003A5C',
                    marginBottom: '4px'
                  }}>
                    {displayName || 'Your School'}
                  </div>
                </div>

                {/* Contact Info */}
                <div style={{
                  background: 'white',
                  padding: '12px',
                  borderRadius: 'var(--radius)',
                  fontSize: '13px',
                  lineHeight: '1.6'
                }}>
                  <div style={{ marginBottom: '8px', color: '#6B7280' }}>
                    <strong style={{ color: '#4B5563' }}>📞 Phone:</strong> {phone || '—'}
                  </div>
                  <div style={{ color: '#6B7280' }}>
                    <strong style={{ color: '#4B5563' }}>📍 Address:</strong>
                    <div style={{ marginTop: '4px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#4B5563' }}>
                      {address || '—'}
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(0, 58, 92, 0.05) 0%, rgba(78, 196, 100, 0.05) 100%)',
                  border: '1px solid #D1FAE5',
                  borderRadius: 'var(--radius)',
                  padding: '12px',
                  marginTop: '12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#003A5C'
                }}>
                  ✓ This information appears in your school's topbar
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
