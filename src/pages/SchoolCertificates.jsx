import React from 'react';
import CertificateBrowser from '../components/CertificateBrowser';
import { api } from '../lib/api';

export default function SchoolCertificates() {
  return (
    <CertificateBrowser
      title="Certificates"
      subtitle="All LCs for this school • Select left → preview right."
      loadMetrics={async () => {
        const r = await api.get('/api/tenant/metrics');
        return r.data?.metrics || null;
      }}
      loadList={async ({ q, limit, offset, includeRevoked }) => {
        const r = await api.get('/api/tenant/certificates', {
          params: { q, limit, offset, includeRevoked },
        });
        return { items: r.data?.items || [], total: r.data?.total || 0 };
      }}
      loadHtml={async (certificateId) => {
        const r = await api.get(`/api/certificates/${encodeURIComponent(certificateId)}/html`, { responseType: 'text' });
        return r.data;
      }}
      loadPdf={async (certificateId) => {
        const r = await api.get(`/api/certificates/${encodeURIComponent(certificateId)}/pdf`, { responseType: 'blob' });
        return r.data;
      }}
      revoke={async (certificateId) => {
        await api.delete(`/api/certificates/${encodeURIComponent(certificateId)}`);
      }}
    />
  );
}
