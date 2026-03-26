-- ==============================================
-- MIGRATION 016: Multi-Tenant Organizations
-- Creates tenants + tenant_members tables,
-- adds tenant_id to clients, updates RLS.
-- ==============================================

-- ============================================
-- STEP 1: Create tenants table
-- ============================================
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'starter',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenants_owner ON tenants(owner_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);

-- ============================================
-- STEP 2: Create tenant_members junction table
-- ============================================
CREATE TABLE IF NOT EXISTS tenant_members (
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (tenant_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_members_profile ON tenant_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant ON tenant_members(tenant_id);

-- ============================================
-- STEP 3: Add tenant_id to clients table
-- Nullable for backward compatibility with
-- existing clients (will be backfilled below)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE clients ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL;
    CREATE INDEX idx_clients_tenant ON clients(tenant_id);
  END IF;
END $$;

-- ============================================
-- STEP 4: Enable RLS on new tables
-- ============================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: RLS Policies for tenants
-- Users can only see tenants they are members of
-- ============================================

-- SELECT: members can view their tenants
-- Uses owner_id check first (no cross-table), then falls back to membership subquery
CREATE POLICY "Members can view their tenants"
  ON tenants FOR SELECT
  USING (
    owner_id = auth.uid()
    OR id IN (SELECT tenant_id FROM tenant_members WHERE profile_id = auth.uid())
    OR is_admin()
  );

-- INSERT: any authenticated user can create a tenant (they become owner)
CREATE POLICY "Authenticated users can create tenants"
  ON tenants FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- UPDATE: only the tenant owner can update
CREATE POLICY "Tenant owner can update tenant"
  ON tenants FOR UPDATE
  USING (
    owner_id = auth.uid()
    OR is_admin()
  );

-- DELETE: only the tenant owner can delete
CREATE POLICY "Tenant owner can delete tenant"
  ON tenants FOR DELETE
  USING (
    owner_id = auth.uid()
    OR is_admin()
  );

-- ============================================
-- STEP 6: RLS Policies for tenant_members
-- Users can only see memberships for tenants they belong to
-- ============================================

-- SELECT: users can see their own memberships (no self-referencing subquery)
CREATE POLICY "Members can view tenant memberships"
  ON tenant_members FOR SELECT
  USING (
    profile_id = auth.uid()
    OR is_admin()
  );

-- INSERT: owner creating their own membership, or tenant owner adding members
-- Uses tenants.owner_id check instead of self-referencing tenant_members
CREATE POLICY "Tenant owner/admin can add members"
  ON tenant_members FOR INSERT
  WITH CHECK (
    -- Owner creating their own membership (onboarding)
    (profile_id = auth.uid() AND role = 'owner')
    -- Or tenant owner adding someone (checked via tenants table)
    OR EXISTS (
      SELECT 1 FROM tenants t
      WHERE t.id = tenant_id AND t.owner_id = auth.uid()
    )
    OR is_admin()
  );

-- UPDATE: tenant owner can update member roles (via tenants table)
CREATE POLICY "Tenant owner can update member roles"
  ON tenant_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tenants t
      WHERE t.id = tenant_id AND t.owner_id = auth.uid()
    )
    OR is_admin()
  );

-- DELETE: members can leave, tenant owner can remove others (via tenants table)
CREATE POLICY "Tenant owner can remove members or self-leave"
  ON tenant_members FOR DELETE
  USING (
    profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM tenants t
      WHERE t.id = tenant_id AND t.owner_id = auth.uid()
    )
    OR is_admin()
  );

-- ============================================
-- STEP 7: Backfill — create a default tenant
-- for the existing admin user and migrate their
-- existing clients into it
-- ============================================
DO $$
DECLARE
  admin_user_id UUID;
  new_tenant_id UUID;
BEGIN
  -- Find the admin user
  SELECT id INTO admin_user_id FROM profiles WHERE role = 'admin' LIMIT 1;

  IF admin_user_id IS NOT NULL THEN
    -- Check if admin already has a tenant
    IF NOT EXISTS (SELECT 1 FROM tenant_members WHERE profile_id = admin_user_id) THEN
      -- Create default tenant for admin
      INSERT INTO tenants (name, slug, owner_id, plan)
      VALUES ('NexusChat Admin', 'nexuschat-admin', admin_user_id, 'business')
      RETURNING id INTO new_tenant_id;

      -- Add admin as owner member
      INSERT INTO tenant_members (tenant_id, profile_id, role)
      VALUES (new_tenant_id, admin_user_id, 'owner');

      -- Migrate all admin's existing clients to this tenant
      UPDATE clients SET tenant_id = new_tenant_id WHERE user_id = admin_user_id;
    END IF;
  END IF;
END $$;

-- ============================================
-- STEP 8: Update clients RLS to be tenant-aware
-- Users can manage clients belonging to tenants they are members of
-- ============================================

-- Drop old client policies
DROP POLICY IF EXISTS "Users manage own clients" ON clients;

-- New tenant-aware policy: user must be a member of the client's tenant
-- Falls back to user_id check for clients not yet assigned to a tenant
CREATE POLICY "Tenant members manage clients" ON clients FOR ALL
  USING (
    (tenant_id IN (
      SELECT tenant_id FROM tenant_members WHERE profile_id = auth.uid()
    ))
    OR (tenant_id IS NULL AND user_id = auth.uid())
    OR is_admin()
  )
  WITH CHECK (
    (tenant_id IN (
      SELECT tenant_id FROM tenant_members WHERE profile_id = auth.uid()
    ))
    OR (tenant_id IS NULL AND user_id = auth.uid())
    OR is_admin()
  );

-- Keep: "Public can read active client config" (widget needs it)
