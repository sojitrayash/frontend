import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function StaffDashboard() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [tenants, setTenants] = useState([]);

  const load = async () => {
    setLoading(true);
    setStatus('');
    try {
      const res = await api.get('/api/staff/tenants');
      setTenants(res.data.tenants || []);
    } catch (e) {
      setStatus('✗ ' + (e.response?.data?.error || e.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      {/* Header */}
      <div className="ui-card" style={{ marginBottom: '24px' }}>
        <div className="ui-card-body">
          <div className="ui-card-header">
            <div>
              <h1 className="ui-card-title" style={{ fontSize: '28px', margin: '0 0 4px 0' }}>👥 Staff Dashboard</h1>
              <p className="ui-card-sub" style={{ margin: '0' }}>Assigned schools for verification and review</p>
            </div>
            <button className="ui-btn" onClick={load} disabled={loading}>
              ⟳ {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {status && (
            <div className="ui-alert ui-alert-danger" style={{ marginTop: '0' }}>
              {status}
            </div>
          )}
        </div>
      </div>

      {/* Tenants Grid */}
      {loading ? (
        <div className="ui-card">
          <div className="ui-card-body">
            <div className="ui-alert">⟳ Loading assigned schools...</div>
          </div>
        </div>
      ) : tenants.length === 0 ? (
        <div className="ui-card">
          <div className="ui-card-body">
            <div className="ui-alert ui-alert-warning">
              📋 No schools assigned to you yet. Contact your administrator to assign schools.
            </div>
          </div>
        </div>
      ) : (
        <div className="ui-grid ui-grid-2">
          {tenants.map((t) => (
            <div key={t.tenant_id} className="ui-card">
              <div className="ui-card-body">
                <h3 className="ui-card-title" style={{ fontSize: '18px', margin: '0 0 4px 0' }}>
                  🏫 {t.school_name}
                </h3>
                <p className="ui-card-sub" style={{ margin: '0 0 16px 0' }}>
                  {t.school_email}
                </p>

                <div style={{
                  background: '#F8FAFC',
                  padding: '12px',
                  borderRadius: 'var(--radius)',
                  marginBottom: '16px',
                  fontSize: '13px'
                }}>
                  <div style={{ color: '#6B7280', marginBottom: '4px' }}>
                    <strong>Mode:</strong> {t.computerised_mode === 'ON' ? '✓ Computerised' : '○ Manual'}
                  </div>
                  <div style={{ color: '#6B7280' }}>
                    <strong>Tenant ID:</strong> {t.tenant_id}
                  </div>
                </div>

                <Link
                  className="ui-btn ui-btn-primary"
                  to={`/staff/tenants/${encodeURIComponent(t.tenant_id)}/certificates`}
                  style={{ width: '100%', display: 'block', textAlign: 'center', padding: '10px' }}
                >
                  📜 View Certificates
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
