import React, { useEffect, useMemo, useState } from 'react';
import CertificateBrowser from '../components/CertificateBrowser';
import { api } from '../lib/api';

export default function SuperAdminCertificates() {
  const [schools, setSchools] = useState([]);
  const [schoolsLoaded, setSchoolsLoaded] = useState(false);
  const [tenantId, setTenantId] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function loadSchools() {
      try {
        const r = await api.get('/api/superadmin/schools');
        const list = Array.isArray(r.data?.schools) ? r.data.schools : [];
        if (cancelled) return;
        setSchools(list);
        setSchoolsLoaded(true);
        // Default to first school to avoid mixing across schools.
        if (!tenantId && list[0]?.tenant_id) setTenantId(String(list[0].tenant_id));
      } catch {
        if (!cancelled) setSchoolsLoaded(true);
      }
    }
    loadSchools();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedSchoolName = useMemo(() => {
    const tid = String(tenantId || '').trim();
    if (!tid) return '';
    const s = schools.find((x) => String(x.tenant_id) === tid);
    return s?.school_name ? String(s.school_name) : '';
  }, [schools, tenantId]);

  const subtitle = useMemo(() => {
    const tid = String(tenantId || '').trim();
    if (tid && selectedSchoolName) return `School-wise • ${selectedSchoolName} (${tid})`;
    if (tid) return `School-wise • Tenant: ${tid}`;
    return 'All schools • (Tip: select a school to avoid mixing)';
  }, [tenantId]);

  return (
    <CertificateBrowser
      title="All Certificates"
      subtitle={subtitle}
      loadMetrics={null}
      loadList={async ({ q, limit, offset, includeRevoked }) => {
        const params = { q, limit, offset, includeRevoked };
        const tid = String(tenantId || '').trim();
        if (tid) params.tenantId = tid;

        const r = await api.get('/api/superadmin/certificates', { params });
        return { items: r.data?.items || [], total: r.data?.total || 0 };
      }}
      loadHtml={async (certificateId) => {
        const r = await api.get(`/api/superadmin/certificates/${encodeURIComponent(certificateId)}/html`, {
          responseType: 'text',
        });
        return r.data;
      }}
      loadPdf={async (certificateId) => {
        const r = await api.get(`/api/superadmin/certificates/${encodeURIComponent(certificateId)}/pdf`, {
          responseType: 'blob',
        });
        return r.data;
      }}
      revoke={async (certificateId) => {
        await api.delete(`/api/superadmin/certificates/${encodeURIComponent(certificateId)}`);
      }}
      initialIncludeRevoked={false}
      renderExtraControls={() => (
        <div className="w-full sm:w-72">
          <label className="ui-label">School</label>
          <select
            className="ui-input"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            disabled={!schoolsLoaded}
          >
            <option value="">All Schools (mixed)</option>
            {schools.map((s) => (
              <option key={s.tenant_id} value={String(s.tenant_id)}>
                {s.school_name} ({String(s.tenant_id).slice(0, 8)}…)
              </option>
            ))}
          </select>
        </div>
      )}
    />
  );
}
