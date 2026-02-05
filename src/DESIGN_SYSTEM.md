# JadeLC Premium SaaS Design System

## Color Palette

### Primary Brand Colors
- **Primary (Dark Blue)**: `#003A5C` (var(--primary))
- **Primary Light**: `#004B78` (var(--primary-light))
- **Primary Lighter**: `#0F5F8F` (var(--primary-lighter))

### Secondary Brand Colors
- **Secondary (Green)**: `#4EC464` (var(--secondary))
- **Secondary Light**: `#6FD483` (var(--secondary-light))
- **Accent**: `#00A878` (var(--accent))

### Status Colors
- **Success**: `#10B981` (var(--success))
- **Warning**: `#F59E0B` (var(--warning))
- **Danger**: `#EF4444` (var(--danger))
- **Info**: `#3B82F6` (var(--info))

### Backgrounds
- **Background Primary**: `#F9FAFB` (var(--bg0))
- **Background Secondary**: `#F3F4F6` (var(--bg1))
- **Card**: `#FFFFFF` (var(--card))

### Text Colors
- **Primary Text**: `#1A202C` (var(--text))
- **Secondary Text**: `#4B5563` (var(--text-secondary))
- **Muted Text**: `#6B7280` (var(--muted))
- **Light Muted**: `#9CA3AF` (var(--muted2))

## Typography

- **Font Family**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
- **Page Titles**: 28px, font-weight: 700, color: var(--primary)
- **Card Titles**: 20px, font-weight: 700, color: var(--primary)
- **Labels**: 13px, font-weight: 600, color: var(--text-secondary)
- **Body Text**: 14px, font-weight: 500, color: var(--text)
- **Small Text**: 12px, font-weight: 500, color: var(--muted2)

## Spacing

- **Padding (Cards)**: 24px
- **Margin (Fields)**: 16px
- **Gap (Rows)**: 12px
- **Section Gap**: 20px

## Border Radius

- **Small**: 8px (var(--radius))
- **Medium**: 12px (default)
- **Large**: 16px (var(--radius-lg))
- **Extra Large**: 20px (var(--radius-xl))

## Shadows

- **Shadow Small**: `0 1px 2px rgba(0, 0, 0, 0.05)` (var(--shadow-sm))
- **Shadow Default**: `0 10px 25px rgba(0, 58, 92, 0.08)` (var(--shadow))
- **Shadow Large**: `0 20px 40px rgba(0, 58, 92, 0.12)` (var(--shadow-lg))

## Component Patterns

### Cards
```jsx
<div className="ui-card">
  <div className="ui-card-body">
    <h3 className="ui-card-title">Title</h3>
    <p className="ui-card-sub">Subtitle</p>
    <div className="ui-divider" />
    {/* Content */}
  </div>
</div>
```

### Buttons
- **Primary Button**: `className="ui-btn ui-btn-primary"` - for main actions
- **Secondary Button**: `className="ui-btn ui-btn-secondary"` - for alternative actions
- **Danger Button**: `className="ui-btn ui-btn-danger"` - for destructive actions

### Forms
```jsx
<div className="ui-field">
  <label className="ui-label">Label Text</label>
  <input className="ui-input" type="text" />
</div>
```

### Alerts
- **Info**: `className="ui-alert"`
- **Success**: `className="ui-alert ui-alert-success"`
- **Warning**: `className="ui-alert ui-alert-warning"`
- **Danger**: `className="ui-alert ui-alert-danger"`

### Tables
```jsx
<div className="ui-table-wrap">
  <table className="ui-table">
    <thead>
      <tr><th>Column</th></tr>
    </thead>
    <tbody>
      <tr><td>Data</td></tr>
    </tbody>
  </table>
</div>
```

### Badges & Pills
- **Badge**: `className="ui-badge"` - for role/status labels
- **Pill**: `className="ui-pill"` - for small status indicators
- **Pill Active**: `className="ui-pill ui-pill-on"` - for active states

## Grid Layout

### Main Grid (2-column responsive)
```jsx
<div className="ui-grid">
  <div className="ui-card">...</div>
  <div className="ui-card">...</div>
</div>
```

### Dashboard Layout (sidebar + content)
```jsx
<div className="ui-layout">
  <aside className="ui-sidebar">
    <div className="ui-sidebar-title">Menu</div>
    <div className="ui-sidebar-links">
      <a className="ui-sidelink">Link</a>
    </div>
  </aside>
  <section className="ui-content">Content</section>
</div>
```

## Responsive Breakpoints

- **Mobile**: < 640px (single column, full width)
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

## Animation & Transitions

- **Standard Transition**: `transition: all 0.2s ease`
- **Hover Transform**: `transform: translateY(-1px)` on primary buttons
- **Active Transform**: `transform: scale(0.98)` on button click

## Accessibility

- All buttons use `type="button"` or semantic form elements
- All form inputs have labels with `className="ui-label"`
- Status messages use semantic alert colors
- Mobile navigation uses backdrop overlay
- Sticky header z-index: 50, sidebar z-index: 60, backdrop z-index: 55

## Pages Redesigned

1. ✅ **index.css** - Complete color system and component styles
2. ✅ **Login.jsx** - Full redesign with modern auth flow
3. ✅ **AppShell.jsx** - Updated branding (partial)
4. ✅ **tailwind.config.js** - Extended color palette

## Pages Pending Redesign

Follow the patterns above to redesign remaining pages:

- SuperAdmin.jsx - Replace old inline styles with ui-card, ui-btn-primary, etc.
- SuperAdminCertificates.jsx - Use ui-table-wrap and ui-table classes
- SchoolGenerate.jsx - Use ui-card for form sections, ui-btn for actions
- SchoolRegister.jsx - Use form field patterns
- SchoolCertificates.jsx - Consistency with card layouts
- SchoolProfile.jsx, SchoolSettings.jsx, SchoolTemplates.jsx - Card-based layout
- SchoolStaff.jsx - Use ui-table for staff listings
- SchoolErpImport.jsx - Form + upload component
- StaffDashboard.jsx, StaffTenantCertificates.jsx - Dashboard layouts
- PublicVerify.jsx - Clean verification interface
- CertificateBrowser.jsx - Professional data browser component

## Implementation Tips

1. Replace inline `style` attributes with className utilities
2. Use `ui-grid` for two-column layouts (auto-responsive)
3. Use `ui-layout` + `ui-sidebar` for dashboard pages
4. Always use `ui-card` for card containers
5. Use `ui-btn ui-btn-primary` for primary actions
6. Use status colors for visual feedback (success, danger, warning)
7. Replace old input styles with `ui-input` class
8. Use `ui-divider` for visual separation
9. Use `ui-badge` for tags/statuses in headers
10. Use `ui-pill` for inline status indicators

## Testing Checklist

- All pages display correctly on mobile (< 640px)
- All buttons are clickable and hover states work
- Color contrast meets WCAG AA standards
- Forms have proper labels and validation messaging
- Tables are scrollable on mobile
- Navigation is accessible via keyboard
- All existing API calls and state management preserved
