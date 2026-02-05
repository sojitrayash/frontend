import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import SuperAdmin from './pages/SuperAdmin';
import SuperAdminCertificates from './pages/SuperAdminCertificates';
import SchoolGenerate from './pages/SchoolGenerate';
import SchoolRegister from './pages/SchoolRegister';
import SchoolSettings from './pages/SchoolSettings';
import SchoolTemplates from './pages/SchoolTemplates';
import SchoolCertificates from './pages/SchoolCertificates';
import SchoolStaff from './pages/SchoolStaff';
import SchoolErpImport from './pages/SchoolErpImport';
import SchoolProfile from './pages/SchoolProfile';
import StaffDashboard from './pages/StaffDashboard';
import StaffTenantCertificates from './pages/StaffTenantCertificates';
import PublicVerify from './pages/PublicVerify';
import AppShell from './ui/AppShell';
import { RequireRole } from './ui/RouteGuards';
import { ROLE_GROUPS, ROLES } from './lib/rbac';

function App() {
  return (
    <Router>
      <AppShell>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/verify" element={<PublicVerify />} />
          <Route path="/verify/:certificateId" element={<PublicVerify />} />
          <Route
            path="/superadmin"
            element={
              <RequireRole roles={[ROLES.SUPER_ADMIN]}>
                <SuperAdmin />
              </RequireRole>
            }
          />
          <Route
            path="/superadmin/certificates"
            element={
              <RequireRole roles={[ROLES.SUPER_ADMIN]}>
                <SuperAdminCertificates />
              </RequireRole>
            }
          />
          <Route
            path="/school/generate"
            element={
              <RequireRole roles={ROLE_GROUPS.SCHOOL_ADMINS}>
                <SchoolGenerate />
              </RequireRole>
            }
          />
          <Route
            path="/school/register"
            element={
              <RequireRole roles={ROLE_GROUPS.SCHOOL_ADMINS}>
                <SchoolRegister />
              </RequireRole>
            }
          />
          <Route
            path="/school/certificates"
            element={
              <RequireRole roles={ROLE_GROUPS.SCHOOL_USERS}>
                <SchoolCertificates />
              </RequireRole>
            }
          />

          <Route
            path="/school/profile"
            element={
              <RequireRole roles={ROLE_GROUPS.SCHOOL_USERS}>
                <SchoolProfile />
              </RequireRole>
            }
          />
          <Route
            path="/school/settings"
            element={
              <RequireRole roles={ROLE_GROUPS.SCHOOL_ADMINS}>
                <SchoolSettings />
              </RequireRole>
            }
          />
          <Route
            path="/school/templates"
            element={
              <RequireRole roles={ROLE_GROUPS.SCHOOL_ADMINS}>
                <SchoolTemplates />
              </RequireRole>
            }
          />

          <Route
            path="/school/staff"
            element={
              <RequireRole roles={ROLE_GROUPS.SCHOOL_ADMINS}>
                <SchoolStaff />
              </RequireRole>
            }
          />

          <Route
            path="/school/erp-import"
            element={
              <RequireRole roles={ROLE_GROUPS.SCHOOL_ADMINS}>
                <SchoolErpImport />
              </RequireRole>
            }
          />

          <Route
            path="/staff"
            element={
              <RequireRole roles={ROLE_GROUPS.JADELC}>
                <StaffDashboard />
              </RequireRole>
            }
          />
          <Route
            path="/staff/tenants/:tenantId/certificates"
            element={
              <RequireRole roles={ROLE_GROUPS.JADELC}>
                <StaffTenantCertificates />
              </RequireRole>
            }
          />
        </Routes>
      </AppShell>
    </Router>
  );
}

export default App;
