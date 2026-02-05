import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function SchoolStaff() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [staff, setStaff] = useState([]);

  const [email, setEmail] = useState('');
  const [createStatus, setCreateStatus] = useState('');
  const [created, setCreated] = useState(null);

  const load = async () => {
    setLoading(true);
    setStatus('');
    try {
      const res = await api.get('/api/school/staff');
      setStaff(res.data?.staff || []);
    } catch (e) {
      setStatus(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    setCreateStatus('Creating staff...');
    setCreated(null);
    try {
      const res = await api.post('/api/school/staff', { email });
      setCreated(res.data);
      setCreateStatus('Staff created');
      setEmail('');
      await load();
    } catch (e) {
      setCreateStatus(e.response?.data?.error || e.message);
    }
  };

  const setStatusFor = async (staffUserId, statusValue) => {
    try {
      await api.put(`/api/school/staff/${encodeURIComponent(staffUserId)}/status`, { status: statusValue });
      await load();
    } catch (e) {
      alert(e.response?.data?.error || e.message);
    }
  };

  const resetPassword = async (staffUserId) => {
    try {
      const res = await api.put(`/api/school/staff/${encodeURIComponent(staffUserId)}/reset-password`);
      alert(`Temp password for ${res.data.email}: ${res.data.tempPassword}`);
    } catch (e) {
      alert(e.response?.data?.error || e.message);
    }
  };

  return (
    <div className="ui-grid" style={{ gridTemplateColumns: '1fr' }}>
      <div className="ui-card">
        <div className="ui-card-body">
          <div className="ui-row-between" style={{ flexWrap: 'wrap' }}>
            <div>
              <h2 className="ui-card-title">School Staff</h2>
              <div className="ui-card-sub">Create school staff accounts (OTP login). Manage status and reset password.</div>
            </div>
            <button className="ui-btn" type="button" onClick={load} disabled={loading}>
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          <div className="ui-divider" />

          <div className="ui-row" style={{ alignItems: 'stretch', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 320 }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Create Staff</div>
              <div className="ui-field" style={{ marginTop: 0 }}>
                <label className="ui-label">Email (Gmail)</label>
                <input className="ui-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="staff@gmail.com" />
              </div>
              <div className="ui-row" style={{ marginTop: 14 }}>
                <button className="ui-btn ui-btn-primary" type="button" onClick={create}>
                  Create
                </button>
              </div>
              {createStatus && <div className="ui-alert">{createStatus}</div>}
            </div>

            <div style={{ flex: 1, minWidth: 320 }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Provisioning Output</div>
              <div className="ui-card-sub" style={{ marginTop: 0 }}>Temp password is shown once. Share securely.</div>
              <div className="ui-divider" />

              {!created ? (
                <div className="ui-alert">No staff created yet.</div>
              ) : (
                <div className="ui-kv">
                  <div className="ui-k">Email</div>
                  <div className="ui-v">{created.email}</div>
                  <div className="ui-k">Role</div>
                  <div className="ui-v">{created.role}</div>
                  <div className="ui-k">Temp Password</div>
                  <div className="ui-v">{created.tempPassword}</div>
                </div>
              )}
            </div>
          </div>

          <div className="ui-divider" />

          {status && <div className="ui-alert ui-alert-danger">{status}</div>}

          {loading ? (
            <div className="ui-alert">Loading staff…</div>
          ) : staff.length === 0 ? (
            <div className="ui-alert">No staff users yet.</div>
          ) : (
            <div className="ui-table-wrap">
              <table className="ui-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((u) => (
                    <tr key={u.staff_user_id}>
                      <td>
                        <div style={{ fontWeight: 900 }}>{u.email}</div>
                        <div style={{ opacity: 0.75, fontSize: 12 }}>#{u.staff_user_id}</div>
                      </td>
                      <td>
                        <span className={String(u.status || 'ACTIVE').toUpperCase() === 'ACTIVE' ? 'ui-pill ui-pill-on' : 'ui-pill'}>
                          {String(u.status || 'ACTIVE').toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div className="ui-row" style={{ gap: 8, flexWrap: 'wrap' }}>
                          <button className="ui-btn" type="button" onClick={() => resetPassword(u.staff_user_id)}>
                            Reset Password
                          </button>
                          <button className="ui-btn" type="button" onClick={() => setStatusFor(u.staff_user_id, 'ACTIVE')}>
                            Activate
                          </button>
                          <button className="ui-btn ui-btn-danger" type="button" onClick={() => setStatusFor(u.staff_user_id, 'DISABLED')}>
                            Disable
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
