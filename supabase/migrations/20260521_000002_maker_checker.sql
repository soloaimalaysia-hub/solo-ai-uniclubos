-- ============================================================
-- UCO Maker-Checker System Migration
-- 20260521_000002_maker_checker
-- ============================================================

-- 1. uco_approvals — pending approval queue
CREATE TABLE IF NOT EXISTS uco_approvals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id         uuid REFERENCES uco_clubs(id) ON DELETE CASCADE,
  module          text NOT NULL,        -- 'finance','activities','members','announcements','history'
  action          text NOT NULL,        -- 'create','edit','delete'
  record_id       uuid,                 -- FK to the row being approved
  record_table    text,                 -- e.g. 'uco_finance'
  submitted_by    uuid REFERENCES uco_users(id),
  submitted_at    timestamptz NOT NULL DEFAULT now(),
  submission_data jsonb,               -- snapshot of the payload
  reviewed_by     uuid REFERENCES uco_users(id),
  reviewed_at     timestamptz,
  review_note     text,
  status          text NOT NULL DEFAULT 'pending',  -- 'pending','approved','rejected'
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- 2. uco_audit_log — immutable log of every approve/reject action
CREATE TABLE IF NOT EXISTS uco_audit_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id      uuid,
  user_id      uuid,
  user_name    text,
  user_role    text,
  module       text,
  action       text,
  record_id    uuid,
  record_table text,
  old_data     jsonb,
  new_data     jsonb,
  ip_address   text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- 3. uco_role_permissions — per-role, per-module permission matrix
CREATE TABLE IF NOT EXISTS uco_role_permissions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id            uuid,              -- NULL = platform default
  role               text NOT NULL,
  module             text NOT NULL,     -- 'finance','activities','members','announcements','history','settings'
  can_view           boolean NOT NULL DEFAULT true,
  can_create         boolean NOT NULL DEFAULT false,
  can_edit           boolean NOT NULL DEFAULT false,
  can_delete         boolean NOT NULL DEFAULT false,
  can_approve        boolean NOT NULL DEFAULT false,
  requires_approval  boolean NOT NULL DEFAULT true,
  created_at         timestamptz NOT NULL DEFAULT now()
);

-- Unique index that handles NULL club_id correctly
CREATE UNIQUE INDEX IF NOT EXISTS uco_role_perm_unique
  ON uco_role_permissions (COALESCE(club_id::text,'__global__'), role, module);

-- 4. ALTER uco_finance — add approval columns
ALTER TABLE uco_finance
  ADD COLUMN IF NOT EXISTS submitted_by    uuid,
  ADD COLUMN IF NOT EXISTS approver_id     uuid,
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS rejection_note  text;

-- 5. ALTER uco_activities — add approval columns
ALTER TABLE uco_activities
  ADD COLUMN IF NOT EXISTS approver_id     uuid,
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS rejection_note  text;

-- 6. ALTER uco_members — add approval columns
ALTER TABLE uco_members
  ADD COLUMN IF NOT EXISTS created_by      uuid,
  ADD COLUMN IF NOT EXISTS approver_id     uuid,
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved';

-- ============================================================
-- 7. Seed default role permissions (club_id = NULL = global default)
-- ============================================================

-- President — full access, no approval needed
INSERT INTO uco_role_permissions (role, module, can_view, can_create, can_edit, can_delete, can_approve, requires_approval) VALUES
  ('President','finance',      true,true,true,true,true,false),
  ('President','activities',   true,true,true,true,true,false),
  ('President','members',      true,true,true,true,true,false),
  ('President','announcements',true,true,true,true,true,false),
  ('President','history',      true,true,true,true,true,false),
  ('President','settings',     true,true,true,true,true,false)
ON CONFLICT DO NOTHING;

-- Captain — same as President
INSERT INTO uco_role_permissions (role, module, can_view, can_create, can_edit, can_delete, can_approve, requires_approval) VALUES
  ('Captain','finance',      true,true,true,true,true,false),
  ('Captain','activities',   true,true,true,true,true,false),
  ('Captain','members',      true,true,true,true,true,false),
  ('Captain','announcements',true,true,true,true,true,false),
  ('Captain','history',      true,true,true,true,true,false),
  ('Captain','settings',     true,true,true,false,false,false),
  ('Vice Captain','finance',      true,true,true,false,true,false),
  ('Vice Captain','activities',   true,true,true,false,true,false),
  ('Vice Captain','members',      true,true,true,false,true,false),
  ('Vice Captain','announcements',true,true,true,false,true,false),
  ('Vice Captain','history',      true,true,true,false,true,false),
  ('Vice Captain','settings',     true,false,false,false,false,false)
ON CONFLICT DO NOTHING;

-- Treasurer — finance full, others view-only
INSERT INTO uco_role_permissions (role, module, can_view, can_create, can_edit, can_delete, can_approve, requires_approval) VALUES
  ('Treasurer','finance',      true,true,true,false,true,false),
  ('Treasurer','activities',   true,false,false,false,false,true),
  ('Treasurer','members',      true,false,false,false,false,true),
  ('Treasurer','announcements',true,false,false,false,false,true),
  ('Treasurer','history',      true,false,false,false,false,true),
  ('Treasurer','settings',     true,false,false,false,false,false)
ON CONFLICT DO NOTHING;

-- Secretary — activities/members/announcements/history create+edit, needs approval
INSERT INTO uco_role_permissions (role, module, can_view, can_create, can_edit, can_delete, can_approve, requires_approval) VALUES
  ('Secretary','finance',      true,false,false,false,false,false),
  ('Secretary','activities',   true,true,true,false,false,true),
  ('Secretary','members',      true,true,true,false,false,true),
  ('Secretary','announcements',true,true,true,false,false,true),
  ('Secretary','history',      true,true,true,false,false,true),
  ('Secretary','settings',     true,false,false,false,false,false)
ON CONFLICT DO NOTHING;

-- Committee — limited create, requires approval
INSERT INTO uco_role_permissions (role, module, can_view, can_create, can_edit, can_delete, can_approve, requires_approval) VALUES
  ('Committee','finance',      true,false,false,false,false,false),
  ('Committee','activities',   true,true,false,false,false,true),
  ('Committee','members',      true,false,false,false,false,false),
  ('Committee','announcements',true,false,false,false,false,false),
  ('Committee','history',      true,true,false,false,false,true),
  ('Committee','settings',     true,false,false,false,false,false)
ON CONFLICT DO NOTHING;

-- Advisor — view only
INSERT INTO uco_role_permissions (role, module, can_view, can_create, can_edit, can_delete, can_approve, requires_approval) VALUES
  ('Advisor','finance',      true,false,false,false,false,false),
  ('Advisor','activities',   true,false,false,false,false,false),
  ('Advisor','members',      true,false,false,false,false,false),
  ('Advisor','announcements',true,false,false,false,false,false),
  ('Advisor','history',      true,false,false,false,false,false),
  ('Advisor','settings',     true,false,false,false,false,false)
ON CONFLICT DO NOTHING;

-- Member — view only (no finance/members)
INSERT INTO uco_role_permissions (role, module, can_view, can_create, can_edit, can_delete, can_approve, requires_approval) VALUES
  ('Member','finance',      false,false,false,false,false,false),
  ('Member','activities',   true,false,false,false,false,false),
  ('Member','members',      false,false,false,false,false,false),
  ('Member','announcements',true,false,false,false,false,false),
  ('Member','history',      true,false,false,false,false,false),
  ('Member','settings',     false,false,false,false,false,false)
ON CONFLICT DO NOTHING;
