import { useCallback, useEffect, useState } from 'react';
import { api, getRole } from './api';
import { ROLES } from './rbac';

export function useTenantSettings() {
  const role = getRole();
  const enabled = role === ROLES.SCHOOL_ADMIN || role === ROLES.SCHOOL_STAFF;

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!enabled) {
      setSettings(null);
      setLoading(false);
      setError('');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/tenant/settings');
      setSettings(res.data || null);
    } catch (e) {
      setSettings(null);
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const computerisedMode = String(settings?.computerised_mode || 'OFF').toUpperCase() === 'ON' ? 'ON' : 'OFF';

  return {
    enabled,
    loading,
    error,
    settings,
    computerisedMode,
    refresh,
  };
}
