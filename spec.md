# NEXUS IT PORTAL

## Current State
Full app exists with 10 panels, registration forms, admin dashboard, approval workflow, and Internet Identity auth. Emergency contact panel has incorrect email (contact.admin@microsoft.com) and is missing the alternate email.

## Requested Changes (Diff)

### Add
- Alternate email field (Vickymyapp@india.com) to Emergency Contact panel

### Modify
- Emergency contact primary email: contact.admin@microsoft.com → contact.adminvicky@myapp.com
- Emergency contact card UI: show both primary and alternate email

### Remove
- Nothing

## Implementation Plan
1. Update ROLES array in App.tsx: fix contactEmail, add contactEmailAlt field
2. Update EmergencyContactCard to render both emails and mobile
