import { useParams } from 'react-router-dom';
import React from 'react';
import CertificateBrowser from '../components/CertificateBrowser';
import { api } from '../lib/api';

export default function StaffTenantCertificates() {
  const { tenantId } = useParams();

  return (
    <CertificateBrowser
      title="Tenant Certificates"
      subtitle={`Tenant: ${tenantId} • Select left → preview right.`}
      loadMetrics={async () => {
        const r = await api.get(`/api/staff/tenants/${encodeURIComponent(tenantId)}/metrics`);
        return r.data?.metrics || null;
      }}
      loadList={async ({ q, limit, offset, includeRevoked }) => {
        const r = await api.get(`/api/staff/tenants/${encodeURIComponent(tenantId)}/certificates`, {
          params: { q, limit, offset, includeRevoked },
        });
        return { items: r.data?.items || [], total: r.data?.total || 0 };
      }}
      loadHtml={async (certificateId) => {
        const r = await api.get(
          `/api/staff/tenants/${encodeURIComponent(tenantId)}/certificates/${encodeURIComponent(certificateId)}/html`,
          { responseType: 'text' }
        );
        return r.data;
      }}
      loadPdf={async (certificateId) => {
        const r = await api.get(
          `/api/staff/tenants/${encodeURIComponent(tenantId)}/certificates/${encodeURIComponent(certificateId)}/pdf`,
          { responseType: 'blob' }
        );
        return r.data;
      }}
      revoke={async (certificateId) => {
        await api.delete(
          `/api/staff/tenants/${encodeURIComponent(tenantId)}/certificates/${encodeURIComponent(certificateId)}`
        );
      }}
    />
  );
}
