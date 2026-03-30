---
name: Admin system and access control
description: Whitelisted admin emails, access_requests table for company registration approval
type: feature
---
Admin emails auto-assigned via trigger on auth.users INSERT:
- EESTEC: it@, chair@, cp@, pr@, fr@, treasurer@, hr@ @eestec-sa.ba
- JobFAIR: head@, cp@, hr@, it@, design@, fr@, pr@ @jobfair.ba

access_requests table stores company registration requests with status (pending/approved/rejected).
Only admins can view/manage requests via has_role() function.

Company users get limited dashboard access (CV baza viewing, own profile editing).
Media/sponsor users can only edit their own info.
