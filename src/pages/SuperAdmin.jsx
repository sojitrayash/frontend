import React, { useEffect, useMemo, useState } from 'react';
import { api, clearAuthSession } from '../lib/api';

export default function SuperAdmin() {
  const [schoolName, setSchoolName] = useState('');
  const [schoolEmail, setSchoolEmail] = useState('');
  const [status, setStatus] = useState('');
  const [created, setCreated] = useState(null);
  const [schools, setSchools] = useState([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [schoolFilter, setSchoolFilter] = useState('');

  const [staffEmail, setStaffEmail] = useState('');
  const [staffRole, setStaffRole] = useState('JADELC_STAFF');
  const [staffTenantId, setStaffTenantId] = useState('');
  const [staffStatus, setStaffStatus] = useState('');
  const [createdStaff, setCreatedStaff] = useState(null);
  const [staff, setStaff] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [tenantSelections, setTenantSelections] = useState({});

  const loadSchools = async () => {
    setLoadingSchools(true);
    try {
      const res = await api.get('/api/superadmin/schools');
      setSchools(res.data?.schools || []);
    } catch (e) {
      // Keep create-school UX even if list fails.
      console.warn('Failed to load schools:', e.response?.data?.error || e.message);
    } finally {
      setLoadingSchools(false);
    }
  };

  useEffect(() => {
    loadSchools();
    loadStaff();
  }, []);

  const loadStaff = async () => {
    setLoadingStaff(true);
    try {
      const res = await api.get('/api/superadmin/staff');
      const list = res.data?.staff || [];
      setStaff(list);

      // Initialize selection state from API (only applies to JADELC_STAFF rows).
      const sel = {};
      for (const u of list) {
        if (String(u.role || '').toUpperCase() === 'JADELC_STAFF') {
          sel[u.staff_user_id] = Array.isArray(u.tenant_ids) ? u.tenant_ids.map(String) : [];
        }
      }
      setTenantSelections(sel);
    } catch (e) {
      console.warn('Failed to load staff:', e.response?.data?.error || e.message);
    } finally {
      setLoadingStaff(false);
    }
  };

  const filteredSchools = useMemo(() => {
    const q = String(schoolFilter || '').trim().toLowerCase();
    if (!q) return schools;
    return schools.filter((s) => {
      const name = String(s.school_name || '').toLowerCase();
      const email = String(s.school_email || '').toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [schools, schoolFilter]);

  const createSchool = async () => {
    setStatus('Creating school...');
    setCreated(null);
    try {
      const res = await api.post('/api/superadmin/schools', { schoolName, schoolEmail });
      setCreated(res.data);
      setStatus('School created');
      await loadSchools();
    } catch (e) {
      setStatus(e.response?.data?.error || e.message);
    }
  };

  const createStaff = async () => {
    setStaffStatus('Creating staff user...');
    setCreatedStaff(null);
    try {
      const payload = {
        email: staffEmail,
        role: staffRole,
      };
      if (staffRole === 'SCHOOL_STAFF') payload.tenantId = staffTenantId;

      const res = await api.post('/api/superadmin/staff', payload);
      setCreatedStaff(res.data);
      setStaffStatus('Staff user created');
      await loadStaff();
    } catch (e) {
      setStaffStatus(e.response?.data?.error || e.message);
    }
  };

  const assignStaffTenants = async (staffUserId) => {
    try {
      const tenantIds = tenantSelections[staffUserId] || [];
      await api.put(`/api/superadmin/staff/${staffUserId}/assign-tenants`, { tenantIds });
      await loadStaff();
      alert('Tenant access updated');
    } catch (e) {
      alert(e.response?.data?.error || e.message);
    }
  };

  const updateMode = async (tenantId, computerisedMode) => {
    try {
      await api.put('/api/tenant/settings', { tenantId, computerisedMode });
      await loadSchools();
    } catch (e) {
      alert(e.response?.data?.error || e.message);
    }
  };

  const setSchoolStatusFor = async (tenantId, statusValue) => {
    try {
      if (String(statusValue).toUpperCase() === 'DELETED') {
        const ok = window.confirm('Mark this school as DELETED? This will block logins and disable normal operations.');
        if (!ok) return;
      }
      await api.put(`/api/superadmin/schools/${encodeURIComponent(tenantId)}/status`, { status: statusValue });
      await loadSchools();
    } catch (e) {
      alert(e.response?.data?.error || e.message);
    }
  };

  const setStaffStatusFor = async (staffUserId, statusValue) => {
    try {
      if (String(statusValue).toUpperCase() === 'DELETED') {
        const ok = window.confirm('Mark this staff user as DELETED? This will block logins.');
        if (!ok) return;
      }
      await api.put(`/api/superadmin/staff/${encodeURIComponent(staffUserId)}/status`, { status: statusValue });
      await loadStaff();
    } catch (e) {
      alert(e.response?.data?.error || e.message);
    }
  };

  const logout = () => {
    clearAuthSession();
    window.location.href = '/';
  };

  return (
    <div className="ui-grid" style={{ gridTemplateColumns: '1fr' }}>
      <div className="ui-card">
        <div className="ui-card-body">
          <div className="ui-row-between">
            <div>
              <h2 className="ui-card-title">Super Admin</h2>
              <div className="ui-card-sub">Create schools, provision tenants, and set issuer permissions.</div>
            </div>
            <button onClick={logout} className="ui-btn ui-btn-secondary" type="button">
              Logout
            </button>
          </div>

          <div className="ui-divider" />

          <div className="ui-row" style={{ alignItems: 'stretch', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 320 }}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Create School</div>
              <div className="ui-field" style={{ marginTop: 0 }}>
                <label className="ui-label">School Name</label>
                <input className="ui-input" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
              </div>
              <div className="ui-field">
                <label className="ui-label">School Email (Gmail)</label>
                <input className="ui-input" value={schoolEmail} onChange={(e) => setSchoolEmail(e.target.value)} placeholder="school@gmail.com" />
              </div>
              <div className="ui-row" style={{ marginTop: 14 }}>
                <button onClick={createSchool} className="ui-btn ui-btn-primary" type="button">
                  Create School + Tenant
                </button>
                <button onClick={loadSchools} className="ui-btn" type="button" disabled={loadingSchools}>
                  {loadingSchools ? 'Refreshing…' : 'Refresh List'}
                </button>
              </div>
              {status && <div className="ui-alert">{status}</div>}
            </div>

            <div style={{ flex: 1, minWidth: 320 }}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Provisioning Output</div>
              <div className="ui-card-sub" style={{ marginTop: 0 }}>Share this securely with the school. Private key is shown once.</div>
              <div className="ui-divider" />

              {!created ? (
                <div className="ui-alert">No school created yet.</div>
              ) : (
                <div className="ui-kv">
                  <div className="ui-k">Email</div>
                  <div className="ui-v">{created.schoolEmail}</div>
                  <div className="ui-k">Temp Password</div>
                  <div className="ui-v">{created.tempPassword}</div>
                  <div className="ui-k">School ID</div>
                  <div className="ui-v">{created.schoolId}</div>
                  <div className="ui-k">Secret ID</div>
                  <div className="ui-v">{created.secretId}</div>
                  <div className="ui-k">Private Key</div>
                  <div className="ui-v">{created.privateKey}</div>
                  <div className="ui-k">Signing Address</div>
                  <div className="ui-v">{created.signingAddress}</div>
                  <div className="ui-k">Issuer ID</div>
                  <div className="ui-v">{created.issuerId}</div>
                  {'emailSent' in created ? (
                    <>
                      <div className="ui-k">Email Sent</div>
                      <div className="ui-v">{created.emailSent ? 'YES' : 'NO'}</div>
                    </>
                  ) : null}
                  {created.gasTopupTxHash ? (
                    <>
                      <div className="ui-k">Gas Top-up Tx</div>
                      <div className="ui-v">{created.gasTopupTxHash}</div>
                    </>
                  ) : null}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      <div className="ui-card">
        <div className="ui-card-body">
          <div className="ui-row-between" style={{ flexWrap: 'wrap' }}>
            <div>
              <h3 className="ui-card-title">Schools</h3>
              <div className="ui-card-sub">Monitor tenants and switch Computerised OFF/ON per school.</div>
            </div>
            <div className="ui-row" style={{ flexWrap: 'wrap' }}>
              <input
                className="ui-input"
                style={{ width: 260 }}
                value={schoolFilter}
                onChange={(e) => setSchoolFilter(e.target.value)}
                placeholder="Search school…"
              />
            </div>
          </div>

          <div className="ui-divider" />

          {loadingSchools ? (
            <div className="ui-alert">Loading schools…</div>
          ) : filteredSchools.length === 0 ? (
            <div className="ui-alert">No schools found.</div>
          ) : (
            <div className="ui-table-wrap">
              <table className="ui-table">
                <thead>
                  <tr>
                    <th>School</th>
                    <th>Status</th>
                    <th>Mode</th>
                    <th>Total</th>
                    <th>Hashed</th>
                    <th>Anchored</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSchools.map((s) => (
                    <tr key={s.tenant_id}>
                      <td>
                        <div style={{ fontWeight: 800 }}>{s.school_name}</div>
                        <div style={{ opacity: 0.75, fontSize: 12 }}>{s.school_email}</div>
                      </td>
                      <td>
                        <span className={String(s.status || 'ACTIVE').toUpperCase() === 'ACTIVE' ? 'ui-pill ui-pill-on' : 'ui-pill'}>
                          {String(s.status || 'ACTIVE').toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span className={String(s.computerised_mode).toUpperCase() === 'ON' ? 'ui-pill ui-pill-on' : 'ui-pill'}>
                          {String(s.computerised_mode || 'OFF').toUpperCase()}
                        </span>
                      </td>
                      <td>{s.certificates_total}</td>
                      <td>{s.certificates_hashed}</td>
                      <td>{s.certificates_anchored}</td>
                      <td>
                        <div className="ui-row" style={{ gap: 8, flexWrap: 'wrap' }}>
                          <button className="ui-btn" type="button" onClick={() => updateMode(s.tenant_id, 'OFF')}>
                            Set OFF
                          </button>
                          <button className="ui-btn ui-btn-primary" type="button" onClick={() => updateMode(s.tenant_id, 'ON')}>
                            Set ON
                          </button>
                          <button className="ui-btn" type="button" onClick={() => setSchoolStatusFor(s.tenant_id, 'ACTIVE')}>
                            Activate
                          </button>
                          <button className="ui-btn ui-btn-danger" type="button" onClick={() => setSchoolStatusFor(s.tenant_id, 'DISABLED')}>
                            Disable
                          </button>
                          <button className="ui-btn ui-btn-danger" type="button" onClick={() => setSchoolStatusFor(s.tenant_id, 'DELETED')}>
                            Delete
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

      <div className="ui-card">
        <div className="ui-card-body">
          <div className="ui-row-between" style={{ flexWrap: 'wrap' }}>
            <div>
              <h3 className="ui-card-title">Staff</h3>
              <div className="ui-card-sub">Create Staff accounts and assign tenant access (JadeLC Staff).</div>
            </div>
            <div className="ui-row" style={{ flexWrap: 'wrap' }}>
              <button onClick={loadStaff} className="ui-btn" type="button" disabled={loadingStaff}>
                {loadingStaff ? 'Refreshing…' : 'Refresh Staff'}
              </button>
            </div>
          </div>

          <div className="ui-divider" />

          <div className="ui-row" style={{ alignItems: 'stretch', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 320 }}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Create Staff User</div>
              <div className="ui-field" style={{ marginTop: 0 }}>
                <label className="ui-label">Email (Gmail)</label>
                <input
                  className="ui-input"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="staff@gmail.com"
                />
              </div>

              <div className="ui-field">
                <label className="ui-label">Role</label>
                <select className="ui-input" value={staffRole} onChange={(e) => setStaffRole(e.target.value)}>
                  <option value="JADELC_STAFF">JADELC_STAFF</option>
                  <option value="SCHOOL_STAFF">SCHOOL_STAFF</option>
                </select>
              </div>

              {staffRole === 'SCHOOL_STAFF' ? (
                <div className="ui-field">
                  <label className="ui-label">School / Tenant</label>
                  <select className="ui-input" value={staffTenantId} onChange={(e) => setStaffTenantId(e.target.value)}>
                    <option value="">Select tenant…</option>
                    {schools.map((s) => (
                      <option key={s.tenant_id} value={String(s.tenant_id)}>
                        {s.school_name} (#{s.tenant_id})
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="ui-row" style={{ marginTop: 14 }}>
                <button onClick={createStaff} className="ui-btn ui-btn-primary" type="button">
                  Create Staff
                </button>
              </div>
              {staffStatus && <div className="ui-alert">{staffStatus}</div>}
            </div>

            <div style={{ flex: 1, minWidth: 320 }}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Staff Provisioning Output</div>
              <div className="ui-card-sub" style={{ marginTop: 0 }}>Share this securely. Temp password is shown once.</div>
              <div className="ui-divider" />

              {!createdStaff ? (
                <div className="ui-alert">No staff created yet.</div>
              ) : (
                <div className="ui-kv">
                  <div className="ui-k">Email</div>
                  <div className="ui-v">{createdStaff.email}</div>
                  <div className="ui-k">Role</div>
                  <div className="ui-v">{createdStaff.role}</div>
                  <div className="ui-k">Temp Password</div>
                  <div className="ui-v">{createdStaff.tempPassword}</div>
                  {'emailSent' in createdStaff ? (
                    <>
                      <div className="ui-k">Email Sent</div>
                      <div className="ui-v">{createdStaff.emailSent ? 'YES' : 'NO'}</div>
                    </>
                  ) : null}
                  {createdStaff.tenantId ? (
                    <>
                      <div className="ui-k">Tenant</div>
                      <div className="ui-v">{createdStaff.tenantId}</div>
                    </>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          <div className="ui-divider" />

          {loadingStaff ? (
            <div className="ui-alert">Loading staff…</div>
          ) : staff.length === 0 ? (
            <div className="ui-alert">No staff users yet.</div>
          ) : (
            <div className="ui-table-wrap">
              <table className="ui-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Tenant</th>
                    <th>Access</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((u) => {
                    const role = String(u.role || '').toUpperCase();
                    const directTenantId = u.tenant_id != null ? String(u.tenant_id) : '';
                    const school = directTenantId ? schools.find((s) => String(s.tenant_id) === directTenantId) : null;
                    return (
                      <tr key={u.staff_user_id}>
                        <td>
                          <div style={{ fontWeight: 800 }}>{u.email}</div>
                          <div style={{ opacity: 0.75, fontSize: 12 }}>#{u.staff_user_id}</div>
                        </td>
                        <td>{role}</td>
                        <td>
                          <span className={String(u.status || 'ACTIVE').toUpperCase() === 'ACTIVE' ? 'ui-pill ui-pill-on' : 'ui-pill'}>
                            {String(u.status || 'ACTIVE').toUpperCase()}
                          </span>
                        </td>
                        <td>
                          {role === 'SCHOOL_STAFF' ? (
                            <>
                              <div style={{ fontWeight: 800 }}>{school?.school_name || '—'}</div>
                              <div style={{ opacity: 0.75, fontSize: 12 }}>Tenant #{directTenantId || '—'}</div>
                            </>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td>
                          {role === 'JADELC_STAFF' ? (
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                              <select
                                className="ui-input"
                                multiple
                                size={Math.min(6, Math.max(3, schools.length))}
                                value={tenantSelections[u.staff_user_id] || []}
                                onChange={(e) => {
                                  const values = Array.from(e.target.selectedOptions).map((o) => String(o.value));
                                  setTenantSelections((prev) => ({ ...prev, [u.staff_user_id]: values }));
                                }}
                                style={{ minWidth: 260 }}
                              >
                                {schools.map((s) => (
                                  <option key={s.tenant_id} value={String(s.tenant_id)}>
                                    {s.school_name} (#{s.tenant_id})
                                  </option>
                                ))}
                              </select>
                              <button className="ui-btn ui-btn-primary" type="button" onClick={() => assignStaffTenants(u.staff_user_id)}>
                                Save
                              </button>
                            </div>
                          ) : (
                            <span style={{ opacity: 0.75 }}>—</span>
                          )}
                        </td>
                        <td>
                          <div className="ui-row" style={{ gap: 8, flexWrap: 'wrap' }}>
                            <button className="ui-btn" type="button" onClick={() => setStaffStatusFor(u.staff_user_id, 'ACTIVE')}>
                              Activate
                            </button>
                            <button className="ui-btn ui-btn-danger" type="button" onClick={() => setStaffStatusFor(u.staff_user_id, 'DISABLED')}>
                              Disable
                            </button>
                            <button className="ui-btn ui-btn-danger" type="button" onClick={() => setStaffStatusFor(u.staff_user_id, 'DELETED')}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
