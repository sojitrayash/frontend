import React, { useEffect, useState } from 'react';
import { api, getSchoolPrivateKey, setSchoolPrivateKey } from '../lib/api';

export default function SchoolSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [computerisedMode, setComputerisedMode] = useState('OFF');
  const [vdEnabled, setVdEnabled] = useState(false);
  const [privateKey, setPrivateKey] = useState(getSchoolPrivateKey() || '');
  const [erpConfigText, setErpConfigText] = useState('');

  const load = async () => {
    setLoading(true);
    setStatus('');
    try {
      const res = await api.get('/api/tenant/settings');
      setComputerisedMode(String(res.data.computerised_mode || 'OFF').toUpperCase() === 'ON' ? 'ON' : 'OFF');
      setVdEnabled(Boolean(res.data.vd_enabled));
      const erp = res.data.erp_config;
      if (erp) {
        setErpConfigText(typeof erp === 'string' ? erp : JSON.stringify(erp, null, 2));
      } else {
        setErpConfigText(JSON.stringify({ type: 'csv', rename: {} }, null, 2));
      }
    } catch (e) {
      setStatus(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    setStatus('Saving...');
    try {
      let erpConfig = null;
      const raw = String(erpConfigText || '').trim();
      if (raw) {
        try {
          erpConfig = JSON.parse(raw);
        } catch {
          throw new Error('ERP config must be valid JSON');
        }
      }

      await api.put('/api/tenant/settings', {
        computerisedMode,
        vdEnabled,
        erpConfig,
      });

      if (privateKey) {
        setSchoolPrivateKey(privateKey);
      }

      setStatus('Saved');
      await load();
    } catch (e) {
      setStatus(e.response?.data?.error || e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ui-card">
      <div className="ui-card-body">
        <h2 className="ui-card-title">School Settings</h2>
        <div className="ui-card-sub">
          Switch between Computerised OFF (scan register) and Computerised ON (hash+anchor during generation).
        </div>

        <div className="ui-divider" />

        {loading ? (
          <div className="ui-alert">Loading settings...</div>
        ) : (
          <>
            <div className="ui-field">
              <label className="ui-label">Computerised Mode</label>
              <div className="ui-row" style={{ gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={computerisedMode === 'OFF' ? 'ui-btn ui-btn-primary' : 'ui-btn'}
                  onClick={() => setComputerisedMode('OFF')}
                  disabled={saving}
                >
                  OFF (Scan Register)
                </button>
                <button
                  type="button"
                  className={computerisedMode === 'ON' ? 'ui-btn ui-btn-primary' : 'ui-btn'}
                  onClick={() => setComputerisedMode('ON')}
                  disabled={saving}
                >
                  ON (Anchor at Generation)
                </button>
              </div>
              <div className="ui-card-sub" style={{ marginTop: 8 }}>
                {computerisedMode === 'OFF'
                  ? 'OFF: Generate blank LC (GR + Name), print, handwriting, then upload scan to Register.'
                  : 'ON: Generate LC from entered/ERP data and anchor hash on-chain immediately. Register upload is disabled.'}
              </div>
            </div>

            <div className="ui-field">
              <label className="ui-label">VD Enabled (coming next)</label>
              <label style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={vdEnabled}
                  onChange={(e) => setVdEnabled(e.target.checked)}
                  disabled={saving}
                />
                <span>Enable verification bundle embedding</span>
              </label>
            </div>

            <div className="ui-field">
              <label className="ui-label">School Private Key (stored in this browser)</label>
              <input
                className="ui-input"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder="0x..."
              />
              <div className="ui-card-sub" style={{ marginTop: 8 }}>
                Required for anchoring. In OFF mode it is used during Register. In ON mode it is used during Generate.
              </div>
            </div>

            <div className="ui-field">
              <label className="ui-label">ERP Config (JSON)</label>
              <textarea
                className="ui-input"
                style={{ minHeight: 140, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}
                value={erpConfigText}
                onChange={(e) => setErpConfigText(e.target.value)}
                placeholder='{"type":"csv","rename":{"ERP Column":"Template Field"}}'
              />
              <div className="ui-card-sub" style={{ marginTop: 8 }}>
                Use this to rename ERP CSV columns into stable template keys (used as dynamic fields). Example rename:
                <span style={{ display: 'block', opacity: 0.85 }}>"FatherName" → "Father Name"</span>
              </div>
            </div>

            <div className="ui-row" style={{ marginTop: 14 }}>
              <button className="ui-btn ui-btn-primary" type="button" onClick={save} disabled={saving}>
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
              <button className="ui-btn" type="button" onClick={load} disabled={saving}>
                Refresh
              </button>
            </div>

            {status && <div className="ui-alert">{status}</div>}
          </>
        )}
      </div>
    </div>
  );
}
