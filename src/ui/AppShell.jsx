import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api, clearAuthSession, getRole } from '../lib/api';
import { ROLES } from '../lib/rbac';
import { useTenantSettings } from '../lib/useTenantSettings';

function NavLink({ to, children, icon }) {
  const loc = useLocation();
  const active = loc.pathname === to || (to !== '/' && loc.pathname.startsWith(to));
  return (
    <Link 
      className={active ? 'ui-navlink ui-navlink-active' : 'ui-navlink'} 
      to={to}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}
    >
      {icon && <span style={{ fontSize: '16px' }}>{icon}</span>}
      <span>{children}</span>
    </Link>
  );
}

function SideLink({ to, label, icon, onClick }) {
  const loc = useLocation();
  const active = loc.pathname === to || (to !== '/' && loc.pathname.startsWith(to));
  return (
    <Link 
      className={active ? 'ui-sidelink ui-sidelink-active' : 'ui-sidelink'} 
      to={to} 
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
    >
      {icon && <span style={{ fontSize: '16px' }}>{icon}</span>}
      <span>{label}</span>
    </Link>
  );
}

export default function AppShell({ children }) {
  const role = getRole();
  const loc = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [schoolMetrics, setSchoolMetrics] = useState(null);
  const [staffTenantCount, setStaffTenantCount] = useState(null);
  const [tenantProfile, setTenantProfile] = useState(null);

  const { computerisedMode } = useTenantSettings();
  const computerisedOn = computerisedMode === 'ON';

  const showSidebar = Boolean(role) && loc.pathname !== '/' && !loc.pathname.startsWith('/verify');

  const sideLinks = useMemo(() => {
    if (role === ROLES.SUPER_ADMIN) {
      return [
        { to: '/superadmin', label: 'Dashboard', icon: '📊' },
        { to: '/superadmin/certificates', label: 'Certificates', icon: '📜' },
      ];
    }
    if (role === ROLES.JADELC_STAFF) {
      return [{ to: '/staff', label: 'Staff Dashboard', icon: '👥' }];
    }
    if (role === ROLES.SCHOOL_ADMIN) {
      return [
        { to: '/school/generate', label: 'Generate', icon: '➕' },
        ...(computerisedOn ? [] : [{ to: '/school/register', label: 'Register', icon: '✓' }]),
        { to: '/school/certificates', label: 'Certificates', icon: '📜' },
        { to: '/school/profile', label: 'Profile', icon: '🏫' },
        { to: '/school/erp-import', label: 'ERP Import', icon: '📥' },
        { to: '/school/staff', label: 'Staff', icon: '👤' },
        { to: '/school/templates', label: 'Templates', icon: '🎨' },
        { to: '/school/settings', label: 'Settings', icon: '⚙️' },
      ];
    }
    if (role === ROLES.SCHOOL_STAFF) {
      return [
        { to: '/school/certificates', label: 'Certificates', icon: '📜' },
        { to: '/school/profile', label: 'School Profile', icon: '🏫' },
      ];
    }
    return [];
  }, [role, computerisedOn]);

  const logout = () => {
    clearAuthSession();
    window.location.href = '/';
  };

  useEffect(() => {
    let cancelled = false;
    async function loadTopbarStats() {
      try {
        setSchoolMetrics(null);
        setStaffTenantCount(null);
        setTenantProfile(null);

        if (role === ROLES.SCHOOL_ADMIN || role === ROLES.SCHOOL_STAFF) {
          const r = await api.get('/api/tenant/metrics');
          if (!cancelled) setSchoolMetrics(r.data?.metrics || null);

          try {
            const p = await api.get('/api/tenant/profile');
            if (!cancelled) setTenantProfile(p.data?.profile || null);
          } catch {
            // ignore profile failures
          }
        } else if (role === ROLES.JADELC_STAFF) {
          const r = await api.get('/api/staff/tenants');
          const tenants = Array.isArray(r.data?.tenants) ? r.data.tenants : [];
          if (!cancelled) setStaffTenantCount(tenants.length);
        }
      } catch {
        // ignore topbar stats failures
      }
    }
    if (role) loadTopbarStats();
    return () => {
      cancelled = true;
    };
  }, [role]);

  const logoData = String(tenantProfile?.logo_data || '').startsWith('data:image/') ? tenantProfile.logo_data : '';
  const tenantDisplayName = String(tenantProfile?.display_name || '').trim();

  return (
    <div className="ui-app">
      <header className="ui-topbar">
        <div className="ui-topbar-inner">
          <div className="ui-brand">
            {role === ROLES.SCHOOL_ADMIN || role === ROLES.SCHOOL_STAFF ? (
              logoData ? (
                <img
                  src={logoData}
                  alt="School logo"
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    objectFit: 'cover',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                  }}
                />
              ) : (
                <div className="ui-logo">🏫</div>
              )
            ) : (
              <div className="ui-logo">J</div>
            )}
            <div>
              <div className="ui-brand-title">
                {tenantDisplayName && (role === ROLES.SCHOOL_ADMIN || role === ROLES.SCHOOL_STAFF) 
                  ? tenantDisplayName 
                  : 'JadeLC'}
              </div>
              <div className="ui-brand-sub">Smart Certificates • On-chain Verification</div>
            </div>
          </div>

          {showSidebar ? (
            <button 
              className="ui-iconbtn" 
              type="button" 
              onClick={() => setSidebarOpen((v) => !v)} 
              aria-label="Toggle menu"
            >
              ☰ Menu
            </button>
          ) : null}

          <nav className="ui-nav">
            <NavLink to="/" icon="🏠">Home</NavLink>
            <NavLink to="/verify" icon="✓">Verify</NavLink>
            {role === ROLES.SUPER_ADMIN && <NavLink to="/superadmin" icon="📊">Admin</NavLink>}
            {role === ROLES.JADELC_STAFF && <NavLink to="/staff" icon="👥">Staff</NavLink>}
            {role === ROLES.SCHOOL_ADMIN && (
              <>
                <NavLink to="/school/generate" icon="➕">Generate</NavLink>
                {!computerisedOn && <NavLink to="/school/register" icon="✓">Register</NavLink>}
                <NavLink to="/school/certificates" icon="📜">Certificates</NavLink>
                <NavLink to="/school/profile" icon="🏫">Profile</NavLink>
              </>
            )}
            {role === ROLES.SCHOOL_STAFF && (
              <>
                <NavLink to="/school/certificates" icon="📜">Certificates</NavLink>
                <NavLink to="/school/profile" icon="🏫">Profile</NavLink>
              </>
            )}
          </nav>

          <div className="ui-topbar-right">
            {role === ROLES.SCHOOL_ADMIN || role === ROLES.SCHOOL_STAFF ? (
              schoolMetrics ? (
                <>
                  <span className="ui-badge">📜 LC {schoolMetrics.total}</span>
                  <span className="ui-badge">⛓️ Anchored {schoolMetrics.anchored}</span>
                </>
              ) : null
            ) : null}

            {role === ROLES.JADELC_STAFF && typeof staffTenantCount === 'number' ? (
              <span className="ui-badge">🏫 {staffTenantCount} Schools</span>
            ) : null}

            {role ? <span className="ui-badge">{role.replace(/_/g, ' ')}</span> : null}
            {role ? (
              <button 
                className="ui-btn" 
                onClick={logout}
                style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)' }}
              >
                Logout
              </button>
            ) : (
              <Link 
                className="ui-btn" 
                to="/"
                style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)' }}
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="ui-main">
        <div className="ui-container">
          {showSidebar ? (
            <div className="ui-layout">
              <aside className={sidebarOpen ? 'ui-sidebar ui-sidebar-open' : 'ui-sidebar'}>
                <div className="ui-sidebar-title">Navigation</div>
                <div className="ui-sidebar-links">
                  {sideLinks.map((l) => (
                    <SideLink 
                      key={l.to} 
                      to={l.to} 
                      label={l.label}
                      icon={l.icon}
                      onClick={() => setSidebarOpen(false)} 
                    />
                  ))}
                </div>
                <div className="ui-sidebar-footer">
                  <button 
                    className="ui-btn" 
                    onClick={logout}
                    style={{ width: '100%', borderColor: '#E5E7EB' }}
                  >
                    Logout
                  </button>
                </div>
              </aside>

              {sidebarOpen && <div className="ui-backdrop" onClick={() => setSidebarOpen(false)} />}

              <section className="ui-content">{children}</section>
            </div>
          ) : (
            children
          )}
        </div>
      </main>

      <footer className="ui-footer">
        <div className="ui-container ui-footer-inner">
          <div style={{ color: '#1A202C', fontWeight: '700' }}>© {new Date().getFullYear()} JadeLC</div>
          <div className="ui-footer-muted">Multi-tenant • Secure • Blockchain-verified</div>
        </div>
      </footer>
    </div>
  );
}
