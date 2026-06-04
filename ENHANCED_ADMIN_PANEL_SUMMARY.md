# Enhanced Admin Panel Implementation Plan - Summary

## Overview
This plan expands the initial admin panel implementation to include all requested advanced functionalities:
- Location management with drag & drop markers
- Programmable announcements and health alerts
- Complete CRUD for health centers
- Extended user management
- IA chat configuration
- Advanced analytics dashboard
- General app configuration

## Database Structure (New Supabase Tables)

1. **admin_announcements** - For banners and alerts
   - id, type (banner/alert/promotion), title, message
   - start_date, end_date, is_active
   - created_by, created_at, updated_at
   - Optional targeting: departments, municipalities, user_segments

2. **health_center_overrides** - For location adjustments and center states
   - id, center_id (references original health center)
   - lat_override, lng_override (new coordinates)
   - original_lat, original_lng (for reset functionality)
   - is_active, status (active/inactive/under_maintenance)
   - adjusted_by, adjusted_at, adjustment_reason
   - edit_history (JSON array of previous changes)

3. **ai_configurations** - For IA chat customization
   - id, config_key (system_prompt, reference_centers, temporal_context, etc.)
   - config_value (text/JSON)
   - description
   - updated_by, updated_at

4. **app_settings** - For feature flags and general configuration
   - id, setting_key, setting_value (typed: boolean, string, number, JSON)
   - setting_type
   - description
   - updated_by, updated_at

5. **user_extensions** - For extended user data
   - user_id (references auth.users)
   - is_premium, premium_expiry_date
   - preferences (JSON)
   - last_login_at
   - created_at, updated_at

## Component Architecture

### Enhanced AdminView Navigation
- Location Management (Mapa con D&D)
- Announcements & Promotions
- Health Centers CRUD
- User Management (Extended)
- IA Chat Configuration
- Analytics Dashboard
- General Settings
- Existing: User Management (basic), Health Units (basic), Settings, Analytics

### Key New Components

1. **LocationManagement.tsx**
   - Interactive Leaflet map (similar to CentrosView)
   - Drag & drop markers for health centers
   - Visual indicators: adjusted vs original positions
   - History panel to revert changes
   - Boundary validation (Nicaragua limits)
   - Batch operations: select multiple centers

2. **AnnouncementManagement.tsx**
   - Calendar view for scheduling announcements
   - Form to create: banners, alerts, promotions
   - Date/time picker with recurrence options
   - Preview how announcement will appear in app
   - Active/inactive toggles
   - Expiration automatic handling

3. **HealthCenterCRUD.tsx**
   - Form to add new health centers (beyond JSON files)
   - Edit existing: all fields from JSON + extra (hours, contact person, etc.)
   - Toggle active/inactive/under_maintenance status
   - Soft delete with recovery option
   - View original JSON data vs current overrides
   - Import/export capabilities

4. **UserManagementExtended.tsx**
   - Paginated user list with search/filter
   - Role assignment (admin/user) with confirmation
   - Premium toggle with expiry date setting
   - User statistics: active today/week/month, premium count
   - Last login visibility
   - Export user list (CSV)

5. **IAConfigView.tsx**
   - System prompt editor (large textarea with syntax highlighting)
   - Reference centers manager (add/remove/reorder)
   - Temporal context editor (modify center hours)
   - Test chat interface within the panel
   - Configuration history and rollback
   - Validation: ensure required variables are present

6. **AppAnalytics.tsx**
   - Real-time metrics dashboard
   - User activity: active today/week/month, growth charts
   - Chat usage: total consultations, peak hours, common topics
   - Geographic heatmap of users (if location sharing enabled)
   - Most searched health centers and specialties
   - Performance metrics: response times, error rates
   - Export reports (PDF/CSV)

7. **GeneralSettings.tsx**
   - Feature flags toggle (enable/disable modules)
   - Maintenance mode with custom message
   - Emergency numbers configuration (128, Red Cross, etc.)
   - Default language setting
   - PWA configuration (banner message, enable/disable)
   - App version and build information
   - Backup/restore functionality

## Integration Strategy

### Data Flow
- Admin components ↔ Supabase (direct CRUD)
- User components ← Supabase (read announcements, center overrides, IA config)
- Real-time updates via Supabase subscriptions for critical data
- Fallback to localStorage for immediate UI feedback

### Security Measures
- Route protection: /admin accessible only to role='admin'
- Server-side validation for all mutations
- Audit logs for administrative actions
- Rate limiting on bulk operations
- Input sanitization and XSS protection

### User Experience
- Consistent loading states and error handling
- Confirmation dialogs for destructive actions
- Undo/redo capabilities where appropriate
- Responsive design for tablet/mobile admin access
- Toasts/notifications for successful operations

## Implementation Phases

### Phase 1: Foundation
- Create Supabase tables with proper relationships
- Set up Row Level Security (RLS) policies
- Implement basic CRUD operations for each table
- Test admin route protection and authentication

### Phase 2: Core Functionalities
- Location Management (map with D&D)
- Announcement system (basic banner display)
- Health Centers CRUD (add/edit/delete)
- Extended User Management (roles, premium)

### Phase 3: Advanced Features
- IA Configuration panel
- Analytics dashboard with charts
- General settings and feature flags
- Real-time updates and subscriptions
- Export/import capabilities

### Phase 4: Polish and Integration
- Refine UI/UX consistency
- Add validation and edge case handling
- Implement undo/redo for location changes
- Add comprehensive testing
- Document admin procedures

## Risks and Mitigations

### Risk: Data inconsistency between JSON and overrides
- Mitigation: Clear separation - JSON as source of truth, overrides as modifications
- Show both original and current values in UI

### Risk: Performance with many map markers
- Mitigation: Marker clustering, virtual scrolling for lists
- Limit visible markers based on viewport

### Risk: Concurrent edits causing conflicts
- Mitigation: Last-write-wins with timestamps
- Optional: optimistic locking for critical fields
- Show warning when editing concurrently modified records

### Risk: Announcements showing at wrong times
- Mitigation: Use UTC times with proper timezone conversion
- Show admin their local time with conversion notice
- Test edge cases (midnight, daylight saving)

## Estimated Effort
- Database setup and basic CRUD: 2-3 days
- Location Management (most complex): 3-4 days
- Announcements system: 2 days
- Healthimits CRUD: 2 days
- Extended User Management: 1-2 days
- IA Configuration: 2 days
- Analytics Dashboard: 2-3 days
- General Settings: 1-2 days
- Integration and polishing: 2-3 days
- **Total: ~15-20 development days**

## Success Criteria
- [ ] Admin panel accessible only to users with admin role
- [ ] All CRUD operations work correctly with proper validation
- [ ] Location drag & drop works with visual feedback and history
- [ ] Announcements appear in user app at correct times
- [ ] Health center modifications reflect immediately in CentrosView
- [ ] IA configuration changes affect chat responses
- [ ] Analytics dashboard shows meaningful, accurate metrics
- [ ] Feature flags enable/disable corresponding functionality
- [ ] Maintenance mode displays custom message to all users
- [ ] Emergency numbers can be updated and used correctly
- [ ] Default language setting affects app localization
- [ ] All operations have appropriate loading states and error handling
- [ ] Destructive actions require confirmation
- [ ] Data persists correctly between sessions
- [ ] Mobile/ tablet admin access works reasonably well

This enhanced admin panel will provide comprehensive control over the Salud-Conecta IA application, allowing administrators to manage locations, communications, content, users, and configuration without requiring code changes.